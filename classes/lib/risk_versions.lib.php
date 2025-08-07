<?php

namespace local_activities\lib;

defined('MOODLE_INTERNAL') || die();

require_once($CFG->dirroot . '/local/activities/config.php');
require_once(__DIR__.'/utils.lib.php');
require_once(__DIR__.'/service.lib.php');
require_once(__DIR__.'/workflow.lib.php');
require_once(__DIR__.'/risks.lib.php');

use \local_activities\lib\utils_lib;
use \local_activities\lib\service_lib;
use \local_activities\lib\workflow_lib;
use \local_activities\lib\risks_lib;
use \moodle_exception;

/**
 * Risk Versions lib - Handles version control for risks and classifications
 */
class risk_versions_lib {

    /** Table to store risk versions. */
    const TABLE_RISK_VERSIONS = 'activities_risk_versions';
    
    /** Table to store risks. */
    const TABLE_RISKS = 'activities_risks';
    
    /** Table to store classifications. */
    const TABLE_CLASSIFICATIONS = 'activities_classifications';
    
    /** Table to store risk classifications relationships. */
    const TABLE_RISK_CLASSIFICATIONS = 'activities_risk_classifications';

    /**
     * Get the current published version.
     *
     * @return int|null
     */
    public static function get_published_version() {
        global $DB;
        
        $record = $DB->get_record(static::TABLE_RISK_VERSIONS, ['is_published' => 1]);
        return $record ? $record->version : null;
    }

    /**
     * Get the current draft version (next version number).
     *
     * @return int
     */
    public static function get_draft_version() {
        global $DB;
        
        $maxversion = $DB->get_field_sql("SELECT MAX(version) FROM {" . static::TABLE_RISK_VERSIONS . "}");
        return ($maxversion ? $maxversion + 1 : 1);
    }

    /**
     * Get all versions with their status.
     *
     * @return array
     */
    public static function get_versions() {
        global $DB;
        
        // Only allow cal reviewers.
        if (!workflow_lib::is_cal_reviewer()) {
            throw new \Exception("Permission denied.");
        }
        
        $records = $DB->get_records(static::TABLE_RISK_VERSIONS, [], 'version DESC');
        service_lib::cast_fields($records, [
            'version' => 'int',
            'is_published' => 'int',
            'timepublished' => 'int',
            'timecreated' => 'int'
        ]);
        
        return array_values($records);
    }

    /**
     * Get version details including counts of risks and classifications.
     *
     * @param int $version
     * @return object
     */
    public static function get_version_details($version) {
        global $DB;
        
        // Only allow cal reviewers.
        if (!workflow_lib::is_cal_reviewer()) {
            throw new \Exception("Permission denied.");
        }
        
        $version_record = $DB->get_record(static::TABLE_RISK_VERSIONS, ['version' => $version]);
        if (!$version_record) {
            throw new \Exception("Version not found.");
        }
        
        $risk_count = $DB->count_records(static::TABLE_RISKS, ['version' => $version]);
        $classification_count = $DB->count_records(static::TABLE_CLASSIFICATIONS, ['version' => $version]);
        
        $version_record->risk_count = $risk_count;
        $version_record->classification_count = $classification_count;
        
        return $version_record;
    }

    /**
     * Delete a version and all its data.
     *
     * @param int $version
     * @return array
     */
    public static function delete_version($version) {
        global $DB;
        
        // Only allow cal reviewers.
        if (!workflow_lib::is_cal_reviewer()) {
            throw new \Exception("Permission denied.");
        }
        
        $version_record = $DB->get_record(static::TABLE_RISK_VERSIONS, ['version' => $version]);
        if (!$version_record) {
            throw new \Exception("Version not found.");
        }
        
        if ($version_record->is_published) {
            throw new \Exception("Cannot delete published version.");
        }

        // If the version is used by any activities, throw an error.
        $used = $DB->record_exists('activities_ra_gen', ['riskversion' => $version]);
        if ($used) {
            throw new \Exception("Cannot delete version as it is used by existing activities to generate a risk assessment.");
        }
        
        // Delete all data for this version
        $DB->delete_records(static::TABLE_RISKS, ['version' => $version]);
        $DB->delete_records(static::TABLE_CLASSIFICATIONS, ['version' => $version]);
        $DB->delete_records(static::TABLE_RISK_CLASSIFICATIONS, ['version' => $version]);
        $DB->delete_records(static::TABLE_RISK_VERSIONS, ['version' => $version]);
        
        return ['success' => true];
    }

    /**
     * Check if there are any changes in the current draft compared to published version.
     *
     * @return bool
     */
    public static function has_draft_changes() {
        global $DB;
        
        $published_version = self::get_published_version();
        $draft_version = self::get_draft_version() - 1;
        
        if (!$published_version || !$draft_version) {
            return false;
        }
        
        // Compare risks
        $published_risks = $DB->get_records(static::TABLE_RISKS, ['version' => $published_version]);
        $draft_risks = $DB->get_records(static::TABLE_RISKS, ['version' => $draft_version]);
        
        if (count($published_risks) !== count($draft_risks)) {
            return true;
        }
        
        // Compare classifications
        $published_classifications = $DB->get_records(static::TABLE_CLASSIFICATIONS, ['version' => $published_version]);
        $draft_classifications = $DB->get_records(static::TABLE_CLASSIFICATIONS, ['version' => $draft_version]);
        
        if (count($published_classifications) !== count($draft_classifications)) {
            return true;
        }
        
        // TODO: Add more detailed comparison logic if needed
        
        return false;
    }

    /**
     * Get the latest version (either published or draft).
     * This is what should be loaded by default.
     *
     * @return int
     */
    public static function get_latest_version() {
        global $DB;
        
        $maxversion = $DB->get_field_sql("SELECT MAX(version) FROM {" . static::TABLE_RISK_VERSIONS . "}");
        return (int) $maxversion;
    }

    /**
     * Check if a version is published.
     *
     * @param int $version
     * @return bool
     */
    public static function is_version_published($version) {
        global $DB;
        
        $record = $DB->get_record(static::TABLE_RISK_VERSIONS, ['version' => $version]);
        return $record ? (bool)$record->is_published : false;
    }

    /**
     * Ensure we're working on a draft version.
     * If the current working version is published, create a new draft.
     *
     * @return int The version to work on
     */
    public static function ensure_draft_version($version) {
        // If this version is published, create a new draft version.
        if (self::is_version_published($version)) {
            return self::create_draft_version($version);
        }
        
        // Otherwise, return the version.
        return $version;
    }

    /**
     * Create initial version (version 1).
     *
     * @return int
     */
    private static function create_initial_version() {
        global $DB;
        
        // Only allow cal reviewers.
        if (!workflow_lib::is_cal_reviewer()) {
            throw new \Exception("Permission denied.");
        }
        
        $version = 1;
        
        // Create version record
        $DB->insert_record(static::TABLE_RISK_VERSIONS, [
            'version' => $version,
            'is_published' => 0,
            'published_by' => null,
            'timepublished' => 0,
            'timecreated' => time(),
            'description' => 'Initial version'
        ]);
        
        return $version;
    }

    /**
     * Create a new draft version by copying the current working version.
     *
     * @return int The new version number
     */
    public static function create_draft_version($version) {
        global $DB;
        
        // Only allow cal reviewers.
        if (!workflow_lib::is_cal_reviewer()) {
            throw new \Exception("Permission denied.");
        }

        $latest_version = self::get_latest_version();
        $new_version = $latest_version + 1;

        // Copy risks from current version
        $risks = $DB->get_records(static::TABLE_RISKS, ['version' => $version]);
        foreach ($risks as $risk) {
            unset($risk->id);
            $risk->version = $new_version;
            $DB->insert_record(static::TABLE_RISKS, $risk);
        }
        
        // Copy classifications from current version
        $classifications = $DB->get_records(static::TABLE_CLASSIFICATIONS, ['version' => $version]);
        foreach ($classifications as $classification) {
            unset($classification->id);
            $classification->version = $new_version;
            $DB->insert_record(static::TABLE_CLASSIFICATIONS, $classification);
        }
        
        // Copy risk-classification relationships
        $risk_classifications = $DB->get_records(static::TABLE_RISK_CLASSIFICATIONS, ['version' => $version]);
        foreach ($risk_classifications as $rc) {
            unset($rc->id);
            $rc->version = $new_version;
            $DB->insert_record(static::TABLE_RISK_CLASSIFICATIONS, $rc);
        }

        // Create version record
        $DB->insert_record(static::TABLE_RISK_VERSIONS, [
            'version' => $new_version,
            'is_published' => 0,
            'published_by' => null,
            'timepublished' => 0,
            'timecreated' => time(),
            'description' => 'Draft version'
        ]);
        
        return $new_version;
    }

    /**
     * Publish the current working version.
     *
     * @param string $description Optional description of the version
     * @return array
     */
    public static function publish_version($version) {
        global $DB, $USER;
        
        // Only allow cal reviewers.
        if (!workflow_lib::is_cal_reviewer()) {
            throw new \Exception("Permission denied.");
        }

        // Check if version exists
        $version_record = $DB->get_record(static::TABLE_RISK_VERSIONS, ['version' => $version]);
        if (!$version_record) {
            throw new \Exception("Version not found.");
        }
        
        // Unpublish any currently published version
        $DB->set_field(static::TABLE_RISK_VERSIONS, 'is_published', 0, ['is_published' => 1]);

        $version_record->is_published = 1;
        $version_record->published_by = $USER->username;
        $version_record->timepublished = time();
        $version_record->description = 'Published version';
        $DB->update_record(static::TABLE_RISK_VERSIONS, $version_record);
        
        return ['success' => true, 'version' => $version];
    }



} 