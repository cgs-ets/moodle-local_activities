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

    /** Table to store risk assessments. */
    const TABLE_RA_GENS = 'activities_ra_gens';


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

        // Validate the data.
        if (empty($activityid) || empty($riskversion) || empty($classifications)) {
            throw new \Exception("Invalid risk assessment data.");
        }

        // Get the activity.
        $activity = $DB->get_record('activities', ['id' => $activityid]);
        if (!$activity) {
            throw new \Exception("Activity not found.");
        }

        // Check if user can edit activity.
        if (!utils_lib::has_capability_edit_activity($activityid)) {
            throw new \Exception("You do not have permission to generate a risk assessment for this activity.");
        }


        try {
            $id = $DB->insert_record(static::TABLE_RA_GENS, [
                'activityid' => $activityid,
                'riskversion' => $riskversion,
                'classifications' => json_encode($classifications),
            ]);
        } catch (\Exception $e) {
            throw new \Exception("Failed to generate risk assessment.");
        }

        // Generate the PDF risk assessment based on the risk assessment JSON.
        $pdf = static::generate_pdf_risk_assessment($classifications, $riskversion);

        return ['id' => $id, 'success' => true];
    }

    /**
     * Generate the PDF risk assessment based on the risk assessment JSON.
     *
     * @param string $riskassessmentjson
     * @return string
     */
    public static function generate_pdf_risk_assessment($classifications, $riskversion) {
        //$standardrisks = static::get_standard_risks($riskversion);
        $risks = static::get_risks_for_classifications($classifications, $riskversion);

        // Group risks by classification. 
        $risks_by_hazards = [];
        $risks_by_contexts = [];
        $risks_processed = [];
        foreach ($risks as $risk) {
            foreach ($risk->classifications as $classification) {
                // Only add the risk if it hasn't been added yet.
                if (in_array($risk->id, $risks_processed)) {
                    break;
                }
                // Add the risk into the correct area.
                if ($classification->type === 'hazards') {
                    $risks_by_hazards[$classification->id][] = $risk;
                } else {
                    $risks_by_contexts[$classification->id][] = $risk;
                }
                // Keep track of risks that have been added to an array because I only want to add each risk once.
                $risks_processed[] = $risk->id;
            }
        }

        // Get the classifications for the risk version.
        $classifications = risk_versions_lib::get_classifications($riskversion);

      
        var_export($risks_by_contexts);
        var_export($risks_by_hazards);
        die();


        
        /*
         Example Data:
            array (
                0 => 
                (object) array(
                    'id' => '54',
                    'hazard' => 'Medical Issues - Child Illness or Injury on the excursion',
                    'riskrating_before' => 3,
                    'controlmeasures' => 'XEmergency, Medical and Contact details for all children are to be carried in the excursion bag. The educator in charge is to carry a fully charged mobile phone to make emergency calls as required. 
                All accompaning educators to have access to School Emergency Contact details and the schools IAP Card (contained in the First Aid Kit) . 
                A suitable First Aid Kit is to be taken on the excursion in the excursion bag. An educator with the first aid qualification titled ‘Provide First Aid in An Education and Care Setting’ will accompany the excursion. 
                Spare auto injectors and Ventolin to be packed in the excursion bag. 
                If an incident occurs whilst on the excursion, an incident report is to be completed online through ‘Log an incident’ button on CGS Connect. In the event of a serious injury (the child needing to leave the excursion), an incident report is to be completed on the paper incident report and transferred to the online portal once back at school. 
                Family is to be notified of incident/illness/injury/trauma within 24hrs and sign the Incident report.',
                    'riskrating_after' => 5,
                    'responsible_person' => 'Educator in charge',
                    'control_timing' => 'Before and During the Excursion ',
                    'risk_benefit' => '',
                    'isstandard' => 0,
                    'version' => 7,
                    'classification_ids' => 
                    array (
                    0 => 467,
                    1 => 484,
                    ),
                ),
            )
        */



    }

    /**
     * Get the risks for the risk version that match the classifications
     *
     * @param array $classifications
     * @param int $riskversion
     * @return array
     */
    private static function get_risks_for_classifications($classifications, $riskversion) {
        global $DB;
        
        // First get all the risks for this version.
        $risks = risk_versions_lib::get_risks_with_classifications($riskversion);

        // Then filter the risks to only include those that match the classifications.
        $risks = array_filter($risks, function($risk) use ($classifications) {
            // Check if all of the risks classifications are in the selected classifications.
            // Get the classifications in common.
            $classifications_in_common = array_intersect($risk->classification_ids, $classifications);
            // Check if the number of classifications in common is the same as the number of classifications in the risk.
            // Example 1: 
            // - The risk has "K-2" and "Walk", and the selected are "K-2", "Walk", "Playground".
            //   - The number of common classifications is 2, and the number of classifications in the risk is 2.
            //   - So the risk should be kept.
            // Example 2: 
            // - The risk has "K-2", "Walk", "Pool", and the selected are "K-2", "Walk", "Playground".
            //   - The number of common classifications is 2, and the number of classifications in the risk is 3.
            //   - So the risk should be filtered out.
            return count($classifications_in_common) === count($classifications);
        });

        return $risks;
    }

    
}