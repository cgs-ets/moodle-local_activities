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

$run = optional_param('run', 0, PARAM_INT);

global $DB;

// Get next version number
$version = risk_versions_lib::get_draft_version();

// Create the new version in the db
if ($run) {
    risk_versions_lib::create_version_entry($version);
    echo html_writer::div("Inserted version: " . $version);
}

// Path to uploaded Excel (adjust if needed)
$excelpath = $CFG->dirroot . '/local/activities/risks.xlsx';

// Load spreadsheet
$spreadsheet = IOFactory::load($excelpath);

// Get a specific sheet by name
$risksSheet = $spreadsheet->getSheetByName('Risks');
$templatesSheet = $spreadsheet->getSheetByName('Templates');
$buttonsSheet = $spreadsheet->getSheetByName('Buttons');

// Convert to array if needed
$risksRows = $risksSheet->toArray();
$buttonsRows = $buttonsSheet->toArray();

// Skip header row
array_shift($risksRows);
array_shift($buttonsRows);


echo $OUTPUT->header();

// First, create all of the classifications/buttons.
$sorti = 0;
foreach ($buttonsRows as $row) {
    list($name, $desc, $type, $isstandard, $includes) = $row;
    $classification = $DB->get_record('activities_classifications', [
        'name' => $name,
        'version' => $version
    ]);
    $type = empty($type) ? 'context' : $type;
    $isstandard = !$isstandard ? 0 : 1;
    $sorti++;
    if (empty($classification) && $name) {
        $classification = new stdClass();
        $classification->name = $name;
        $classification->icon = '';
        $classification->type = $type;
        $classification->description = $desc;
        $classification->sortorder = $sorti;
        $classification->isstandard = $isstandard;
        $classification->version = $version;
        $classification->includes = $includes;
        if ($run) {
            $classification->id = $DB->insert_record('activities_classifications', $classification);
        }
        echo html_writer::div("Insert classification button: " . $name . ", " . $type . ", " . $isstandard . ", " . $sorti);
    }
}

// Insert the risks
foreach ($risksRows as $row) {
    list($classificationname, $hazard, $riskbefore, $controlmeasures, $riskafter,
         $responsible, $timing, $riskbenefit) = $row;

    // 1. Split classification names by '||' and trim whitespace
    $classification_names = array_map('trim', explode('||', $classificationname));
    if (empty($classification_names)) {
        continue;
    }
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

        
        // If this classification was not listed in the buttons sheet, we need to create it now..
        if (!$classification) {
            // Classifications are "context" except for the last one, which is a hazard.
            $type = ($i < count($classification_names) -1) ? 'context' : 'hazard';
            $classification = new stdClass();
            $classification->name = $name;
            $classification->icon = '';
            $classification->type = $type;
            $classification->description = '';
            $classification->sortorder = $type == 'hazard' ? 999 : 888;
            $classification->isstandard = 0;
            $classification->version = $version;
            $classification->includes = '';
            if ($run) {
                $classification->id = $DB->insert_record('activities_classifications', $classification);
            }
            echo html_writer::div("Not Found - classification: " . $name);
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
    if ($run) {
        $riskid = $DB->insert_record('activities_risks', $risk);
    }
    echo html_writer::div("Insert risk: " . $risk->hazard);

    // 4. Create classification set for this risk
    $classification_set = new stdClass();
    $classification_set->riskid = $riskid;
    $classification_set->set_order = 1;
    $classification_set->version = $version;
    if ($run) {
        $set_id = $DB->insert_record('activities_risk_classification_sets', $classification_set);
    }

    // 5. Add all classifications to the set
    foreach ($classification_ids as $classification_id) {
        $set_member = new stdClass();
        $set_member->set_id = $set_id;
        $set_member->classificationid = $classification_id;
        $set_member->version = $version;
        if ($run) {
            $DB->insert_record('activities_risk_classification_set_members', $set_member);
        }
    }
}

if ($run) {
echo html_writer::div("Risks imported successfully!");
} else {
echo html_writer::div("Dry run successful!");
}
echo $OUTPUT->footer();
exit;
