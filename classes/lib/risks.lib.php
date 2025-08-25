<?php

namespace local_activities\lib;

defined('MOODLE_INTERNAL') || die();

require_once($CFG->dirroot . '/local/activities/config.php');
require_once(__DIR__.'/utils.lib.php');
require_once(__DIR__.'/service.lib.php');
require_once(__DIR__.'/workflow.lib.php');
require_once(__DIR__.'/risk_versions.lib.php');
require_once($CFG->dirroot . '/local/activities/vendor/autoload.php');

use \local_activities\lib\utils_lib;
use \local_activities\lib\service_lib;
use \local_activities\lib\workflow_lib;
use \local_activities\lib\risk_versions_lib;
use \moodle_exception;

/**
 * Risks lib
 */
class risks_lib {

    /** Table to store risk assessments. */
    const TABLE_RA_GENS = 'activities_ra_gens';
    const TABLE_RA_GENS_RISKS = 'activities_ra_gens_risks';


    /**
     * Generate a risk assessment.
     *
     * @param object $data
     * @return array
     */
    public static function generate_ra($data) {
        global $DB;

        $data = json_decode(json_encode($data), false);
        $activityid = $data->activityid;
        $riskversion = $data->riskassessment->riskVersion;
        $classifications = $data->riskassessment->selectedClassifications;
        $customRisks = isset($data->customRisks) ? $data->customRisks : [];

        // Validate the data.
        if (empty($activityid) || empty($riskversion) || empty($classifications)) {
            throw new \Exception("Invalid risk assessment data.");
        }

        // Get the activity.
        $activity = new Activity($activityid);
        if (!$activity) {
            throw new \Exception("Activity not found.");
        }

        // Check if user can edit activity.
        if (!utils_lib::has_capability_edit_activity($activityid)) {
            throw new \Exception("You do not have permission to generate a risk assessment for this activity.");
        }

        try {
            // Prepare the additional fields data
            $additionalFields = [
                'activityid' => $activityid,
                'riskversion' => $riskversion,
                'classifications' => json_encode($classifications),
                'timecreated' => time(),
                'reason_for_activity' => isset($data->reasonForActivity) ? $data->reasonForActivity : '',
                'proposed_activities' => isset($data->proposedActivities) ? $data->proposedActivities : '',
                'anticipated_students' => isset($data->anticipatedStudents) ? intval($data->anticipatedStudents) : 0,
                'anticipated_adults' => isset($data->anticipatedAdults) ? intval($data->anticipatedAdults) : 0,
                'leader' => isset($data->leader) ? $data->leader : '',
                'leader_contact' => isset($data->leaderContact) ? $data->leaderContact : '',
                'second_in_charge' => isset($data->secondInCharge) ? $data->secondInCharge : '',
                'second_in_charge_contact' => isset($data->secondInChargeContact) ? $data->secondInChargeContact : '',
                'location_contact_person' => isset($data->locationContactPerson) ? $data->locationContactPerson : '',
                'location_contact_number' => isset($data->locationContactNumber) ? $data->locationContactNumber : '',
                'site_visit_reviewer' => isset($data->siteVisitReviewer) ? $data->siteVisitReviewer : '',
                'site_visit_date' => isset($data->siteVisitDate) ? $data->siteVisitDate : 0,
                'water_hazards_present' => isset($data->waterHazardsPresent) ? $data->waterHazardsPresent : '',
                'staff_qualifications' => isset($data->staffQualifications) ? $data->staffQualifications : '',
                'other_qualifications' => isset($data->otherQualifications) ? $data->otherQualifications : '',
            ];

            $id = $DB->insert_record(static::TABLE_RA_GENS, $additionalFields);

            // Save custom risks if any
            if (!empty($customRisks)) {
                foreach ($customRisks as $customRisk) {
                    $DB->insert_record(static::TABLE_RA_GENS_RISKS, [
                        'ra_gen_id' => $id,
                        'hazard' => $customRisk->hazard,
                        'riskrating_before' => $customRisk->riskrating_before,
                        'controlmeasures' => $customRisk->controlmeasures,
                        'riskrating_after' => $customRisk->riskrating_after,
                        'responsible_person' => $customRisk->responsible_person,
                        'control_timing' => $customRisk->control_timing,
                        'risk_benefit' => $customRisk->risk_benefit,
                    ]);
                }
            }

            // Generate the PDF risk assessment based on the risk assessment JSON.
            $pdf = static::generate_pdf_risk_assessment($id, $activityid, $classifications, $riskversion);

        } catch (\Exception $e) {
            throw new \Exception("Failed to generate risk assessment.");
        }


        return ['id' => $id, 'success' => true];
    }

    /**
     * Generate the PDF risk assessment based on the risk assessment JSON.
     *
     * @param string $riskassessmentjson
     * @return string
     */
    public static function generate_pdf_risk_assessment($id, $activityid, $classifications, $riskversion) {
        global $DB, $USER;

        $activity = new Activity($activityid);
        if (!$activity) {
            throw new \Exception("Activity not found.");
        }

        $activity = $activity->export();

        // Append additional fields to activity.
        $ra_gen = $DB->get_record(static::TABLE_RA_GENS, ['id' => $id]);
        $activity = (object) array_merge((array) $activity, (array) $ra_gen);
        $activity->staff_qualifications = json_decode($activity->staff_qualifications);
        $activity->is_other_qualification = in_array('Other', $activity->staff_qualifications);

        // Get the risks for the classifications.
        $risks = static::get_risks_for_classifications($classifications, $riskversion);

        // Group risks by classification. 
        $hazard_risks = [];
        $risks_processed = [];
        foreach ($risks as $risk) {
            foreach ($risk->classifications as $classification) {
                // If the risk has a qualifying set, and the qualifying set is not in the selected classifications, skip it.
                if (isset($risk->qualifying_set) && !in_array($classification->id, $risk->qualifying_set)) {
                    continue;
                }

                // RISKS DO NOT APPEAR FOR CONTEXTS!
                if ($classification->type === 'context') {
                    continue;
                }
                // Only add the risk if it hasn't been added yet.
                if (in_array($risk->id, $risks_processed)) {
                    break;
                }
                $hazard_risks[$classification->id][] = $risk;
                // Keep track of risks that have been added to an array because I only want to add each risk once.
                $risks_processed[] = $risk->id;
            }
        }

        $all_classifications = risk_versions_lib::get_classifications($riskversion);
        $used_classifications = array_filter($all_classifications, function($classification) use ($hazard_risks) {
            return isset($hazard_risks[$classification->id]);
        });
        foreach ($used_classifications as $classification) {
            $classification->risks = $hazard_risks[$classification->id];
            $classification->risks_count = count($classification->risks);
            $classification->risks_count_string = $classification->risks_count . ' ' . ($classification->risks_count === 1 ? 'risk' : 'risks');
        }

        // Add custom risks to the classifications.
        $custom_risks = array_values($DB->get_records(static::TABLE_RA_GENS_RISKS, ['ra_gen_id' => $id]));
        if ($custom_risks) {
            $used_classifications[] = (object) [
                'name' => 'Additional Risks',
                'risks' => $custom_risks,
                'risks_count' => count($custom_risks),
                'risks_count_string' => count($custom_risks) . ' ' . (count($custom_risks) === 1 ? 'risk' : 'risks'),
            ];
        }

        $htmlContent = static::generate_html($activity, $used_classifications);
        $htmlFile = 'html_risk_assessment.html';
        file_put_contents($htmlFile, $htmlContent);

        // Create Dompdf instance
        $dompdf = new \Dompdf\Dompdf();
        
        // Set options
        $dompdf->setOptions(new \Dompdf\Options([
            'isHtml5ParserEnabled' => true,
            'isPhpEnabled' => false,
            'isRemoteEnabled' => false,
            'defaultFont' => 'Arial',
            'dpi' => 96,
            'margin_top' => 30,
            'margin_right' => 30,
            'margin_bottom' => 30,
            'margin_left' => 30,
        ]));
        
        // Load HTML content
        $dompdf->loadHtml($htmlContent);
        
        // Set paper size and orientation
        $dompdf->setPaper('A4', 'landscape');
        
        // Render the PDF
        $dompdf->render();
        
        // Save PDF file
        $filename = 'pdf_risk_assessment_'. $activityid .'_'. $id .'_'. date('Y-m-d-H-i-s', time()) . '_' . $USER->id . '.pdf';
        $fileinfo = [
            'contextid' => \context_system::instance()->id,
            'component' => 'local_activities',
            'filearea' => 'ra_generations',
            'itemid' => $id,
            'filepath' => '/',
            'filename' => $filename,
        ];
        //file_put_contents($pdfFile, $dompdf->output());
        $fs = get_file_storage();
        $fs->create_file_from_string(
            $fileinfo,
            $dompdf->output()
        );
        
        // Clean up
        unset($dompdf);
    }

    /**
     * Get the risks for the risk version that match the classifications
     *
     * @param array $selected
     * @param int $riskversion
     * @return array
     */
    private static function get_risks_for_classifications($selected, $riskversion) {
        global $DB;
        
        // First get all the risks for this version.
        $risks = risk_versions_lib::get_risks_with_classifications($riskversion);
        $standard_classifications = risk_versions_lib::get_classifications($riskversion, true);
        $standard_classification_ids = array_column($standard_classifications, 'id');

        // Then filter the risks to only include those that match the classifications.
        $risks = array_filter($risks, function($risk) use ($selected, $standard_classification_ids) {
            // Check if ANY of the classification sets match the selected classifications
            foreach ($risk->classification_sets as $classification_set) {
                // We need to exclude standard classifications from the check as they are not selectable.
                $risk_classification_ids = array_diff($classification_set, $standard_classification_ids);
                
                if (empty($risk_classification_ids)) {
                    continue; // Skip empty sets
                }

                // Check if all of the risk's classifications in this set are in the selected classifications.
                // Get the classifications in common.
                $classifications_in_common = array_intersect($risk_classification_ids, $selected);
                
                // Check if the number of classifications in common is the same as the number of classifications in the risk set.
                // Example 1: 
                // - The risk has set ["K-2", "Walk"], and the selected are ["K-2", "Walk", "Playground"].
                //   - The number of common classifications is 2, and the number of classifications in the risk set is 2.
                //   - So the risk should be kept.
                // Example 2: 
                // - The risk has set ["K-2", "Walk", "Pool"], and the selected are ["K-2", "Walk", "Playground"].
                //   - The number of common classifications is 2, and the number of classifications in the risk set is 3.
                //   - So this set doesn't match, but we continue checking other sets.
                
                if (count($classifications_in_common) === count($risk_classification_ids)) {
                    $risk->qualifying_set = $classification_set;
                    return true; // This set matches, so include the risk
                }
            }
            
            return false; // No sets matched
        });

        return $risks;
    }


    private static function generate_html($activity, $classifications) {
        global $OUTPUT;
        $data = [
            'activity' => $activity,
            'classifications' => array_values($classifications),
        ];
        return $OUTPUT->render_from_template('local_activities/risk_assessment', $data);
    }


    public static function get_classifications_preselected($version, $activityid) {
        $classifications = risk_versions_lib::get_classifications($version);
        $activity = new Activity($activityid);
        $activity = $activity->export();

        // Do not show excursion or incursion. These are not selectable.
        $classifications = array_map(function($classification) {
            if ($classification->name === 'Excursion' || $classification->name === 'Incursion') {
                $classification->hidden = true;
            }
            return $classification;
        }, $classifications);

        // Pre-select the classifications for the activity type.
        if ($activity->activitytype === 'excursion') {
            // Search for the classification with the name "Excursion" and set the "preselected" property to true.
            $classificationix = array_search('Excursion', array_column($classifications, 'name'));
            $classifications[$classificationix]->preselected = true;
        } else {
            // Search for the classification with the name "Incursion" and set the "preselected" property to true.
            $classificationix = array_search('Incursion', array_column($classifications, 'name'));
            $classifications[$classificationix]->preselected = true;
        }
        return $classifications;
    }


    public static function get_ra_generations($activityid) {
        global $DB, $CFG;

        $ra_generations = $DB->get_records(static::TABLE_RA_GENS, ['activityid' => $activityid, 'deleted' => 0], 'timecreated DESC');
        foreach ($ra_generations as $ra_generation) {
            // Classifications
            $classification_ids = json_decode($ra_generation->classifications);
            [$insql, $inparams] = $DB->get_in_or_equal($classification_ids);
            $sql = "SELECT * FROM {activities_classifications} WHERE id $insql";
            $ra_generation->classifications = array_values($DB->get_records_sql($sql, $inparams));

            // Custom risks
            $custom_risks = $DB->get_records(static::TABLE_RA_GENS_RISKS, ['ra_gen_id' => $ra_generation->id]);
            $ra_generation->custom_risks = array_values($custom_risks);

            // Map additional fields to frontend field names
            $ra_generation->reasonForActivity = $ra_generation->reason_for_activity ?? '';
            $ra_generation->proposedActivities = $ra_generation->proposed_activities ?? '';
            $ra_generation->anticipatedStudents = $ra_generation->anticipated_students ?? 0;
            $ra_generation->anticipatedAdults = $ra_generation->anticipated_adults ?? 0;
            $ra_generation->leader = $ra_generation->leader ?? '';
            $ra_generation->leaderContact = $ra_generation->leader_contact ?? '';
            $ra_generation->secondInCharge = $ra_generation->second_in_charge ?? '';
            $ra_generation->secondInChargeContact = $ra_generation->second_in_charge_contact ?? '';
            $ra_generation->locationContactPerson = $ra_generation->location_contact_person ?? '';
            $ra_generation->locationContactNumber = $ra_generation->location_contact_number ?? '';
            $ra_generation->siteVisitReviewer = $ra_generation->site_visit_reviewer ?? '';
            $ra_generation->siteVisitDate = $ra_generation->site_visit_date ? date('Y-m-d', $ra_generation->site_visit_date) : '';
            $ra_generation->waterHazardsPresent = $ra_generation->water_hazards_present ?? '';
            $ra_generation->staffQualifications = $ra_generation->staff_qualifications ? json_decode($ra_generation->staff_qualifications) : [];
            $ra_generation->otherQualifications = $ra_generation->other_qualifications ?? '';

            // Download url
            $fs = get_file_storage();
            $files = $fs->get_area_files(1, 'local_activities', 'ra_generations', $ra_generation->id, "filename", false);
            if ($files) {
                foreach ($files as $file) {
                    $ra_generation->download_url = $CFG->wwwroot . '/pluginfile.php/1/local_activities/ra_generations/' . $ra_generation->id . '/' . $file->get_filename();
                    break;
                }
            }
        }
        return array_values($ra_generations);
    }

    /**
     * Get a single risk assessment by ID.
     *
     * @param int $id
     * @return object
     */
    public static function get_risk_assessment($id) {
        global $DB, $CFG;

        $ra_generation = $DB->get_record(static::TABLE_RA_GENS, ['id' => $id]);
        if (!$ra_generation) {
            return null;
        }

        // Classifications
        $classification_ids = json_decode($ra_generation->classifications);
        [$insql, $inparams] = $DB->get_in_or_equal($classification_ids);
        $sql = "SELECT * FROM {activities_classifications} WHERE id $insql";
        $ra_generation->classifications = array_values($DB->get_records_sql($sql, $inparams));

        // Custom risks
        $custom_risks = $DB->get_records(static::TABLE_RA_GENS_RISKS, ['ra_gen_id' => $ra_generation->id]);
        $ra_generation->custom_risks = array_values($custom_risks);

        // Map additional fields to frontend field names
        $ra_generation->reasonForActivity = $ra_generation->reason_for_activity ?? '';
        $ra_generation->proposedActivities = $ra_generation->proposed_activities ?? '';
        $ra_generation->anticipatedStudents = $ra_generation->anticipated_students ?? 0;
        $ra_generation->anticipatedAdults = $ra_generation->anticipated_adults ?? 0;
        $ra_generation->leader = $ra_generation->leader ?? '';
        $ra_generation->leaderContact = $ra_generation->leader_contact ?? '';
        $ra_generation->secondInCharge = $ra_generation->second_in_charge ?? '';
        $ra_generation->secondInChargeContact = $ra_generation->second_in_charge_contact ?? '';
        $ra_generation->locationContactPerson = $ra_generation->location_contact_person ?? '';
        $ra_generation->locationContactNumber = $ra_generation->location_contact_number ?? '';
        $ra_generation->siteVisitReviewer = $ra_generation->site_visit_reviewer ?? '';
        $ra_generation->siteVisitDate = $ra_generation->site_visit_date ? date('Y-m-d', $ra_generation->site_visit_date) : '';
        $ra_generation->waterHazardsPresent = $ra_generation->water_hazards_present ?? '';
        $ra_generation->staffQualifications = $ra_generation->staff_qualifications ? json_decode($ra_generation->staff_qualifications) : [];
        $ra_generation->otherQualifications = $ra_generation->other_qualifications ?? '';

        // Download url
        $fs = get_file_storage();
        $files = $fs->get_area_files(1, 'local_activities', 'ra_generations', $ra_generation->id, "filename", false);
        if ($files) {
            foreach ($files as $file) {
                $ra_generation->download_url = $CFG->wwwroot . '/pluginfile.php/1/local_activities/ra_generations/' . $ra_generation->id . '/' . $file->get_filename();
                break;
            }
        }

        return $ra_generation;
    }

    /**
     * Get the last risk assessment generation for an activity.
     *
     * @param int $activityid
     * @return object
     */
    public static function get_last_ra_gen($activityid) {
        global $DB;

        // Get the latest ra generation for the activity.
        $ra_generation = $DB->get_records(static::TABLE_RA_GENS, ['activityid' => $activityid, 'deleted' => 0], 'timecreated DESC', '*', 0, 1);
        if (!$ra_generation) {
            return null;
        }
        $ra_generation = reset($ra_generation);

        // Get the custom risks for this generation.
        $custom_risks = $DB->get_records(static::TABLE_RA_GENS_RISKS, ['ra_gen_id' => $ra_generation->id]);
        $ra_generation->custom_risks = array_values($custom_risks);

        return  $ra_generation;
    }


    /**
     * Delete a risk assessment generation.
     *
     * @param int $id
     * @return object
     */
    public static function delete_ra_generation($id) {
        global $DB;

        // Get the RA generation.
        $ra_generation = $DB->get_record(static::TABLE_RA_GENS, ['id' => $id]);
        if (!$ra_generation) {
            return false;
        }

        // Check if the user has the capability to delete RA generations.
        if (!utils_lib::has_capability_edit_activity($ra_generation->activityid)) {
            return false;
        }

        // Delete the RA generation.
        $ra_generation->deleted = 1;
        return $DB->update_record(static::TABLE_RA_GENS, $ra_generation);
    }


    /**
     * Approve a risk assessment generation.
     *
     * @param int $id
     * @return object
     */
    public static function approve_ra_generation($id, $approved) {
        global $DB;

        // Get the RA generation.
        $ra_generation = $DB->get_record(static::TABLE_RA_GENS, ['id' => $id]);
        if (!$ra_generation) {
            return false;
        }

        // Check if the user is an approver.
        if (!utils_lib::is_user_approver()) {
            return false;
        }

        if ($approved) {
            // Remove approval from all RA generations for this activity.
            $sql = "UPDATE {activities_ra_gens} SET approved = 0 WHERE activityid = :activityid";
            $DB->execute($sql, ['activityid' => $ra_generation->activityid]);

            // Approve the RA generation.
            $ra_generation->approved = 1;
            return $DB->update_record(static::TABLE_RA_GENS, $ra_generation);
        } else {
            // Remove approval from the RA generation.
            $ra_generation->approved = 0;
            return $DB->update_record(static::TABLE_RA_GENS, $ra_generation);
        }
       
    }
}