<?php

namespace local_activities\lib;

defined('MOODLE_INTERNAL') || die();

use \stdClass;

class utils_lib {

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