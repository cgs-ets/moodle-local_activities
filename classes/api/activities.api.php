<?php

namespace local_activities\api;

defined('MOODLE_INTERNAL') || die();

require_once(__DIR__.'/../lib/activity.class.php');
require_once(__DIR__.'/../lib/activities.lib.php');
require_once(__DIR__.'/../lib/service.lib.php');

use \local_activities\lib\Activity;
use \local_activities\lib\activities_lib;
use \local_activities\lib\service_lib;

/**
 * Activity API trait
 */
trait activities_api {

    /**
     * Get activity data by id.
     *
     * @return array
     */
    static public function get_activity() {
        $id = required_param('id', PARAM_INT);
        return activities_lib::get_activity($id);
    }

    /**
     * Create/edit activity data from posted form.
     *
     * @return array containing activityid and new status.
     */
    static public function post_activity($args) { 
        return activities_lib::save_from_data( (object) $args);
    }

    /**
     * Change the status of a activity to published.
     *
     * @return array containing activityid and new status.
     */
    static public function update_status($args) { 
        ['id' => $id, 'status' => $status] = $args;
        return activities_lib::update_status($id, $status);
    }

    /**
     * Get a activity's student list.
     *
     * @return array
     */
    static public function get_activity_students() {
        $id = required_param('id', PARAM_INT);
        $activity = new Activity($id);
        $activity->load_studentsdata();
        return json_decode($activity->get('studentsdata'));
    }

    /**
     * Search for activities.
     *
     * @return array results.
     */
    static public function search_activitys() {
        $text = required_param('text', PARAM_ALPHANUMEXT);
        return activities_lib::search_activitys($text);
    }

    /**
     * Get current authenticated user's activities.
     *
     * @return array results.
     */
    static public function get_user_activities() {
        return activities_lib::get_activities();
    }


}
