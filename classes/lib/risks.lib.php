<?php

namespace local_activities\lib;

defined('MOODLE_INTERNAL') || die();

require_once($CFG->dirroot . '/local/activities/config.php');
require_once(__DIR__.'/utils.lib.php');
require_once(__DIR__.'/service.lib.php');
require_once(__DIR__.'/workflow.lib.php');

use \local_activities\lib\utils_lib;
use \local_activities\lib\service_lib;
use \local_activities\lib\workflow_lib;
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
     * @return array
     */
    public static function get_classifications() {
        global $DB;
        
        // Only allow cal reviewers.
        if (!workflow_lib::is_cal_reviewer()) {
            throw new \Exception("Permission denied.");
        }
        
        $records = $DB->get_records(static::TABLE_CLASSIFICATIONS, [], 'sortorder ASC, name ASC');
        return array_values($records);
    }

    /**
     * Get a single risk classification by ID.
     *
     * @param int $id
     * @return object
     */
    public static function get_classification($id) {
        global $DB;

        // Only allow cal reviewers.
        if (!workflow_lib::is_cal_reviewer()) {
            throw new \Exception("Permission denied.");
        }
        
        return $DB->get_record(static::TABLE_CLASSIFICATIONS, ['id' => $id]);
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
        
        // Check if name already exists (excluding current record if updating)
        $existing = $DB->get_record(static::TABLE_CLASSIFICATIONS, ['name' => $data->name]);
        if ($existing && (!isset($data->id) || $existing->id != $data->id)) {
            throw new \Exception("A classification with this name already exists.");
        }
        
        if (isset($data->id) && $data->id) {
            // Update existing
            $DB->update_record(static::TABLE_CLASSIFICATIONS, $data);
            $id = $data->id;
        } else {
            // Set sortorder for new records
            if (!isset($data->sortorder)) {
                $maxsort = $DB->get_field_sql("SELECT MAX(sortorder) FROM {" . static::TABLE_CLASSIFICATIONS . "}");
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
        
        // Check if classification is used by any risks
        $used = $DB->record_exists(static::TABLE_RISK_CLASSIFICATIONS, ['classificationid' => $id]);
        if ($used) {
            throw new \Exception("Cannot delete classification as it is used by existing risks.");
        }
        
        $DB->delete_records(static::TABLE_CLASSIFICATIONS, ['id' => $id]);
        return ['success' => true];
    }

    /**
     * Get all risks.
     *
     * @return array
     */
    public static function get_risks() {
        global $DB;
        
        // Only allow cal reviewers.
        if (!workflow_lib::is_cal_reviewer()) {
            throw new \Exception("Permission denied.");
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
            LEFT JOIN {" . static::TABLE_RISK_CLASSIFICATIONS . "} rc ON r.id = rc.riskid
            GROUP BY r.id, r.hazard, r.riskrating_before, r.controlmeasures, r.riskrating_after, r.responsible_person, r.control_timing, r.risk_benefit, r.isstandard
            ORDER BY r.id ASC
        ";
    
        $records = $DB->get_records_sql($sql);
        service_lib::cast_fields($records, [
            'isstandard' => 'int',
            'riskrating_before' => 'int',
            'riskrating_after' => 'int'
        ]);
    
        // Convert classification_ids string to array
        foreach ($records as &$record) {
            if (!empty($record->classification_ids)) {
                $record->classification_ids = explode(',', $record->classification_ids);
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
        static::update_risk_classifications($id, $classification_ids);
        
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
     */
    private static function update_risk_classifications($riskid, $classification_ids) {
        global $DB;

        // Only allow cal reviewers.
        if (!workflow_lib::is_cal_reviewer()) {
            throw new \Exception("Permission denied.");
        }
        
        // Delete existing classifications
        $DB->delete_records(static::TABLE_RISK_CLASSIFICATIONS, ['riskid' => $riskid]);
        
        // Add new classifications
        foreach ($classification_ids as $classification_id) {
            $DB->insert_record(static::TABLE_RISK_CLASSIFICATIONS, [
                'riskid' => $riskid,
                'classificationid' => $classification_id
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
     * @return array
     */
    public static function search_classifications($query) {
        global $DB;
        
        // Only allow cal reviewers.
        if (!workflow_lib::is_cal_reviewer()) {
            throw new \Exception("Permission denied.");
        }
        
        $sql = "SELECT * FROM {" . static::TABLE_CLASSIFICATIONS . "} 
                WHERE name LIKE ? 
                ORDER BY sortorder ASC, name ASC";
        
        $records = $DB->get_records_sql($sql, ['%' . $query . '%']);
        return array_values($records);
    }
}