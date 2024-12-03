<?php

namespace local_activities\lib;

defined('MOODLE_INTERNAL') || die();

require_once(__DIR__.'/activities.lib.php');
require_once(__DIR__.'/workflow.lib.php');

use \local_activities\lib\activities_lib;
use \local_activities\lib\workflow_lib;

use \stdClass;

class utils_lib {

    /**
     * Create a user stub object from a username.
     *
     * @param string $username
     * @return object
     */
    public static function user_stub($username) {
        $mdluser = \core_user::get_user_by_username($username);
        if (empty($mdluser)) {
            return null;
        }
        $user = new \stdClass();
        $user->un = $mdluser->username;
        $user->fn = $mdluser->firstname;
        $user->ln = $mdluser->lastname;
        return $user;
    }

    /**
     * Search staff.
     *
     * @param string $query
     * @return array results
     */
    public static function search_staff($query) {
        global $DB;

        $sql = "SELECT DISTINCT u.username
        FROM {user} u, {user_info_field} f, {user_info_data} d
        WHERE u.id = d.userid 
		AND d.fieldid = f.id
		AND f.shortname = 'CampusRoles'
		AND d.data LIKE '%:Staff%'
        AND ( u.firstname LIKE ?
        OR u.lastname LIKE ?
        OR u.username LIKE ? )";

        $likesearch = "%" . $query . "%";
        $data = $DB->get_records_sql($sql, [$likesearch, $likesearch, $likesearch]);

        $staff = [];
        foreach ($data as $row) {
            $staff[] = static::user_stub($row->username);
        }
        return $staff;
    }

    /**
     * Search students.
     *
     * @param string $query
     * @return array results
     */
    public static function search_students($query) {
        global $DB;

        $sql = "SELECT DISTINCT u.username
        FROM {user} u, {user_info_field} f, {user_info_data} d
        WHERE u.id = d.userid 
		AND d.fieldid = f.id
		AND f.shortname = 'CampusRoles'
		AND d.data LIKE '%:Student%'
        AND ( u.firstname LIKE ?
        OR u.lastname LIKE ?
        OR u.username LIKE ? )";

        $likesearch = "%" . $query . "%";
        $data = $DB->get_records_sql($sql, [$likesearch, $likesearch, $likesearch]);

        $staff = [];
        foreach ($data as $row) {
            $staff[] = static::user_stub($row->username);
        }
        return $staff;
    }

    /**
     * Get users courses.
     *
     * @return array results
     */
    public static function get_users_courses($user = null) {
        global $DB, $USER;

        if (!$user) {
            $user = $USER;
        }

        $out = array();

        // First process courses that the user is enrolled in.
        $courses = enrol_get_users_courses($user->id, true, 'enddate');
        $timenow = time();
        foreach ($courses as $course) {
            // Remove ended courses.
            if ($course->enddate && ($timenow > $course->enddate)) {
                continue;
            }
            $out[] = array(
                'id' => $course->id,
                'fullname' => $course->fullname,
            );
        }

        // Next process all other courses.
        $courses = get_courses();
        foreach ($courses as $course) {
            // Skip course if already in list.
            if (in_array($course->id, array_column($out, 'id'))) {
                continue;
            }
            // Remove ended courses.
            if ($course->enddate && ($timenow > $course->enddate)) {
                continue;
            }

            // Get the course category and skip if not a part of Primary or Senior.
            $allowed = false;
            $allowedcats = array(2, 3); // ids of allowed categories. Child categories are also allowed.
            $sql = "SELECT path FROM {course_categories} WHERE id = {$course->category}";
            $catpath = $DB->get_field_sql($sql, null);
            foreach ($allowedcats as $allowedcat) {
                if(preg_match('/\/' . $allowedcat . '(\/|$)/', $catpath)) {
                    $allowed = true;
                    break;
                }
            }
            if (!$allowed) {
                continue;
            }

            $out[] = array(
                'id' => $course->id,
                'fullname' => $course->fullname,
            );
        }

        // Sort by course name.
        usort($out, function($a, $b) {
            return $a['fullname'] <=> $b['fullname'];
        });

        return $out;
    }

    public static function get_students_from_courses($courseids) {
        global $DB;

        list($insql, $inparams) = $DB->get_in_or_equal($courseids);
        $sql = "SELECT DISTINCT u.id, u.username, u.firstname, u.lastname
                  FROM {user} u, {user_enrolments} ue, {enrol} e, {course} c, {role_assignments} ra, {context} cn, {role} r
                 WHERE c.id $insql
                   AND e.courseid = c.id
                   AND ue.enrolid = e.id
                   AND cn.instanceid = c.id
                   AND cn.contextlevel = 50
                   AND u.id = ue.userid
                   AND ra.contextid =  cn.id
                   AND ra.userid = ue.userid
                   AND r.id = ra.roleid
                   AND r.shortname = 'student'";
        $records = $DB->get_records_sql($sql, $inparams);
        $students = array();

        foreach($records as $rec) {
            $student = static::user_stub($rec->username);
            if (!$student) {
                continue;
            }
            $student->permission = -1;
            $student->parents = [];
            $students[] = $student;
        }

        return $students;
    }

    /**
     * Get users groups.
     *
     * @return array results
     */
    public static function get_users_groups($user = null) {
        global $DB, $USER;

        if (!$user) {
            $user = $USER;
        }

        $out = array();

        $courses = static::get_users_courses($user);
        foreach ($courses as $course) {
            // Get the groups in this course.
            $groups = $DB->get_records('groups', array('courseid' => $course['id']));
            foreach ($groups as $group) {
                $out[] = array(
                    'id' => $group->id,
                    'fullname' => $course['fullname'] . ' > ' . $group->name,
                );
            }
        }
        
        // Sort by course name.
        usort($out, function($a, $b) {
            return $a['fullname'] <=> $b['fullname'];
        });
        
        return $out;
    }

    public static function get_students_from_groups($groupids) {
        global $DB;

        list($insql, $inparams) = $DB->get_in_or_equal($groupids);
        $sql = "SELECT DISTINCT u.id, u.username, u.firstname, u.lastname 
                FROM mdl_groups g, mdl_groups_members m, mdl_user u, mdl_user_enrolments ue, mdl_enrol e, mdl_role_assignments ra, mdl_context cn, mdl_role r
                WHERE g.id $insql
                AND m.groupid = g.id
                AND u.id = m.userid
                AND e.courseid = g.courseid
                AND ue.enrolid = e.id
                AND cn.instanceid = g.courseid
                AND cn.contextlevel = 50
                AND u.id = ue.userid
                AND ra.contextid =  cn.id
                AND ra.userid = ue.userid
                AND ra.userid = m.userid
                AND r.id = ra.roleid
                AND r.shortname = 'student'";
        $records = $DB->get_records_sql($sql, $inparams);

        $students = array();
        foreach($records as $r) {
            $student = new \stdClass();
            $student->un = $r->username;
            $student->fn = $r->firstname;
            $student->ln = $r->lastname;
            $students[] = $student;
        }

        return $students;
    }

    /**
     * Check if the current user has the capability to create an activity.
     *
     * @param int $activityid
     * @return boolean
     */
    public static function has_capability_create_activity() {
        global $USER, $DB;

        //Any staff memeber
        
        return true;
    }

    /**
     * Check if the current user has the capability to edit a given team.
     *
     * @param int $activityid
     * @return boolean
     */
    public static function has_capability_edit_activity($activityid) {
        $activity = activities_lib::get_activity($activityid);
        if ($activity->usercanedit) {
            return true;
        }
        return false;
    }


    /**
     * Get the user's campus roles.
     *
     * @return string
     */
    public static function get_cal_roles($username) {
        return array(
            workflow_lib::is_cal_reviewer() ? "cal_reviewer" : ''
        );
    }

    
    /*public static function renderTemplate($template, $data = []) {
        global $CFG;
        
        // Extract data variables for use in the template
        extract($data);
        
        // Start output buffering
        ob_start();
    
        // Include the template file
        include $template;
    
        // Get the buffered content
        return ob_get_clean();
    }*/

    public static function get_user_mentors($userid) {
        global $DB;

        $mentors = array();
        $mentorssql = "SELECT u.username
                         FROM {role_assignments} ra, {context} c, {user} u
                        WHERE c.instanceid = :menteeid
                          AND c.contextlevel = :contextlevel
                          AND ra.contextid = c.id
                          AND u.id = ra.userid";
        $mentorsparams = array(
            'menteeid' => $userid,
            'contextlevel' => CONTEXT_USER
        );
        if ($mentors = $DB->get_records_sql($mentorssql, $mentorsparams)) {
            $mentors = array_column($mentors, 'username');
        }
        return $mentors;
    }

    public static function get_user_mentees($userid) {
        global $DB;

        // Get mentees for user.
        $mentees = array();
        $menteessql = "SELECT u.username
                         FROM {role_assignments} ra, {context} c, {user} u
                        WHERE ra.userid = :mentorid
                          AND ra.contextid = c.id
                          AND c.instanceid = u.id
                          AND c.contextlevel = :contextlevel";     
        $menteesparams = array(
            'mentorid' => $userid,
            'contextlevel' => CONTEXT_USER
        );
        if ($mentees = $DB->get_records_sql($menteessql, $menteesparams)) {
            $mentees = array_column($mentees, 'username');
        }
        return $mentees;
    }


    public static function get_users_mentors($userids) {
        global $DB;

        [$insql, $inparams] = $DB->get_in_or_equal($userids);

        $mentors = array();
        $mentorssql = "SELECT u.username
                         FROM {role_assignments} ra, {context} c, {user} u
                        WHERE c.instanceid $insql
                          AND c.contextlevel = 30
                          AND ra.contextid = c.id
                          AND u.id = ra.userid";
        if ($mentors = $DB->get_records_sql($mentorssql, $inparams)) {
            $mentors = array_column($mentors, 'username');
        }
        return $mentors;
    }

    public static function get_userids($usernames) {
        global $DB;

        [$insql, $inparams] = $DB->get_in_or_equal($usernames);

        $sql = "SELECT id
                FROM {user}
                WHERE username $insql";
                
        return array_values(array_column($DB->get_records_sql($sql, $inparams), 'id'));
    }

    public static function require_staff() {
        global $USER;
        
        profile_load_custom_fields($USER);
        $campusroles = strtolower($USER->profile['CampusRoles']);
        if (strpos($campusroles, 'staff') !== false) {
            return true;
        }

        throw new \required_capability_exception(\context_system::instance(), 'local/activities:manage', 'nopermissions', '');
        exit;
    }


    public static function is_user_staff() {
        global $USER;
        
        profile_load_custom_fields($USER);
        $campusroles = strtolower($USER->profile['CampusRoles']);
        if (strpos($campusroles, 'staff') !== false) {
            return true;
        }

        return false;
    }


}