<?php

namespace local_activities\api;

defined('MOODLE_INTERNAL') || die();

require_once(__DIR__.'/../lib/assessments.lib.php');

use \local_activities\lib\assessments_lib;

/**
 * Conflicts API trait
 */
trait assessments_api {

    /**
     * Get courses
     *
     * @return array
     */
    static public function get_courses() {
        return assessments_lib::get_courses();
    }

    /**
     * Get modules
     *
     * @return array
     */
    static public function get_modules() {
        $courseid = required_param('courseid', PARAM_INT);
        return assessments_lib::get_modules($courseid);
    }

     /**
     * Get save an assessment
     *
     * @return array
     */
    static public function post_assessment($args) {
        return assessments_lib::save_from_data( (object) $args);
    }

    /**
     * Get assessment
     *
     * @return array
     */
    static public function get_assessment() {
        $id = required_param('id', PARAM_INT);
        return assessments_lib::get($id);
    }


}
