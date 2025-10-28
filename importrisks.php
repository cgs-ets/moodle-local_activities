<?php

require_once(dirname(__FILE__) . '/../../config.php');
require_once(dirname(__FILE__) . '/classes/lib/activities.lib.php');
require_once(dirname(__FILE__) . '/classes/lib/risk_versions.lib.php');
require_once($CFG->dirroot . '/local/activities/vendor/autoload.php');

use PhpOffice\PhpSpreadsheet\IOFactory;
use \local_activities\lib\risk_versions_lib;

$context = context_system::instance();
$PAGE->set_context($context);
$pageurl = new moodle_url('/local/activities/debugger.php');
$PAGE->set_url($pageurl);
$title = get_string('pluginname', 'local_activities');
$PAGE->set_heading($title);
$PAGE->set_title($SITE->fullname . ': ' . $title);
$PAGE->navbar->add($title);

require_login();
require_capability('moodle/site:config', $context, $USER->id);

global $DB;

// Get next version number
$version = risk_versions_lib::get_draft_version();
var_export($version); exit;

// Create the new version in the db
risk_versions_lib::create_version_entry($version);

// Path to uploaded Excel (adjust if needed)
$excelpath = $CFG->dirroot . '/local/activities/risks.xlsx';

// Load spreadsheet
$spreadsheet = IOFactory::load($excelpath);
$sheet = $spreadsheet->getActiveSheet();
$rows = $sheet->toArray();

// Skip header row
array_shift($rows);

foreach ($rows as $row) {
    list($classificationname, $hazard, $riskbefore, $controlmeasures, $riskafter,
         $responsible, $timing, $riskbenefit) = $row;

    // 1. Split classification names by '||' and trim whitespace
    $classification_names = array_map('trim', explode('||', $classificationname));
    $classification_ids = [];

    // 2. Find or create each classification
    foreach ($classification_names as $i => $name) {
        if (empty($name)) {
            continue; // Skip empty names
        }
        
        $classification = $DB->get_record('activities_classifications', [
            'name' => $name,
            'version' => $version
        ]);

        // Classifications are "context" except for the last one, which is a hazard.
        $type = ($i < count($classification_names) -1) ? 'context' : 'hazard';

        if (!$classification) {
            $classification = new stdClass();
            $classification->name = $name;
            $classification->icon = '';
            $classification->type = $type;
            $classification->description = '';
            $classification->sortorder = $type == 'hazard' ? 2 : 1;
            $classification->isstandard = 0;
            $classification->version = $version;
            $classification->id = $DB->insert_record('activities_classifications', $classification);
        }
        
        $classification_ids[] = $classification->id;
    }

    // 3. Insert risk
    $risk = new stdClass();
    $risk->hazard = $hazard ? trim($hazard, " \"'") : '';
    $risk->riskrating_before = $riskbefore ? (int)$riskbefore : 0;
    $risk->controlmeasures = $controlmeasures ? trim($controlmeasures, " \"'") : '';
    $risk->riskrating_after = $riskafter ? (int)$riskafter : 0;
    $risk->responsible_person = $responsible ? trim($responsible, " \"'") : '';
    $risk->control_timing = $timing ? $timing : '';
    $risk->risk_benefit = $riskbenefit ? trim($riskbenefit, " \"'") : '';
    $risk->isstandard = 0;
    $risk->version = $version;
    $riskid = $DB->insert_record('activities_risks', $risk);

    // 4. Create classification set for this risk
    $classification_set = new stdClass();
    $classification_set->riskid = $riskid;
    $classification_set->set_order = 1;
    $classification_set->version = $version;
    $set_id = $DB->insert_record('activities_risk_classification_sets', $classification_set);

    // 5. Add all classifications to the set
    foreach ($classification_ids as $classification_id) {
        $set_member = new stdClass();
        $set_member->set_id = $set_id;
        $set_member->classificationid = $classification_id;
        $set_member->version = $version;
        $DB->insert_record('activities_risk_classification_set_members', $set_member);
    }
}

echo $OUTPUT->header();
echo html_writer::div("Risks imported successfully!");
echo $OUTPUT->footer();
exit;
