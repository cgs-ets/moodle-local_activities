<?php

namespace local_activities\api;

defined('MOODLE_INTERNAL') || die();

require_once(__DIR__.'/../lib/risk_versions.lib.php');

use \local_activities\lib\risk_versions_lib;

/**
 * Risk Versions API trait
 */
trait risk_versions_api {

    /**
     * Get all risk classifications.
     *
     * @return array
     */
    static public function get_classifications() {
        $version = optional_param('version', null, PARAM_INT);
        return risk_versions_lib::get_classifications($version);
    }

    /**
     * Create or update a risk classification.
     *
     * @return array
     */
    static public function save_classification($args) {
        return risk_versions_lib::save_classification((object) $args);
    }

    /**
     * Delete a risk classification.
     *
     * @return array
     */
    static public function delete_classification($args) {
        ['id' => $id] = $args;
        return risk_versions_lib::delete_classification($id);
    }

    /**
     * Get all risks.
     *
     * @return array
     */
    static public function get_risks() {
        $version = required_param('version', PARAM_INT);
        return risk_versions_lib::get_risks($version);
    }

    /**
     * Create or update a risk.
     *
     * @return array
     */
    static public function save_risk($args) {
        return risk_versions_lib::save_risk((object) $args);
    }

    /**
     * Delete a risk.
     *
     * @return array
     */
    static public function delete_risk($args) {
        ['id' => $id] = $args;
        return risk_versions_lib::delete_risk($id);
    }

    /**
     * Update classification sort order.
     *
     * @return array
     */
    static public function update_classification_sort($args) {
        ['sortorder' => $sortorder] = $args;
        return risk_versions_lib::update_classification_sort($sortorder);
    }

    /**
     * Search classifications by name.
     *
     * @return array
     */
    static public function search_classifications() {
        $version = required_param('version', PARAM_INT);
        $query = required_param('query', PARAM_ALPHANUMEXT);
        return risk_versions_lib::search_classifications($query, $version);
    }

    /**
     * Get the current published version.
     *
     * @return int|null
     */
    static public function get_published_version() {
        return risk_versions_lib::get_published_version();
    }

    /**
     * Get the current draft version.
     *
     * @return int
     */
    static public function get_draft_version() {
        return risk_versions_lib::get_draft_version();
    }

    /**
     * Get the current working version.
     *
     * @return int
     */
    static public function get_working_version() {
        return risk_versions_lib::get_working_version();
    }

    /**
     * Create a new draft version.
     *
     * @return array
     */
    static public function create_draft_version($args) {
        ['version' => $version] = $args;
        $version = risk_versions_lib::create_draft_version($version);
        return ['version' => $version, 'success' => true];
    }

    /**
     * Publish the current draft version.
     *
     * @return array
     */
    static public function publish_version($args) {
        ['version' => $version] = $args;
        return risk_versions_lib::publish_version($version);
    }

    /**
     * Get all versions.
     *
     * @return array
     */
    static public function get_versions() {
        return risk_versions_lib::get_versions();
    }

    /**
     * Get version details.
     *
     * @return object
     */
    static public function get_version_details() {
        $version = required_param('version', PARAM_INT);
        return risk_versions_lib::get_version_details($version);
    }

    /**
     * Delete a version.
     *
     * @return array
     */
    static public function delete_version($args) {
        ['version' => $version] = $args;
        return risk_versions_lib::delete_version($version);
    }

    /**
     * Check if there are draft changes.
     *
     * @return bool
     */
    static public function has_draft_changes() {
        return risk_versions_lib::has_draft_changes();
    }

    /**
     * Set the current viewing version.
     *
     * @return array
     */
    static public function set_viewing_version($args) {
        ['version' => $version] = $args;
        return risk_versions_lib::set_viewing_version($version);
    }

    /**
     * Get the current viewing version.
     *
     * @return int
     */
    static public function get_viewing_version() {
        return risk_versions_lib::get_viewing_version();
    }

    /**
     * Reset viewing version to working version.
     *
     * @return array
     */
    static public function reset_viewing_version() {
        return risk_versions_lib::reset_viewing_version();
    }

    /**
     * Check if the current viewing version is editable.
     *
     * @return bool
     */
    static public function is_viewing_version_editable() {
        return risk_versions_lib::is_viewing_version_editable();
    }
} 