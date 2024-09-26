<?php

namespace local_activities\lib;

defined('MOODLE_INTERNAL') || die();

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
        global $USER, $DB;

        // Planning staff
        $planningstaff = $DB->record_exists_sql("SELECT username FROM {activity_staff} WHERE activityid = ? AND username = ? AND usertype = 'planning'", [$activityid, $USER->username]);
        if ($planningstaff) {
            return true;
        }

        // Staff in charge

    
        // Moodle Admin.
        if (has_capability('moodle/site:config', \context_user::instance($USER->id))) {
            return true;
        }

        return false;
    }

}