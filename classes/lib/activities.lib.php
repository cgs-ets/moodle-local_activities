<?php

namespace local_activities\lib;

defined('MOODLE_INTERNAL') || die();

require_once(__DIR__.'/activity.class.php');
require_once(__DIR__.'/activities.lib.php');
require_once(__DIR__.'/utils.lib.php');

use \local_activities\lib\Activity;
use \local_activities\lib\activities_lib;
use \local_activities\lib\utils_lib;

/**
 * Activity lib
 */
class activities_lib {

    const ACTIVITY_STATUS_AUTOSAVE = 0;
    const ACTIVITY_STATUS_DRAFT = 1;
    const ACTIVITY_STATUS_INREVIEW = 2;
    const ACTIVITY_STATUS_APPROVED = 3;
    const ACTIVITY_STATUS_CANCELLED = 4;

    const APPROVAL_STATUS_UNAPPROVED = 0;
    const APPROVAL_STATUS_APPROVED = 1;
    const APPROVAL_STATUS_REJECTED = 2;

    /**
     * Insert/update activity from submitted form data.
     *
     * @param array $data
     * @return array
     */
    public static function save_from_data($data) {
        global $USER, $DB;

        //var_export($data); exit;

        $activity = null;

        try {
            // Check if data came through with some valid attributes
            if (!isset($data->id))  {
                throw new \Exception("Submitted data is malformed.");
            }

            if ($data->id > 0) {
                if (!activity::exists($data->id)) {
                    return;
                }
                if (!utils_lib::has_capability_edit_activity($data->id)) {
                    throw new \Exception("Permission denied.");
                    exit;
                }
                $activity = new Activity($data->id);
            } else {
                // Can this user create an activity? Must be a Moodle Admin or Planning staff.
                if (!utils_lib::has_capability_create_activity()) {
                    throw new \Exception("Permission denied.");
                    exit;
                }

                // Create a new activity with data that doesn't change on update.
                $activity = new activity();
                $activity->set('creator', $USER->username);
                $activity->set('status', static::ACTIVITY_STATUS_DRAFT);
                // Generate an idnumber
                $slug = strtolower(trim(preg_replace('/[\s-]+/', '-', preg_replace('/[^A-Za-z0-9-]+/', '-', preg_replace('/[&]/', 'and', preg_replace('/[\']/', '', iconv('UTF-8', 'ASCII//TRANSLIT', $data->activityname))))), '-'));
                do {
                    $random = substr(str_shuffle(MD5(microtime())), 0, 10);
                    $idnumber = $slug.'-'.$random;
                    $exists = $DB->record_exists('activities', ['idnumber' => $idnumber]);
                } while ($exists);
                $activity->set('idnumber', $slug.'-'.$random);
                $activity->save();
            }

            // Save data.
            $activity->set('activityname', $data->activityname);
            $activity->set('campus', $data->campus);
            $activity->set('activitytype', $data->activitytype);
            $activity->set('location', $data->location);
            $activity->set('timestart', $data->timestart);
            $activity->set('timeend', $data->timeend);
            $activity->set('description', $data->description);
            $activity->set('transport', $data->transport);
            $activity->set('cost', $data->cost);
            $activity->set('permissions', $data->permissions);
            $activity->set('permissionstype', $data->permissionstype);
            $activity->set('permissionslimit', $data->permissionslimit);
            $activity->set('permissionsdueby', $data->permissionsdueby);
            $activity->set('riskassessment', $data->riskassessment);
            $activity->set('attachments', $data->attachments);
            $activity->set('otherparticipants', $data->otherparticipants);
            $activity->set('colourcategory', $data->colourcategory);
            $activity->set('displaypublic', $data->displaypublic);
            $activity->set('isactivity', $data->isactivity);
            $activity->set('isassessment', $data->isassessment);
            $activity->set('courseid', $data->courseid);
            $activity->set('assessmenturl', $data->assessmenturl);

            // Set absences flag back to 0 so that absences are cleaned in case of student list change.
            $activity->set('absencesprocessed', 0);
            $activity->set('classrollprocessed', 0);

            //$staffincharge = json_decode($data->staffinchargejson);
            // Default staff in charge.
            if (empty($data->staffincharge)) {
                $activity->set('staffincharge', $USER->username);
                $activity->set('staffinchargejson', json_encode(utils_lib::user_stub($USER->username)));
            } else {
                $staffincharge = array_pop($data->staffincharge);
                $activity->set('staffincharge', $staffincharge->un);
                $activity->set('staffinchargejson', $data->staffinchargejson);
            }

            $activity->set('planningstaffjson', $data->planningstaffjson);
            $activity->set('accompanyingstaffjson', $data->accompanyingstaffjson);
            
            $activity->set('categoriesjson', $data->categoriesjson);
            $areas = json_decode($data->categoriesjson);
            $areas = array_map(function($cat) {
                $split = explode('/', $cat);
                return [end($split)];
            }, $areas);
            $areas = call_user_func_array('array_merge', $areas);
            $areas = array_values(array_unique($areas));
            $activity->set('areasjson', json_encode($areas));
            if (!count($areas) || in_array('CGS Board', $areas)) {
                $activity->set('displaypublic', 0);
            }

            //$activity->set('studentlistjson', $data->studentlistjson);

            $activity->save();

            // Sync the staff lists.
            static::sync_staff_from_data($activity->get('id'), 'planning', $data->planningstaff);
            static::sync_staff_from_data($activity->get('id'), 'accompany', $data->accompanyingstaff);

            // Sync the student list.
            //static::sync_students_from_data($activity->get('id'), $data->studentlist);

            // Generate permissions based on student list.
            //static::generate_permissions($data->id);

            // If sending for review or saving after already in review, determine the approvers based on campus.
            //if ($data->status == locallib::ACTIVITY_STATUS_INREVIEW ||
                //$data->status == locallib::ACTIVITY_STATUS_APPROVED) {
                //static::generate_approvals($originalactivity, $activity);
            //}

        } catch (\Exception $e) {
            // Log and rethrow. 
            // https://stackoverflow.com/questions/5551668/what-are-the-best-practices-for-catching-and-re-throwing-exceptions
            throw $e;
        }

        return array(
            'id' => $activity->get('id'),
            'status' => $activity->get('status'),
        );
    }


    /**
     * Update team staff.
     *
     * @param int $activityid
     * @param string $type coach|assistant
     * @param array $newstaff array of user stub objects
     * @return void
     */
    public static function sync_staff_from_data($activityid, $type, $newstaff) {
        global $DB;

        //var_export($newstaff); exit;

        // Copy usernames into keys.
        $usernames = array_column($newstaff, "un");
        $newstaff = array_combine($usernames, $newstaff);

        // Load existing usernames
        $existingstaffrecs = static::get_staff($activityid, $type, $fields = '*');
        $existingstaff = array_column($existingstaffrecs, "username");
        $existingstaff = array_combine($existingstaff, $existingstaff);

        // Skip over existing staff.
        foreach ($existingstaff as $un) {
            if (array_key_exists($un, $newstaff)) {
                unset($newstaff[$un]);
                unset($existingstaff[$un]);
            }
        }

        // Process inserted staff.
        if (count($newstaff)) {
            $newstaffdata = array_map(function($staff) use ($activityid, $type, $source) {
                $rec = new \stdClass();
                $rec->activityid = $activityid;
                $rec->username = $staff['un'];
                $rec->usertype = $type;
                return $rec;
            }, $newstaff);
            $DB->insert_records('activity_staff', $newstaffdata);
        }

        // Process remove staff.
        if (count($existingstaff)) {
            list($insql, $inparams) = $DB->get_in_or_equal($existingstaff);
            $params = array_merge([$activityid, $type], $inparams);
            $sql = "DELETE FROM {activity_staff} 
            WHERE activityid = ? 
            AND usertype = ? 
            AND username $insql";
            $DB->execute($sql, $params);
        }
    }

    /**
     * Update activity students.
     *
     * @param int $activityid
     * @param array $newstudents
     * @param string $source
     * @return void
     */   
    public static function sync_students_from_data($activityid, $newstudents) {
        global $DB;

        // Copy usernames into keys.
        $newstudents = array_combine($newstudents, $newstudents);

        // Load existing students.
        $existingstudentrecs = static::get_students($activityid);
        $existingstudents = array_column($existingstudentrecs, 'username');
        $existingstudents = array_combine($existingstudents, $existingstudents);

        // Skip over existing students.
        foreach ($existingstudents as $existingun) {
            if (in_array($existingun, $newstudents)) {
                unset($newstudents[$existingun]);
                unset($existingstudents[$existingun]);
            }
        }

        // Process inserted students.
        if (count($newstudents)) {
            $newstudentdata = array_map(function($username) use ($activityid, $source) {
                $rec = new \stdClass();
                $rec->activityid = $activityid;
                $rec->username = $username;
                return $rec;
            }, $newstudents);
            $DB->insert_records('activity_students', $newstudentdata);
        }

        // Process removed students.
        if (count($existingstudents)) {
            list($insql, $inparams) = $DB->get_in_or_equal($existingstudents);
            $params = array_merge([$activityid], $inparams);
            $sql = "DELETE FROM {activity_students} 
            WHERE activityid = ? 
            AND username $insql";
            $DB->execute($sql, $params);
        }
    }

    /**
     * Get staff data for a given team.
     *
     * @param int $activityid
     * @param string $usertype
     * @param string $fields
     * @return array
     */
    public static function get_staff($activityid, $usertype = "*", $fields = "*") {
        global $DB;
        $conds = array('activityid' => $activityid);
        if ($usertype != "*") {
            $conds['usertype'] = $usertype;
        }
        return $DB->get_records('activity_staff', $conds, '', $fields);
    }
    
    /**
     * Get student data from a list of teams.
     *
     * @param array $activitid
     * @return array
     */
    public static function get_students($activitid) {
        global $DB;
        $conds = array('activityid' => $activityid);
        return $DB->get_records('activity_students', $conds);
    }



    /**
     * Get and decorate the data.
     *
     * @param int $id activity id
     * @return array
     */
    public static function get_activity($id) {
        $activity = new Activity($id);
        return $activity->export();
    }
    


 
}