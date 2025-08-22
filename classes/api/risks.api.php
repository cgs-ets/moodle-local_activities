<?php

namespace local_activities\api;

defined('MOODLE_INTERNAL') || die();

require_once(__DIR__.'/../lib/risks.lib.php');
require_once(__DIR__.'/../lib/risk_versions.lib.php');

use \local_activities\lib\risks_lib;
use \local_activities\lib\risk_versions_lib;

/**
 * Risks API trait
 */
trait risks_api {


    /**
     * Get published risk version and classifications.
     *
     * @return array
     */
    static public function get_ra_classifications() {
        $activityid = required_param('id', PARAM_INT);
        $version = risk_versions_lib::get_published_version();
        $classifications = risks_lib::get_classifications_preselected($version, $activityid);
        return ['version' => $version, 'classifications' => $classifications];
    }

    /**
     * Save a risk assessment.
     *
     * @return object
     */
    static public function generate_ra($args) {
        return risks_lib::generate_ra((object) $args);
    }

    /**
     * Get a list of risk assessment generations for an activity.
     *
     * @return array
     */
    static public function get_ra_generations() {
        $activityid = required_param('id', PARAM_INT);
        return risks_lib::get_ra_generations($activityid);
    }

    /**
     * Get a single risk assessment by ID.
     *
     * @return object
     */
    static public function get_risk_assessment() {
        $id = required_param('id', PARAM_INT);
        return risks_lib::get_risk_assessment($id);
    }


    /**
     * Get the last risk assessment generation for an activity.
     *
     * @return object
     */
    static public function get_last_ra_gen() {
        $activityid = required_param('activityid', PARAM_INT);
        return risks_lib::get_last_ra_gen($activityid);
    }

    /**
     * Delete a risk assessment generation.
     *
     * @return object
     */
    static public function delete_ra_generation() {
        $id = required_param('id', PARAM_INT);
        return risks_lib::delete_ra_generation($id);
    }

    /**
     * Approve a risk assessment generation.
     *
     * @return object
     */
    static public function approve_ra_generation() {
        $id = required_param('id', PARAM_INT);
        $approved = required_param('approved', PARAM_INT);
        return risks_lib::approve_ra_generation($id, $approved);
    }
}
