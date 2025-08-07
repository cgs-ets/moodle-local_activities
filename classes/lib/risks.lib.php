<?php

namespace local_activities\lib;

defined('MOODLE_INTERNAL') || die();

require_once($CFG->dirroot . '/local/activities/config.php');
require_once(__DIR__.'/utils.lib.php');
require_once(__DIR__.'/service.lib.php');
require_once(__DIR__.'/workflow.lib.php');
require_once(__DIR__.'/risk_versions.lib.php');


use \local_activities\lib\utils_lib;
use \local_activities\lib\service_lib;
use \local_activities\lib\workflow_lib;
use \local_activities\lib\risk_versions_lib;
use \moodle_exception;

/**
 * Risks lib
 */
class risks_lib {

    /** Table to store risk classifications. */
    const TABLE_CLASSIFICATIONS = 'activities_classifications';
    
    /** Table to store risks. */
    const TABLE_RISKS = 'activities_risks';
    
    /** Table to store risk classifications relationships. */
    const TABLE_RISK_CLASSIFICATIONS = 'activities_risk_classifications';

    /**
     * Get all risk classifications.
     *
     * @param int $version Optional version to get classifications for
     * @return array
     */
    public static function get_classifications($version = null) {
        global $DB;
        
        // Only allow cal reviewers.
        if (!workflow_lib::is_cal_reviewer()) {
            throw new \Exception("Permission denied.");
        }
        
        // If no version specified, check URL parameter or get the latest version
        if ($version === null) {
            $version = risk_versions_lib::get_latest_version();
        }
        
        $records = $DB->get_records(static::TABLE_CLASSIFICATIONS, ['version' => $version], 'sortorder ASC, name ASC');
        service_lib::cast_fields($records, [
            'sortorder' => 'int',
            'id' => 'int',
            'version' => 'int',
        ]);
        return array_values($records);
    }

    /**
     * Get a single risk classification by ID.
     *
     * @param int $id
     * @param int $version Optional version to get classification for
     * @return object
     */
    public static function get_classification($id, $version = null) {
        global $DB;

        // Only allow cal reviewers.
        if (!workflow_lib::is_cal_reviewer()) {
            throw new \Exception("Permission denied.");
        }
        
        // If no version specified, get the latest version
        if ($version === null) {
            require_once(__DIR__.'/risk_versions.lib.php');
            $version = \local_activities\lib\risk_versions_lib::get_latest_version();
        }
        
        return $DB->get_record(static::TABLE_CLASSIFICATIONS, ['id' => $id, 'version' => $version]);
    }

    /**
     * Create or update a risk classification.
     *
     * @param object $data
     * @return array
     */
    public static function save_classification($data) {
        global $DB;

        // Only allow cal reviewers.
        if (!workflow_lib::is_cal_reviewer()) {
            throw new \Exception("Permission denied.");
        }
        
        $data = (object) $data;

        // Get the risk
        $data = $DB->get_record(static::TABLE_CLASSIFICATIONS, ['id' => $data->id]);

        // if version is published, throw an error
        if (risk_versions_lib::is_version_published($data->version)) {
            throw new \Exception("Cannot update classification as it is the published version. Fork and make changes to the draft version instead.");
        }
        
        // Check if name already exists in this version (excluding current record if updating)
        $existing = $DB->get_record(static::TABLE_CLASSIFICATIONS, ['name' => $data->name, 'version' => $data->version]);
        if ($existing && (!isset($data->id) || $existing->id != $data->id)) {
            throw new \Exception("A classification with this name already exists in this version.");
        }

        if (isset($data->id) && $data->id) {
            // Update existing
            $DB->update_record(static::TABLE_CLASSIFICATIONS, $data);
            $id = $data->id;
        } else {
            // Set sortorder for new records
            if (!isset($data->sortorder)) {
                $maxsort = $DB->get_field_sql("SELECT MAX(sortorder) FROM {" . static::TABLE_CLASSIFICATIONS . "} WHERE version = ?", [$data->version]);
                $data->sortorder = ($maxsort ? $maxsort + 1 : 1);
            }
            // Create new
            $id = $DB->insert_record(static::TABLE_CLASSIFICATIONS, $data);
        }
        
        return ['id' => $id, 'success' => true];
    }

    /**
     * Delete a risk classification.
     *
     * @param int $id
     * @return array
     */
    public static function delete_classification($id) {
        global $DB;
        
        // Only allow cal reviewers.
        if (!workflow_lib::is_cal_reviewer()) {
            throw new \Exception("Permission denied.");
        }

        // Get the risk
        $data = $DB->get_record(static::TABLE_CLASSIFICATIONS, ['id' => $id]);

        // if version is published, throw an error
        if (risk_versions_lib::is_version_published($data->version)) {
            throw new \Exception("Cannot delete classification as it is the published version. Fork and make changes to the draft version instead.");
        }
        
        // Check if classification is used by any risks in this version
        $used = $DB->record_exists(static::TABLE_RISK_CLASSIFICATIONS, ['classificationid' => $id, 'version' => $data->version]);
        if ($used) {
            throw new \Exception("Cannot delete classification as it is used by existing risks in this version.");
        }
        
        $DB->delete_records(static::TABLE_CLASSIFICATIONS, ['id' => $id, 'version' => $data->version]);
        return ['success' => true];
    }

    /**
     * Get all risks.
     *
     * @param int $version Optional version to get risks for
     * @return array
     */
    public static function get_risks($version = null) {
        global $DB;
        
        // Only allow cal reviewers.
        if (!workflow_lib::is_cal_reviewer()) {
            throw new \Exception("Permission denied.");
        }
        
        // If no version specified, check URL parameter or get the latest version
        if ($version === null) {
            $version = risk_versions_lib::get_latest_version();
        }
    
        $dbfamily = $DB->get_dbfamily();
    
        // Choose the correct group_concat syntax based on DB type
        switch ($dbfamily) {
            case 'mysql':
                $group_concat = "GROUP_CONCAT(rc.classificationid)";
                break;
            case 'postgres':
                $group_concat = "STRING_AGG(rc.classificationid::text, ',')";
                break;
            case 'mssql':
                $group_concat = "STRING_AGG(CAST(rc.classificationid AS varchar(max)), ',')";
                break;
            default:
                throw new \moodle_exception("Unsupported database type: $dbfamily");
        }
    
        $sql = "
            SELECT r.*, {$group_concat} AS classification_ids
            FROM {" . static::TABLE_RISKS . "} r
            LEFT JOIN {" . static::TABLE_RISK_CLASSIFICATIONS . "} rc ON r.id = rc.riskid AND r.version = rc.version
            WHERE r.version = ?
            GROUP BY r.id, r.hazard, r.riskrating_before, r.controlmeasures, r.riskrating_after, r.responsible_person, r.control_timing, r.risk_benefit, r.isstandard, r.version
            ORDER BY r.id ASC
        ";
    
        $records = $DB->get_records_sql($sql, [$version]);
        service_lib::cast_fields($records, [
            'isstandard' => 'int',
            'riskrating_before' => 'int',
            'riskrating_after' => 'int',
            'version' => 'int'
        ]);
    
        // Convert classification_ids string to array of integers
        foreach ($records as &$record) {
            if (!empty($record->classification_ids)) {
                $record->classification_ids = array_map('intval', explode(',', $record->classification_ids));
            } else {
                $record->classification_ids = [];
            }
        }

        return array_values($records);
    }
    

    /**
     * Get a single risk by ID.
     *
     * @param int $id
     * @return object
     */
    public static function get_risk($id) {
        global $DB;
        
        // Only allow cal reviewers.
        if (!workflow_lib::is_cal_reviewer()) {
            throw new \Exception("Permission denied.");
        }
        
        $risk = $DB->get_record(static::TABLE_RISKS, ['id' => $id]);
        
        if ($risk) {
            // Get classification IDs
            $classification_ids = $DB->get_fieldset_select(
                static::TABLE_RISK_CLASSIFICATIONS, 
                'classificationid', 
                'riskid = ?', 
                [$id]
            );
            $risk->classification_ids = $classification_ids;
        }
        
        return $risk;
    }

    /**
     * Create or update a risk.
     *
     * @param object $data
     * @return array
     */
    public static function save_risk($data) {
        global $DB;
        
        // Only allow cal reviewers.
        if (!workflow_lib::is_cal_reviewer()) {
            throw new \Exception("Permission denied.");
        }

        // Get the risk
        $risk = $DB->get_record(static::TABLE_RISKS, ['id' => $data->id]);

        // if version is published, throw an error
        if (risk_versions_lib::is_version_published($risk->version)) {
            throw new \Exception("Cannot update risk as it is the published version. Fork and make changes to the draft version instead.");
        }
        
        $data = (object) $data;
        $classification_ids = isset($data->classification_ids) ? $data->classification_ids : [];
        unset($data->classification_ids);
   
        if (isset($data->id) && $data->id) {
            // Update existing
            $DB->update_record(static::TABLE_RISKS, $data);
            $id = $data->id;
        } else {
            // Create new
            $id = $DB->insert_record(static::TABLE_RISKS, $data);
        }
        
        // Update classifications
        static::update_risk_classifications($id, $classification_ids, $data->version);
        
        return ['id' => $id, 'success' => true];
    }

    /**
     * Delete a risk.
     *
     * @param int $id
     * @return array
     */
    public static function delete_risk($id) {
        global $DB;
        
        // Only allow cal reviewers.
        if (!workflow_lib::is_cal_reviewer()) {
            throw new \Exception("Permission denied.");
        }

        // Get the risk
        $risk = $DB->get_record(static::TABLE_RISKS, ['id' => $id]);

        // if version is published, throw an error
        if (risk_versions_lib::is_version_published($risk->version)) {
            throw new \Exception("Cannot delete risk as it is the published version. Fork and make changes to the draft version instead.");
        }
        
        // Delete risk classifications first
        $DB->delete_records(static::TABLE_RISK_CLASSIFICATIONS, ['riskid' => $id]);
        
        // Delete the risk
        $DB->delete_records(static::TABLE_RISKS, ['id' => $id]);
        
        return ['success' => true];
    }

    /**
     * Update risk classifications for a risk.
     *
     * @param int $riskid
     * @param array $classification_ids
     * @param int $version
     */
    private static function update_risk_classifications($riskid, $classification_ids, $version) {
        global $DB;

        // Only allow cal reviewers.
        if (!workflow_lib::is_cal_reviewer()) {
            throw new \Exception("Permission denied.");
        }

        // Get the risk
        $risk = $DB->get_record(static::TABLE_RISKS, ['id' => $riskid]);

        // if version is published, throw an error
        if (risk_versions_lib::is_version_published($risk->version)) {
            throw new \Exception("Cannot update risk classifications as it is the published version. Fork and make changes to the draft version instead.");
        }
        
        // Delete existing classifications for this version
        $DB->delete_records(static::TABLE_RISK_CLASSIFICATIONS, ['riskid' => $riskid, 'version' => $version]);
        
        // Add new classifications
        foreach ($classification_ids as $classification_id) {
            $DB->insert_record(static::TABLE_RISK_CLASSIFICATIONS, [
                'riskid' => $riskid,
                'classificationid' => $classification_id,
                'version' => $version
            ]);
        }
    }



    /**
     * Update classification sort order.
     *
     * @param array $sortorder Array of classification IDs in new order
     * @return array
     */
    public static function update_classification_sort($sortorder) {
        global $DB;
        
        // Only allow cal reviewers.
        if (!workflow_lib::is_cal_reviewer()) {
            throw new \Exception("Permission denied.");
        }
        
        foreach ($sortorder as $index => $classificationid) {
            $DB->update_record(static::TABLE_CLASSIFICATIONS, [
                'id' => $classificationid,
                'sortorder' => $index + 1
            ]);
        }
        
        return ['success' => true];
    }

    /**
     * Search classifications by name.
     *
     * @param string $query
     * @param int $version
     * @return array
     */
    public static function search_classifications($query, $version) {
        global $DB;
        
        // Only allow cal reviewers.
        if (!workflow_lib::is_cal_reviewer()) {
            throw new \Exception("Permission denied.");
        }
        
        $sql = "SELECT * FROM {" . static::TABLE_CLASSIFICATIONS . "} 
                WHERE name LIKE ? AND version = ?
                ORDER BY sortorder ASC, name ASC";
        
        $records = $DB->get_records_sql($sql, ['%' . $query . '%', $version]);
        service_lib::cast_fields($records, [
            'id' => 'int',
            'version' => 'int',
            'sortorder' => 'int',
        ]);
        return array_values($records);
    }
}