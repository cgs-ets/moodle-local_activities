<?php

namespace local_activities\lib;

defined('MOODLE_INTERNAL') || die();

require_once($CFG->dirroot . '/local/activities/config.php');
require_once(__DIR__.'/activity.class.php');
require_once(__DIR__.'/utils.lib.php');
require_once(__DIR__.'/service.lib.php');
require_once(__DIR__.'/workflow.lib.php');

use \local_activities\lib\Activity;
use \local_activities\lib\utils_lib;
use \local_activities\lib\service_lib;
use \local_activities\lib\workflow_lib;

/**
 * Activity lib
 */
class activities_lib {

    const ACTIVITY_STATUS_AUTOSAVE = 0;
    const ACTIVITY_STATUS_DRAFT = 1;
    const ACTIVITY_STATUS_INREVIEW = 2;
    const ACTIVITY_STATUS_APPROVED = 3;
    const ACTIVITY_STATUS_CANCELLED = 4;

    /** Table to store this persistent model instances. */
    const TABLE = 'activities';
    const TABLE_EXCURSIONS_STUDENTS  = 'activity_students';
    const TABLE_EXCURSIONS_STUDENTS_TEMP  = 'activity_students_temp';
    const TABLE_EXCURSIONS_APPROVALS  = 'activity_approvals';
    const TABLE_EXCURSIONS_COMMENTS = 'activity_comments';
    const TABLE_EXCURSIONS_PERMISSIONS_SEND = 'activity_permissions_send';
    const TABLE_EXCURSIONS_PERMISSIONS = 'activity_permissions';
    const TABLE_EXCURSIONS_STAFF = 'activity_staff';

    /**
     * Insert/update activity from submitted form data.
     *
     * @param array $data
     * @return array
     */
    public static function save_from_data($data) {
        global $USER, $DB;

        $originalactivity = $activity = null;
        $newstatusinfo = (object) array('status' => -1, 'workflow' => []);

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
                $originalactivity = new Activity($data->id);
                $activity = new Activity($data->id);
                if ($data->activitytype == 'excursion' || $data->activitytype == 'incursion') {
                    $activity->set('status', max(static::ACTIVITY_STATUS_DRAFT, $activity->get('status')));
                } else {
                    // If this is a calendar entry or assessment, there is no draft state, it's ether 0 (new), 2 (in review) or 3 (approved)
                    $activity->set('status', max(static::ACTIVITY_STATUS_INREVIEW, $activity->get('status')));
                }
            } else {
                // Can this user create an activity? Must be a Moodle Admin or Planning staff.
                if (!utils_lib::has_capability_create_activity()) {
                    throw new \Exception("Permission denied.");
                    exit;
                }

                // Create a new activity with data that doesn't change on update.
                $activity = new Activity();
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
            $newstatusinfo->status = $activity->get('status');
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
            //$activity->set('riskassessment', $data->riskassessment);
            //$activity->set('attachments', $data->attachments);
            $activity->set('otherparticipants', $data->otherparticipants);
            $activity->set('colourcategory', $data->colourcategory);
            $activity->set('displaypublic', $data->displaypublic);
            $activity->set('isactivity', $data->isactivity);
            $activity->set('isassessment', $data->isassessment);
            $activity->set('courseid', $data->courseid);
            $activity->set('assessmenturl', $data->assessmenturl);
            $activity->set('studentlistjson', $data->studentlistjson);

            // Set absences flag back to 0 so that absences are cleaned in case of student list change.
            $activity->set('absencesprocessed', 0);
            $activity->set('classrollprocessed', 0);

            //$staffincharge = json_decode($data->staffinchargejson);
            // Default staff in charge.
            if (empty($data->staffincharge)) {
                $activity->set('staffincharge', $USER->username);
                $activity->set('staffinchargejson', json_encode(utils_lib::user_stub($USER->username)));
            } else {
                $staffincharge = (object) array_pop($data->staffincharge);
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

            $activity->save();

            // Save RA.
            static::process_files(explode(",", $data->riskassessment), 'riskassessment', $activity->get('id'));
            $riskassessmentck = static::generate_files_changekey('riskassessment', $activity->get('id'));
            $activity->set('riskassessment', $riskassessmentck);

            // Save attachments.
            static::process_files(explode(",", $data->attachments), 'attachments', $activity->get('id'));
            $additionalfilesck = static::generate_files_changekey('attachments', $activity->get('id'));
            $activity->set('attachments', $additionalfilesck);
            $activity->save();

            // Sync the staff lists.
            static::sync_staff_from_data($activity->get('id'), 'planning', $data->planningstaff);
            static::sync_staff_from_data($activity->get('id'), 'accompany', $data->accompanyingstaff);

            // Sync the student list.
            $studentusernames = array_map(function($u) {
                return $u['un'];
            }, $data->studentlist);
            static::sync_students_from_data($activity->get('id'), $studentusernames);

            // Generate permissions based on student list.
            //static::generate_permissions($data->id);

            // If saving after already in review or approved, determine the approvers based on campus.
            if ($originalactivity && 
                ($data->status == static::ACTIVITY_STATUS_INREVIEW || $data->status == static::ACTIVITY_STATUS_APPROVED) &&
                ($data->activitytype == 'excursion' || $data->activitytype == 'incursion')
            ) {
                $newstatusinfo = workflow_lib::generate_approvals($originalactivity, $activity);
            } /*else if ($data->activitytype == 'calendar' || $data->activitytype == 'assessment') {
                $newstatusinfo->status = static::ACTIVITY_STATUS_DRAFT;
            }*/

        } catch (\Exception $e) {
            // Log and rethrow. 
            // https://stackoverflow.com/questions/5551668/what-are-the-best-practices-for-catching-and-re-throwing-exceptions
            throw $e;
        }

        //$newstatusinfo = workflow_lib::check_status($activity->get('id'), null, true);

        return array(
            'id' => $activity->get('id'),
            'status' => $newstatusinfo->status,
            'workflow' => $newstatusinfo->workflow,
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
     * @param array $activityid
     * @return array
     */
    public static function get_students($activityid) {
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


     /**
     * Update status and trigger effects.
     *
     * @param int $activityid 
     * @param int $status the new status.
     * @return
     */
    public static function update_status($activityid, $status) {
        global $DB;

        if (!activity::exists($activityid)) {
            return;
        }
        if (!utils_lib::has_capability_edit_activity($activityid)) {
            throw new \Exception("Permission denied.");
            exit;
        }
        $originalactivity = new Activity($activityid);
        $activity = new Activity($activityid);
        $activity->set('status', $status);
        $activity->save();

 
        // If going to draft, remove any existing approvals.
        if ($status <= static::ACTIVITY_STATUS_DRAFT) {
            $sql = "UPDATE mdl_activity_approvals
                    SET invalidated = 1
                    WHERE activityid = ?
                    AND invalidated = 0";
            $params = array($activityid);
            $DB->execute($sql, $params);

            // Reset public now.
            $activity->set('pushpublic', 0);
            $activity->save();
        }

        // If sending for review, determine the approvers.
        $newstatusinfo = (object) array('status' => $status, 'workflow' => []);
        if ($status == static::ACTIVITY_STATUS_INREVIEW) {
            $newstatusinfo = workflow_lib::generate_approvals($originalactivity, $activity);
        }

        return array(
            'id' => $activityid,
            'status' => $newstatusinfo->status,
            'workflow' => $newstatusinfo->workflow,
        );
    }



    

    
    



































    private static function generate_permissions($activityid) {
        global $DB, $USER;

        $activity = new static($activityid);
        if (empty($activity)) {
            return;
        }

        // Generate permissions for saved students.
        $students = static::get_excursion_students($activityid);
        foreach ($students as $student) {
            // Find the student's mentors.
            $user = \core_user::get_user_by_username($student->username);
            if (empty($user)) {
                continue;
            }
            $mentors = static::get_users_mentors($user->id);
            foreach ($mentors as $mentor) {
                // Only insert this if it doesn't exist.
                $exists = $DB->record_exists(activity::TABLE_EXCURSIONS_PERMISSIONS, array(
                    'activityid' => $activityid,
                    'studentusername' => $student->username,
                    'parentusername' => $mentor,
                ));

                if (!$exists) {
                    // Create a permissions record for each mentor.
                    $permission = new \stdClass();
                    $permission->activityid = $activityid;
                    $permission->studentusername = $student->username;
                    $permission->parentusername = $mentor;
                    $permission->queueforsending = 0;
                    $permission->queuesendid = 0;
                    $permission->response = 0;
                    $permission->timecreated = time();
                    $DB->insert_record(activity::TABLE_EXCURSIONS_PERMISSIONS, $permission);
                }
            }
        }
    }

    public static function get_changed_fields($originalactivity, $newactivity) {
        $changed = array();

        $originalvars = (array) $originalactivity->get_data();
        $newvars = (array) $newactivity->get_data();

        foreach ($originalvars as $key => $val) {
            if ($val != $newvars[$key]) {
                $label = $key;
                if ($key == "permissionstype") {
                    $label = 'Permission invite type';
                }
                if ($key == "permissionslimit") {
                    $label = 'Permissions limit';
                }
                if ($key == "permissionsdueby") {
                    $label = 'Permission due by date';
                }
                if (empty($label)) {
                    $label = $key;
                }
                $changed[$key] = array(
                    'field' => $key,
                    'label' => $label,
                    'originalval' => $val,
                    'newval' => $newvars[$key],
                );
            }
        }

        //unset unnecessary fields
        unset($changed['usermodified']);
        unset($changed['timemodified']);

        return $changed;
    }

    public static function search($text) {
        global $DB;

        $sql = "SELECT * 
                    ,case
                        when status = 0 OR status = 1 then 1
                        else 0
                    end as isdraft
                    ,case
                        when timeend < " . time() . " then 1
                        else 0
                    end as ispastevent
                  FROM {" . static::TABLE . "}
                 WHERE deleted = 0
                   AND (activityname LIKE ? OR username LIKE ? OR staffinchargejson LIKE ?)
              ORDER BY isdraft DESC, ispastevent ASC, timestart DESC";
        $params = array();
        $params[] = '%'.$text.'%';
        $params[] = '%'.$text.'%';
        $params[] = '%'.$text.'%';
        //echo "<pre>"; var_export($sql); var_export($params); exit;

        $records = $DB->get_records_sql($sql, $params);
        $activities = array();
        foreach ($records as $record) {
            $activities[] = new static($record->id, $record);
        }

        return $activities;
    }

    public static function get_for_user($username) {
        global $DB;

        $sql = "SELECT * 
                    ,case
                        when status = 0 OR status = 1 then 1
                        else 0
                    end as isdraft
                    ,case
                        when timeend < " . time() . " then 1
                        else 0
                    end as ispastevent
                  FROM {" . static::TABLE . "}
                 WHERE deleted = 0
                   AND username = ?
              ORDER BY isdraft DESC, ispastevent ASC, timestart DESC";
        $params = array($username);

        $records = $DB->get_records_sql($sql, $params);
        $activities = array();
        foreach ($records as $record) {
            $activities[] = new static($record->id, $record);
        }

        return $activities;
    }


    public static function get_for_plannner($username) {
        global $DB;

        $activities = array();

        $sql = "SELECT id
                FROM {" . static::TABLE . "}
                WHERE deleted = 0
                AND ( timemodified > " . strtotime("-3 months") . " OR timeend >=  " . time() . " )
                AND username = ?";
        $useractivities = $DB->get_records_sql($sql, array($username));
        $useractivityids = array_column($useractivities, 'id');

        $sql = "SELECT id, activityid
                    FROM {" . static::TABLE_EXCURSIONS_PLANNING_STAFF. "} 
                    WHERE username = ?";
        $planningstaff = $DB->get_records_sql($sql, array($username));
        $planningids = array_column($planningstaff, 'activityid');
        
        $activities = static::get_by_ids(array_merge($planningids, $useractivityids));

        return $activities;
    }




    public static function get_for_auditor($username) {
        global $DB;

        $user = \core_user::get_user_by_username($username);
        
        if ( ! has_capability('local/excursions:audit', \context_system::instance(), null, false)) {
            return array();
        }

        $sql = "SELECT *
                    ,case
                        when status = 0 OR status = 1 then 1
                        else 0
                    end as isdraft
                    ,case
                        when timeend < " . time() . " then 1
                        else 0
                    end as ispastevent
                  FROM {" . static::TABLE . "}
                 WHERE deleted = 0
                   AND ( timemodified > " . strtotime("-3 months") . " OR timeend >=  " . time() . " )
                   AND status != " . static::ACTIVITY_STATUS_AUTOSAVE . "
                   AND status != " . static::ACTIVITY_STATUS_DRAFT . "
              ORDER BY isdraft DESC, ispastevent ASC, timestart DESC";
        $records = $DB->get_records_sql($sql, array());
        
        $activities = array();
        foreach ($records as $record) {
            $activities[] = new static($record->id, $record);
        }

        return $activities;
    }

    public static function get_for_parent($username) {
        global $DB;

        $activities = array();

        $sql = "SELECT id, activityid
                  FROM {" . static::TABLE_EXCURSIONS_PERMISSIONS . "} 
                 WHERE parentusername = ?";
        $ids = $DB->get_records_sql($sql, array($username));

        $activities = static::get_by_ids(array_column($ids, 'activityid'), 3); // Approved only.

        return $activities;
    }

    public static function get_for_student($username) {
        global $DB;

        $activities = array();

        $sql = "SELECT id, activityid
                  FROM {" . static::TABLE_EXCURSIONS_STUDENTS . "} 
                 WHERE username = ?";
        $ids = $DB->get_records_sql($sql, array($username));

        $activities = static::get_by_ids(array_column($ids, 'activityid'), 3); // Approved only.
        foreach ($activities as $i => $activity) {
            if ($activity->get('permissions')) {
                $attending = static::get_all_attending($activity->get('id'));
                if (!in_array($username, $attending)) {
                    unset($activities[$i]);
                }
            }
        }

        return array_filter($activities);
    }

    
    public static function get_for_primary($username) {
        global $DB;

        $activities = array();

        // Check if the user is a primary school staff member.
        $user = core_user::get_user_by_username($username);
        profile_load_custom_fields($user);
        $campusroles = strtolower($user->profile['CampusRoles']);
        $userisps = false;
        $primarycampuses = array(
            'Primary School:Admin Staff',
            'Primary Red Hill:Staff',
            'Whole School:Admin Staff',
            'Northside:Staff',
            'Early Learning Centre:Staff',
        );
        foreach ($primarycampuses as $primarycampus) {
            if (strpos($campusroles, strtolower($primarycampus)) !== false) {
                $userisps = true;
                break;
            }
        }

        if ($userisps) {
            // Get activities where campus is 'primary'.
            $sql = "SELECT *
                        ,case
                            when timeend < " . time() . " then 1
                            else 0
                        end as ispastevent
                      FROM {" . static::TABLE . "}
                     WHERE deleted = 0
                       AND ( timemodified > " . strtotime("-3 months") . " OR timeend >=  " . time() . " )
                       AND status = 3
                       AND campus = 'primary'
                  ORDER BY ispastevent ASC, timestart DESC";

            // If auditor...
            if (has_capability('local/excursions:audit', \context_system::instance(), null, false)) {
                $sql = "SELECT *
                            ,case
                                when timeend < " . time() . " then 1
                                else 0
                            end as ispastevent
                        FROM {" . static::TABLE . "}
                        WHERE deleted = 0
                            AND ( timemodified > " . strtotime("-3 months") . " OR timeend >=  " . time() . " )
                            AND status != " . static::ACTIVITY_STATUS_AUTOSAVE . "
                            AND status != " . static::ACTIVITY_STATUS_DRAFT . "
                            AND campus = 'primary'
                        ORDER BY ispastevent ASC, timestart DESC";
            }
            $records = $DB->get_records_sql($sql);

            $activities = array();
            foreach ($records as $record) {
                $activities[] = new static($record->id, $record);
            }
        }

        return $activities;
    }

    public static function get_for_senior($username) {
        global $DB;

        $activities = array();

        // Check if the user is a primary school staff member.
        $user = core_user::get_user_by_username($username);
        profile_load_custom_fields($user);
        $campusroles = strtolower($user->profile['CampusRoles']);
        $userisss = false;
        $seniorcampuses = array(
            'Senior School:Staff',
            'Whole School:Admin Staff',
        );
        foreach ($seniorcampuses as $seniorcampus) {
            if (strpos($campusroles, strtolower($seniorcampus)) !== false) {
                $userisss = true;
                break;
            }
        }

        if ($userisss) {
            // Get activities where campus is 'senior'.
            $sql = "SELECT *
                        ,case
                            when timeend < " . time() . " then 1
                            else 0
                        end as ispastevent
                      FROM {" . static::TABLE . "}
                     WHERE deleted = 0
                       AND ( timemodified > " . strtotime("-3 months") . " OR timeend >=  " . time() . " )
                       AND status = 3
                       AND campus = 'senior'
                  ORDER BY ispastevent ASC, timestart DESC";
            // If auditor...
            if (has_capability('local/excursions:audit', \context_system::instance(), null, false)) {
                $sql = "SELECT *
                            ,case
                                when timeend < " . time() . " then 1
                                else 0
                            end as ispastevent
                        FROM {" . static::TABLE . "}
                        WHERE deleted = 0
                            AND ( timemodified > " . strtotime("-3 months") . " OR timeend >=  " . time() . " )
                            AND status != " . static::ACTIVITY_STATUS_AUTOSAVE . "
                            AND status != " . static::ACTIVITY_STATUS_DRAFT . "
                            AND campus = 'senior'
                        ORDER BY ispastevent ASC, timestart DESC";
            }
            $records = $DB->get_records_sql($sql);
            $activities = array();
            foreach ($records as $record) {
                $activities[] = new static($record->id, $record);
            }
        }

        return $activities;
    }

    public static function get_by_ids($ids, $status = null, $orderby = null) {
        global $DB;

        $activities = array();

        if ($ids) {
            $activityids = array_unique($ids);
            list($insql, $inparams) = $DB->get_in_or_equal($activityids);
            $sql = "SELECT *
                        ,case
                            when status = 0 OR status = 1 then 1
                            else 0
                        end as isdraft
                        ,case
                            when timeend < " . time() . " then 1
                            else 0
                        end as ispastevent
                      FROM {" . static::TABLE . "}
                     WHERE id $insql
                       AND deleted = 0
                       ";

            if ($status) {
                $sql .= " AND status = {$status} ";
            }

            if (empty($orderby)) {
                $orderby = 'isdraft DESC, ispastevent ASC, timestart DESC';
            }
            $sql .= " ORDER BY " . $orderby;

            $records = $DB->get_records_sql($sql, $inparams);
            $activities = array();
            foreach ($records as $record) {
                $activities[] = new static($record->id, $record);
            }
        }

        return $activities;
    }

    public static function get_for_approver($username, $sortby = '') {
        global $DB;

        $activities = array();

        $approvertypes = static::get_approver_types($username);
        if ($approvertypes) {
            // The user has approver types. Check if any activities need this approval.
            list($insql, $inparams) = $DB->get_in_or_equal($approvertypes);
            $sql = "SELECT id, activityid, type
                      FROM mdl_activity_approvals
                     WHERE type $insql
                       AND invalidated = 0
                       AND skip = 0";
            $approvals = $DB->get_records_sql($sql, $inparams);
            $approvals = static::filter_approvals_with_prerequisites($approvals);
            $orderby = '';
            if ($sortby == 'created') {
                $orderby = 'timecreated DESC';
            }
            if ($sortby == 'start') {
                $orderby = 'timestart ASC';
            }
            $activities = static::get_by_ids(array_column($approvals, 'activityid'), null, $orderby); 
        }

        return $activities;
    }

    public static function get_for_accompanying($username) {
        global $DB;

        $activities = array();

        $sql = "SELECT id, activityid
                  FROM {" . static::TABLE_EXCURSIONS_STAFF. "} 
                 WHERE username = ?";
        $staff = $DB->get_records_sql($sql, array($username));
        $accompanyingids = array_column($staff, 'activityid');

        $sql = "SELECT id
                  FROM {" . static::TABLE. "} 
                 WHERE staffincharge = ?
                 AND ( timemodified > " . strtotime("-3 months") . " OR timeend >=  " . time() . " )
                 ";
        $staff = $DB->get_records_sql($sql, array($username));
        $staffinchargeids = array_column($staff, 'id');

        $activities = static::get_by_ids(array_merge($accompanyingids, $staffinchargeids));

        return $activities;
    }

    public static function get_for_absences($now, $startlimit, $endlimit) {
        global $DB;

        // Activies must:
        // - be approved.
        // - be unprocessed since the last change.
        // - start within the next two weeks ($startlimit) OR
        // - currently running OR
        // - ended within the past 7 days ($endlimit)  OR
        $sql = "SELECT *
                  FROM {" . static::TABLE . "}
                 WHERE absencesprocessed = 0
                   AND (
                    (timestart <= {$startlimit} AND timestart >= {$now}) OR
                    (timestart <= {$now} AND timeend >= {$now}) OR
                    (timeend >= {$endlimit} AND timeend <= {$now})
                   )
                   AND status = " . static::ACTIVITY_STATUS_APPROVED;
        $records = $DB->get_records_sql($sql, null);
        $activities = array();
        foreach ($records as $record) {
            $activities[] = new static($record->id, $record);
        }
        
        return $activities;
    }

    public static function get_for_roll_creation($now, $startlimit) {
        global $DB;

        // Activies must:
        // - be approved.
        // - be unprocessed since the last change.
        // - start within the next x days ($startlimit) OR
        // - currently running OR
        $sql = "SELECT *
                  FROM {" . static::TABLE . "}
                 WHERE classrollprocessed = 0
                   AND (
                    (timestart <= {$startlimit} AND timestart >= {$now}) OR
                    (timestart <= {$now} AND timeend >= {$now})
                   )
                   AND status = " . static::ACTIVITY_STATUS_APPROVED;
        $records = $DB->get_records_sql($sql, null);
        $activities = array();
        foreach ($records as $record) {
            $activities[] = new static($record->id, $record);
        }
        
        return $activities;
    }

    public static function get_for_attendance_reminders() {
        global $DB;

        $now = time();
        $sql = "SELECT *
                  FROM {" . static::TABLE . "}
                 WHERE remindersprocessed = 0
                   AND deleted = 0
                   AND timeend <= {$now}
                   AND status = " . static::ACTIVITY_STATUS_APPROVED;
        $records = $DB->get_records_sql($sql, null);
        $activities = array();
        foreach ($records as $record) {
            $activities[] = new static($record->id, $record);
        }
        
        return $activities;
    }


    public static function get_for_approval_reminders($rangestart, $rangeend) {
        global $DB;

        // Activies must:
        // - be unapproved.
        // - starting in x days ($rangestart)
        $sql = "SELECT *
                  FROM {" . static::TABLE . "}
                 WHERE timestart >= {$rangestart} AND timestart <= {$rangeend}
                   AND (
                    status = " . static::ACTIVITY_STATUS_DRAFT ." OR 
                    status = " . static::ACTIVITY_STATUS_INREVIEW . "
                   )
                   AND deleted = 0";
        $records = $DB->get_records_sql($sql, null);
        $activities = array();
        foreach ($records as $record) {
            $activities[] = new static($record->id, $record);
        }
        
        return $activities;
    }

    public static function filter_approvals_with_prerequisites($approvals) {
        foreach ($approvals as $i => $approval) {
            // Exlude if waiting for a prerequisite.
            $prerequisites = static::get_prerequisites($approval->activityid, $approval->type);
            if ($prerequisites) {
                unset($approvals[$i]);
            }
        }
        return $approvals;
    }

    public static function get_notices($activityid, $approvals) {
        global $DB;

        $notices = array();

        // Check to see if activity has existing absences.
        foreach ($approvals as $approval) {
            // There is only a small window when this is available to avoid deletion of new absences.
            // If it is an "admin" approval and user can approve it, and the approval is still 0 and it is not skipped.
            if (strpos($approval->type, 'admin') !== false && 
                isset($approval->canapprove) &&
                $approval->status == 0 &&
                $approval->skip == 0 ) {

                $config = get_config('local_activities');
                if ($config->checkabsencesql && $config->dbhost) {
                    $externalDB = \moodle_database::get_driver_instance($config->dbtype, 'native', true);
                    $externalDB->connect($config->dbhost, $config->dbuser, $config->dbpass, $config->dbname, '');
                    $sql = $config->checkabsencesql . ' :username, :leavingdate, :returningdate, :comment';
                    $params = array(
                        'username' => '*',
                        'leavingdate' => '1800-01-01',
                        'returningdate' =>  '9999-01-01',
                        'comment' => '#ID-' . $activityid,
                    );
                    $absenceevents = $externalDB->get_field_sql($sql, $params);
                    if ($absenceevents) {
                        $notices[] = array(
                            'text' => 'Absences exist for previous dates which have since changed in the form. New absences will be added if this activity is approved. Click the icon to delete previous absences created for this activity. Ignore this notice to retain previous absences.', 
                            'action' => 'action-delete-absences',
                            'description' => 'Delete previous absences',
                            'icon' => '<i class="fa fa-trash-o" aria-hidden="true"></i>',
                        );
                    }
                }
                // Don't need to do any more checking.
                break;
            }
        }

        return $notices;
    }

    public static function delete_existing_absences($activityid) {

        if (! (is_int($activityid) && $activityid > 0) ) {
            return false;
        }

        // Some basic security - check if user is an approver in this activity.
        $isapprover = workflow_lib::is_approver_of_activity($activityid);

        $config = get_config('local_activities');
        $externalDB = \moodle_database::get_driver_instance($config->dbtype, 'native', true);
        $externalDB->connect($config->dbhost, $config->dbuser, $config->dbpass, $config->dbname, '');
        $sql = $config->deleteabsencessql . ' :leavingdate, :returningdate, :comment, :studentscsv';
        $params = array(
            'leavingdate' => '1800-01-01',
            'returningdate' =>  '9999-01-01',
            'comment' => '#ID-' . $activityid,
            'studentscsv' => '0',
        );
        $externalDB->execute($sql, $params);
        return true;

    }

    /*
    * Save a draft of the activity, used by the auto-save service. At present, the only
    * field auto-saved is the activity name.
    */
    public static function save_draft($formdata) {
        // Some validation.
        if (empty($formdata->id)) {
            return;
        }

        // Save the activity name.
        $activity = new static($formdata->id);
        if ($formdata->activityname) {
            $activity->set('activityname', $formdata->activityname);
            $activity->save();
        }

        return $activity->get('id');
    }
    

    public static function regenerate_student_list($data) {
        global $PAGE, $DB, $OUTPUT;

        $activity = new static($data->activityid);

        // Update the student list for the activity.
        if (empty($activity)) {
            return '';
        }

        $activityexporter = new activity_exporter($activity);
        $output = $PAGE->get_renderer('core');
        $activity = $activityexporter->export($output);

        // Get current student list.
        $existinglist = array_column(static::get_excursion_students_temp($data->activityid), 'username');

        // Only add students that are not already in the list.
        $newstudents = $data->users;
        if ($existinglist) {
            $newstudents = array();
            foreach ($data->users as $username) {
                if (!in_array($username, $existinglist)) {
                    $newstudents[] = $username;
                }
            }
        }

        // Remove the users that are no longer to be in the list.
        $deletefromlist = array_diff($existinglist, $data->users);
        foreach ($deletefromlist as $username) {
            $DB->delete_records(static::TABLE_EXCURSIONS_STUDENTS_TEMP, array(
                'activityid' => $data->activityid,
                'username' => $username,
            ));
        }

        // Insert the new usernames.
        foreach ($newstudents as $username) {
            $record = new \stdClass();
            $record->activityid = $data->activityid;
            $record->username = $username;
            $id = $DB->insert_record(static::TABLE_EXCURSIONS_STUDENTS_TEMP, $record);
        }

        $students = array();
        // Get the students permissions.
        foreach ($data->users as $username) {
            $student = static::get_user_display_info($username);
            $student->uptodate = static::get_studentdatacheck($username);
            $student->sisconsent = static::get_excursionconsent($username);
            $permissions = array_values(static::get_student_permissions($data->activityid, $username));
            $student->permissions = array();
            foreach ($permissions as $permission) {
                $parent = static::get_user_display_info($permission->parentusername);
                $parent->response = $permission->response;
                $parent->noresponse = ($permission->response == 0);
                $parent->responseisyes = ($permission->response == 1);
                $parent->responseisno = ($permission->response == 2);
                $student->permissions[] = $parent;
            }
            $students[] = $student;
        }
        usort($students, function($a, $b) {
            return strcmp($a->fullnamereverse, $b->fullnamereverse);
        });

        // Generate and return the new students in html rows.
        $data = array(
            'activity' => $activity,
            'students' => $students,
        );

        return $OUTPUT->render_from_template('local_activities/activityform_studentlist_rows', $data);
    }

    /**
    * Gets all of the activity students.
    *
    * @param int $postid.
    * @return array.
    */
    public static function get_excursion_students($activityid) {
        global $DB;
        $sql = "SELECT *
                  FROM {" . static::TABLE_EXCURSIONS_STUDENTS . "}
                 WHERE activityid = ?";
        $params = array($activityid);
        $students = $DB->get_records_sql($sql, $params);
        return $students;
    }

    /**
    * Gets all of the activity students.
    *
    * @param int $postid.
    * @return array.
    */
    public static function get_excursion_students_temp($activityid) {
        global $DB;
        $sql = "SELECT *
                  FROM {" . static::TABLE_EXCURSIONS_STUDENTS_TEMP . "}
                 WHERE activityid = ?";
        $params = array($activityid);
        $students = $DB->get_records_sql($sql, $params);
        return $students;
    }


    /*
    * Add a comment to an activity.
    */
    public static function post_comment($activityid, $comment) {
        global $USER, $DB;

        if (!static::record_exists($activityid)) {
            return 0;
        }

        // Save the comment.
        $record = new \stdClass();
        $record->username = $USER->username;
        $record->activityid = $activityid;
        $record->comment = $comment;
        $record->timecreated = time();
        $record->id = $DB->insert_record(static::TABLE_EXCURSIONS_COMMENTS, $record);

        static::send_comment_emails($record);

        return $record->id;
    }

    /*
    * Delete a comment
    */
    public static function delete_comment($commentid) {
        global $USER, $DB;

        $DB->delete_records(static::TABLE_EXCURSIONS_COMMENTS, array(
            'id' => $commentid,
            'username' => $USER->username,
        ));

        return 1;
    }

    /*
    * Add a comment to an activity.
    */
    public static function load_comments($activityid) {
        global $USER, $DB, $PAGE, $OUTPUT;

        if (!static::record_exists($activityid)) {
            return 0;
        }

        $sql = "SELECT *
                  FROM {" . static::TABLE_EXCURSIONS_COMMENTS . "}
                 WHERE activityid = ?
              ORDER BY timecreated DESC";
        $params = array($activityid);
        $records = $DB->get_records_sql($sql, $params);
        $comments = array();
        foreach ($records as $record) {
            $comment = new \stdClass();
            $comment->id = $record->id;
            $comment->activityid = $record->activityid;
            $comment->username = $record->username;
            $comment->comment = $record->comment;
            $comment->timecreated = $record->timecreated;
            $comment->readabletime = date('g:ia, j M', $record->timecreated);
            $user = \core_user::get_user_by_username($record->username);
            $userphoto = new \user_picture($user);
            $userphoto->size = 2; // Size f2.
            $comment->userphoto = $userphoto->get_url($PAGE)->out(false);
            $comment->userfullname = fullname($user);
            $comment->isauthor = ($comment->username == $USER->username);
            $comments[] = $comment;
        }

        return $OUTPUT->render_from_template('local_activities/activityform_approvals_comments', array('comments' => $comments));
    }

    /*
    * Enable permissions
    */
    public static function enable_permissions($activityid, $checked) {
        $activity = new static($activityid);
        $activity->set('permissions', $checked);
        $activity->save();
    }

    /*
    * Send permissions
    */
    public static function send_permissions($activityid, $limit, $dueby, $users, $extratext) {
        global $USER, $DB;

        // Convert due by json array to timestamp.
        $dueby = json_decode($dueby);
        $duebystring = "{$dueby[2]}-{$dueby[1]}-{$dueby[0]} {$dueby[3]}:{$dueby[4]}"; // Format yyyy-m-d h:m.
        $dueby = strtotime($duebystring);

        if (empty($limit)) {
            $limit = 0;
        }

        // Save due by and limit.
        $activity = new static($activityid);
        $activity->set('permissionstype', 'system');
        if ($limit) {
            $activity->set('permissionslimit', $limit);
        }
        if ($dueby) {
            $activity->set('permissionsdueby', $dueby);
        }
        $activity->save();

        // Queue an email.
        $rec = new \stdClass();
        $rec->activityid = $activityid;
        $rec->username = $USER->username;
        $rec->studentsjson = $users;
        $rec->extratext = $extratext;
        $rec->timecreated = time();
        $DB->insert_record(static::TABLE_EXCURSIONS_PERMISSIONS_SEND, $rec);
    }


    /*
    * Emails the comment to all parties involved. Comments are sent to:
    * - Next approver in line
    * - Approvers that have already actioned approval
    * - Activity creator
    * - Comment poster
    * - Staff in charge
    */
    protected static function send_comment_emails($comment) {
        global $PAGE;

        $activity = new Activity($comment->activityid);
        $activity = $activity->export();

        $recipients = array();

        // Send the comment to the next approver in line.
        $approvals = static::get_unactioned_approvals($comment->activityid);
        foreach ($approvals as $nextapproval) {
            $approvers = static::WORKFLOW[$nextapproval->type]['approvers'];
            foreach($approvers as $approver) {
                // Skip if approver does not want this notification.
                if (isset($approver['notifications']) && !in_array('newcomment', $approver['notifications'])) {
                    continue;
                }
                // Check email contacts.
                if ($approver['contacts']) {
                    foreach ($approver['contacts'] as $email) {
                        static::send_comment_email($activity, $comment, $approver['username'], $email);
                        $recipients[] = $approver['username'];
                    }
                } else {
                    if ( ! in_array($approver['username'], $recipients)) {
                        static::send_comment_email($activity, $comment, $approver['username']);
                        $recipients[] = $approver['username'];
                    }
                }
            }
            // Break after sending to next approver in line. Comment is not sent to approvers down stream.
            break;
        }

        // Send comment to approvers that have already actioned an approval for this activity.
        $approvals = static::get_approvals($comment->activityid);
        foreach ($approvals as $approval) {
            if ( ! in_array($approval->username, $recipients)) {

                // Skip if approver does not want this notification.
                $config = static::WORKFLOW[$approval->type]['approvers'];
                if (isset($config[$approval->username]) && 
                    isset($config[$approval->username]['notifications']) && 
                    !in_array('newcomment', $config[$approval->username]['notifications'])) {
                        continue;
                }
            
                static::send_comment_email($activity, $comment, $approval->username);
                $recipients[] = $approval->username;
            }
        }

        // Send comment to activity creator.
        if ( ! in_array($activity->username, $recipients)) {
            static::send_comment_email($activity, $comment, $activity->username);
            $recipients[] = $activity->username;
        }

        // Send comment to the comment poster if they are not one of the above.
        if ( ! in_array($USER->username, $recipients)) {
            static::send_comment_email($activity, $comment, $USER->username);
            $recipients[] = $USER->username;
        }

        // Send to staff in charge.
        if ( ! in_array($activity->staffincharge, $recipients)) {
            static::send_comment_email($activity, $comment, $activity->staffincharge);
            $recipients[] = $activity->staffincharge;
        }

    }

    protected static function send_comment_email($activity, $comment, $recipient, $email = null) {
        global $USER, $PAGE;

        $toUser = \core_user::get_user_by_username($recipient);
        if ($email) {
            // Override the email address.
            $toUser->email = $email;
        }

        $data = array(
            'user' => $USER,
            'activity' => $activity,
            'comment' => $comment,
        );

        $subject = "Comment re: " . $activity->activityname;
        $output = $PAGE->get_renderer('core');
        $messageText = $output->render_from_template('local_activities/email_comment_text', $data);
        $messageHtml = $output->render_from_template('local_activities/email_comment_html', $data);
        $result = email_to_user($toUser, $USER, $subject, $messageText, $messageHtml, '', '', true);
    }

    
    public static function get_messagehistory($activityid) {
        global $DB;

        $activity = new static($activityid);
        if (empty($activity)) {
            return [];
        }

        $sql = "SELECT *
                  FROM {" . static::TABLE_EXCURSIONS_PERMISSIONS_SEND . "}
                 WHERE activityid = ?
              ORDER BY timecreated DESC";
        $params = array($activityid);
        $messagehistory = $DB->get_records_sql($sql, $params);

        return $messagehistory;
    }

    public static function get_messagehistory_html($activityid) {
        global $PAGE;

        $activity = new static($activityid);
        $activityexporter = new activity_exporter($activity);
        $output = $PAGE->get_renderer('core');
        $activity = $activityexporter->export($output);
        return $output->render_from_template('local_activities/activityform_studentlist_messagehistory', $activity);
    }

    public static function get_all_permissions($activityid) {
        global $USER, $DB;

        $sql = "SELECT DISTINCT p.*
                  FROM {" . static::TABLE_EXCURSIONS_PERMISSIONS . "} p
            INNER JOIN {" . static::TABLE_EXCURSIONS_STUDENTS . "} s ON p.studentusername = s.username
                 WHERE p.activityid = ?
              ORDER BY p.timecreated DESC";
        $params = array($activityid);
        $permissions = $DB->get_records_sql($sql, $params);

        return $permissions;
    }

    /*
    * A "no" response means the student is not attending, even if another parent response "yes"
    */
    public static function get_all_attending($activityid) {
        global $USER, $DB;

        $attending = array();

        $activity = new static($activityid);
        if ($activity->get('permissions')) {
            $sql = "SELECT DISTINCT p.studentusername
                      FROM {" . static::TABLE_EXCURSIONS_PERMISSIONS . "} p
                INNER JOIN {" . static::TABLE_EXCURSIONS_STUDENTS . "} s ON p.studentusername = s.username
                     WHERE p.activityid = ?
                       AND p.response = 1
                       AND p.studentusername NOT IN ( 
                           SELECT studentusername
                             FROM mdl_excursions_permissions
                            WHERE activityid = ?
                              AND response = 2
                       )";
            $params = array($activityid, $activityid);
            $attending = $DB->get_records_sql($sql, $params);
            $attending = array_values(array_column($attending, 'studentusername'));
        } else {
            $attending = static::get_excursion_students($activityid);
            $attending = array_values(array_column($attending, 'username'));
        }

        return $attending;
    }

    public static function get_parent_permissions($activityid, $parentusername) {
        global $DB;

        $sql = "SELECT DISTINCT p.*
                  FROM {" . static::TABLE_EXCURSIONS_PERMISSIONS . "} p
            INNER JOIN {" . static::TABLE_EXCURSIONS_STUDENTS . "} s ON p.studentusername = s.username
                 WHERE p.activityid = ?
                   AND p.parentusername = ?
              ORDER BY p.timecreated DESC";
        $params = array($activityid, $parentusername);
        $permissions = $DB->get_records_sql($sql, $params);

        return $permissions;
    }

    public static function get_student_permissions($activityid, $studentusername) {
        global $DB;

        $sql = "SELECT DISTINCT p.*
                  FROM {" . static::TABLE_EXCURSIONS_PERMISSIONS . "} p
            INNER JOIN {" . static::TABLE_EXCURSIONS_STUDENTS . "} s ON p.studentusername = s.username
                 WHERE p.activityid = ?
                   AND p.studentusername = ?
              ORDER BY p.timecreated DESC";
        $params = array($activityid, $studentusername);
        $permissions = $DB->get_records_sql($sql, $params);

        return $permissions;
    }

    public static function get_students_by_response($activityid, $response) {
        global $DB;

        $sql = "SELECT DISTINCT p.studentusername
                  FROM {" . static::TABLE_EXCURSIONS_PERMISSIONS . "} p
            INNER JOIN {" . static::TABLE_EXCURSIONS_STUDENTS . "} s 
                ON p.studentusername = s.username 
                AND p.activityid = s.activityid
                 WHERE p.activityid = ?
                   AND p.response = ?";
        $params = array($activityid, $response);
        $permissions = $DB->get_records_sql($sql, $params);

        return $permissions;
    }

    /*
    * Save permission
    */
    public static function submit_permission($permissionid, $response) {
        global $DB, $USER;

        $activityid = $DB->get_field(static::TABLE_EXCURSIONS_PERMISSIONS, 'activityid', array('id' => $permissionid));
        $activity = new static($activityid);
        
        // Check if past permissions dueby or limit.
        $permissionshelper = static::permissions_helper($activity->get('id'));

        if ($permissionshelper->activitystarted || $permissionshelper->ispastdueby || $permissionshelper->ispastlimit) {
            return;
        }

        // Update the permission response.
        $sql = "UPDATE {" . static::TABLE_EXCURSIONS_PERMISSIONS . "}
                   SET response = ?, timeresponded = ?
                 WHERE id = ?
                   AND parentusername = ?";
        $params = array($response, time(), $permissionid, $USER->username);
        $DB->execute($sql, $params);

        // Reset absences processed as attendance may have changed due to permission given.
        $activity->set('absencesprocessed', 0);
        $activity->set('classrollprocessed', 0);
        $activity->update();

        // If it is a yes, sent an email to the student to tell them their parent indicated that they will be attending.
        if ($response == '1') {
            static::send_attending_email($permissionid);
        }

        return $response;
    }

    public static function send_attending_email($permissionid) {
        global $DB, $PAGE;

        // Get the permission.
        $permission = $DB->get_record(static::TABLE_EXCURSIONS_PERMISSIONS, array('id' => $permissionid));

        // Get the email users.
        $toUser = \core_user::get_user_by_username($permission->studentusername);
        $fromUser = \core_user::get_noreply_user();
        $fromUser->bccaddress = array(); //$fromUser->bccaddress = array("lms.archive@cgs.act.edu.au"); 

        // Get the activity for the permission.
        $activity = new activity($permission->activityid);
        $activityexporter = new activity_exporter($activity);
        $output = $PAGE->get_renderer('core');
        $activity = $activityexporter->export($output);

        // Add additional data for template.
        $parentuser = \core_user::get_user_by_username($permission->parentusername);
        $activity->parentname = fullname($parentuser);
        $activity->studentname = fullname($toUser);


        $messageText = $output->render_from_template('local_activities/email_attending_text', $activity);
        $messageHtml = $output->render_from_template('local_activities/email_attending_html', $activity);
        $subject = "Activity: " . $activity->activityname;

        $result = service_lib::email_to_user($toUser, $fromUser, $subject, $messageText, $messageHtml, '', '', true);        

    }

    public static function get_planning_staff($activityid) {
        global $DB;
        
        $sql = "SELECT *
                  FROM {" . static::TABLE_EXCURSIONS_PLANNING_STAFF . "}
                 WHERE activityid = ?";
        $params = array($activityid);
        $records = $DB->get_records_sql($sql, $params);

        $staff = array();
        foreach ($records as $record) {
            $staff[] = (object) $record;
        }

        return $staff;
    }

    public static function get_accompanying_staff($activityid) {
        global $DB;
        
        $sql = "SELECT *
                  FROM {" . static::TABLE_EXCURSIONS_STAFF . "}
                 WHERE activityid = ?";
        $params = array($activityid);
        $records = $DB->get_records_sql($sql, $params);

        $staff = array();
        foreach ($records as $record) {
            $staff[] = (object) $record;
        }

        return $staff;
    }

    public static function soft_delete($id) {
        global $DB, $USER;

        $activity = new static($id);
        if (empty($activity)) {
            return;
        }

        // People that can delete.
        $iscreator = ($activity->get('username') == $USER->username);
        $isapprover = workflow_lib::is_approver_of_activity($id);
        $isstaffincharge = ($activity->get('staffincharge') == $USER->username);


        // Update activity.
        if ($iscreator || $isapprover || $isstaffincharge) {
            // Delete corresponding event.
            $modified = time();
            $sql = "UPDATE {" . static::TABLE_EXCURSIONS_EVENTS . "}
                    SET deleted = 1, timemodified = " . $modified . "
                    WHERE activityid = ?
                    AND isactivity = 1";
            $DB->execute($sql, [$id]);

            // Delete the activity.
            $activity->set('deleted', 1);
            // Reset absences processed so that Synergetic is updated.
            $activity->set('absencesprocessed', 0);
            $activity->set('classrollprocessed', 0);
            $activity->update();

            return 1;
        }
        
    }

    
    public static function status_helper($status) {
        $statushelper = new \stdClass();
        $statushelper->status = $status;
        $statushelper->isautosave = ($status == static::ACTIVITY_STATUS_AUTOSAVE);
        $statushelper->isdraft = ($status == static::ACTIVITY_STATUS_DRAFT);
        $statushelper->isdraftorautosave = ($status == static::ACTIVITY_STATUS_DRAFT || $status == static::ACTIVITY_STATUS_AUTOSAVE);
        $statushelper->inreview = ($status == static::ACTIVITY_STATUS_INREVIEW);
        $statushelper->isapproved = ($status == static::ACTIVITY_STATUS_APPROVED);
        $statushelper->iscancelled = ($status == static::ACTIVITY_STATUS_CANCELLED);
        $statushelper->cansavedraft = $statushelper->isautosave || $statushelper->isdraft || $statushelper->iscancelled;
        return $statushelper;
    }

    public static function permissions_helper($activityid) {
        global $DB;

        $activity = new Activity($activityid);
        $type = $activity->get('permissionstype');
        $dueby = $activity->get('permissionsdueby');
        $limit = $activity->get('permissionslimit');

        $permissionshelper = new \stdClass();
        $permissionshelper->ismanual = ($type != 'system');
        $permissionshelper->issystem = ($type == 'system');
        $permissionshelper->ispastdueby = false;
        if ($dueby) {
            $permissionshelper->ispastdueby = (time() >= $dueby);
        }
        
        // Get number of approved permissions.
        $permissionshelper->ispastlimit = false;
        if ($limit > 0) {
            $countyes = count(Activity::get_students_by_response($activityid, 1));
            $permissionshelper->ispastlimit = ($countyes >= $limit);
        }

        // Check if activity is started.
        $permissionshelper->activitystarted = false;
        if (time() >= $activity->get('timestart')) {
            $permissionshelper->activitystarted = true;
        }

        return $permissionshelper;
    }














    private static function generate_files_changekey($filearea, $activityid) {
        $context = \context_system::instance();
        $fs = get_file_storage();
        $files = $fs->get_area_files($context->id, 'local_activities', $filearea, $activityid, "filename", false);
        $changekey = '';
        foreach ($files as $file) {
            $changekey .= $file->get_contenthash();
        }
        return sha1($changekey);
    }

    private static function process_files($files, $filearea, $activityid) {
        if (empty($files)) {
            return [];
        }
        $add = array();
        $delete = array();
        foreach($files as $instruct) {
            $instruct = explode("::", $instruct);
            if (count($instruct) < 2) {
                continue;
            }
            switch ($instruct[0]) {
                case "NEW":
                    $add[] = $instruct[1];
                    break;
                case "REMOVED":
                    $delete[] = $instruct[1];
                    break;
            }
        }

        static::delete_files($delete);
        static::store_files($add, $filearea, $activityid);
    }

    private static function delete_files($fileids) {
        if (empty($fileids)) {
            return [];
        }

        $fs = get_file_storage();
        foreach($fileids as $fileid) {
            $file = $fs->get_file_by_id($fileid);
            if ($file) {
                $file->delete();
            }
        }
    }

    private static function store_files($filenames, $filearea, $activityid) {
        global $USER, $CFG, $DB;

        if (empty($filenames)) {
            return [];
        }

        $success = array();
        $error = array();
        $dataroot = str_replace('\\\\', '/', $CFG->dataroot);
        $dataroot = str_replace('\\', '/', $dataroot);
        $tempdir = $dataroot . '/temp/local_activities/';

        
        $fs = get_file_storage();
        $fsfd = new \file_system_filedir();
        //$fs = new \file_storage();

        // Store temp files to a permanent file area.
        foreach($filenames as $filename) {
            if ( ! file_exists($tempdir . $filename)) {
                $error[$filename] = 'File not found';
                continue;
            }
            try {
                // Start a new file record.
                $newrecord = new \stdClass();
                // Move the temp file into moodledata.
                list($newrecord->contenthash, $newrecord->filesize, $newfile) = $fsfd->add_file_from_path($tempdir . $filename);
                
                // Remove the temp file.
                unlink($tempdir . $filename);

                // Clean filename.
                $cleanfilename = preg_replace("/^(\d+)\.(\d+)\./", '', $filename);            

                // Complete the record.
                $newrecord->contextid = 1;
                $newrecord->component = 'local_activities';
                $newrecord->filearea  = $filearea;
                $newrecord->itemid    = $activityid;
                $newrecord->filepath  = '/';
                $newrecord->filename  = $filename;
                $newrecord->timecreated  = time();
                $newrecord->timemodified = time();
                $newrecord->userid      = $USER->id;
                $newrecord->source      = $filename;
                $newrecord->author      = fullname($USER);
                $newrecord->license     = $CFG->sitedefaultlicense;
                $newrecord->status      = 0;
                $newrecord->sortorder   = 0;
                $newrecord->mimetype    = $fs->get_file_system()->mimetype_from_hash($newrecord->contenthash, $newrecord->filename);
                $newrecord->pathnamehash = $fs->get_pathname_hash($newrecord->contextid, $newrecord->component, $newrecord->filearea, $newrecord->itemid, $newrecord->filepath, $newrecord->filename);
                $newrecord->id = $DB->insert_record('files', $newrecord);
                $success[$filename] = $newrecord->id;
            } catch (Exception $ex) {
                $error[$filename] = $ex->getMessage();
            }
        }

        return [$success, $error];
    }


   




















}