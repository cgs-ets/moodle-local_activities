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
     * Get activity for parent permission page by id.
     *
     * @return array
     */
    static public function get_activity_with_permission() {
        $id = required_param('id', PARAM_INT);
        return activities_lib::get_activity_with_permission($id);
    }

    /**
     * Get activity for public activity page by id.
     *
     * @return array
     */
    static public function get_public_activity() {
        $id = required_param('id', PARAM_INT);
        return activities_lib::get_public_activity($id);
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
    static public function get_students() {
        $id = required_param('id', PARAM_INT);
        $withpermissions = optional_param('withpermissions', false, PARAM_BOOL);
        $activity = new Activity($id);
        $activity->load_studentsdata($withpermissions);
        return json_decode($activity->get('studentsdata'));
    }

    /**
     * Search for activities.
     *
     * @return array results.
     */
    static public function search_activities() {
        $text = required_param('search', PARAM_ALPHANUMEXT);
        return activities_lib::search($text);
    }

    /**
     * Get current authenticated user's activities.
     *
     * @return array results.
     */
    static public function get_user_activities() {
        return activities_lib::get_activities();
    }


    /**
     * Get comments
     *
     * @return array results.
     */
    static public function get_comments() {
        $id = required_param('id', PARAM_INT);
        return activities_lib::get_comments($id);
    }

    /**
     * Post a comment.
     *
     * @return array containing activityid and comment text.
     */
    static public function post_comment($args) { 
        $data = (object) $args;
        return activities_lib::post_comment($data->activityid, $data->comment);
    }

    /**
     * Delete a comment.
     *
     * @return array containing comment id.
     */
    static public function delete_comment($args) { 
        $data = (object) $args;
        return activities_lib::delete_comment($data->commentid);
    }


    /**
     * Send initial permissions email.
     *
     * @return array containing activityid and optional text.
     */
    static public function send_email($args) { 
        $data = (object) $args;
        return activities_lib::add_activity_email($data);
    }
    
    /**
     * Get emails
     *
     * @return array results.
     */
    static public function get_emails() {
        $id = required_param('id', PARAM_INT);
        return activities_lib::get_emails($id);
    }


    /**
    * Submit parent permission.
    */
    static public function submit_permission($args) { 
        ['permissionid' => $permissionid, 'response' => $response] = $args;
        return activities_lib::submit_permission($permissionid, $response);
    }

    /**
     * Get events where user is involved.
     */
    static public function get_my_involvement() {
        return activities_lib::get_by_involvement();
    }

    /**
     * Get events where user is involved.
     */
    static public function get_my_history() {
        return activities_lib::get_history();
    }

    /**
     * Delete an activity.
     *
     * @return array containing comment id.
     */
    static public function delete_activity($args) { 
        $data = (object) $args;
        return activities_lib::soft_delete($data->id);
    }

}
