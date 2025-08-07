<?php

namespace local_activities\api;

defined('MOODLE_INTERNAL') || die();

require_once(__DIR__.'/../lib/risks.lib.php');

use \local_activities\lib\risks_lib;

/**
 * Risks API trait
 */
trait risks_api {

    /**
     * Get all risk classifications.
     *
     * @return array
     */
    static public function get_classifications($args) {
        ['version' => $version] = $args;
        return risks_lib::get_classifications($version);
    }

    /**
     * Get a single risk classification by ID.
     *
     * @return object
     */
    static public function get_classification() {
        $id = required_param('id', PARAM_INT);
        return risks_lib::get_classification($id);
    }

    /**
     * Create or update a risk classification.
     *
     * @return array
     */
    static public function save_classification($args) {
        return risks_lib::save_classification((object) $args);
    }

    /**
     * Delete a risk classification.
     *
     * @return array
     */
    static public function delete_classification($args) {
        ['id' => $id] = $args;
        return risks_lib::delete_classification($id);
    }

    /**
     * Get all risks.
     *
     * @return array
     */
    static public function get_risks($args) {
        ['version' => $version] = $args;
        return risks_lib::get_risks($version);
    }

    /**
     * Get a single risk by ID.
     *
     * @return object
     */
    static public function get_risk() {
        $id = required_param('id', PARAM_INT);
        return risks_lib::get_risk($id);
    }

    /**
     * Create or update a risk.
     *
     * @return array
     */
    static public function save_risk($args) {
        return risks_lib::save_risk((object) $args);
    }

    /**
     * Delete a risk.
     *
     * @return array
     */
    static public function delete_risk($args) {
        ['id' => $id] = $args;
        return risks_lib::delete_risk($id);
    }

    /**
     * Update classification sort order.
     *
     * @return array
     */
    static public function update_classification_sort($args) {
        ['sortorder' => $sortorder] = $args;
        return risks_lib::update_classification_sort($sortorder);
    }

    /**
     * Search classifications by name.
     *
     * @return array
     */
    static public function search_classifications() {
        $version = required_param('version', PARAM_INT);
        $query = required_param('query', PARAM_ALPHANUMEXT);
        return risks_lib::search_classifications($query, $version);
    }

}
