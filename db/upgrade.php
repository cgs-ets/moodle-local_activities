<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * Post installation and migration code.
 *
 * @package   local_activities
 * @copyright 2025 Michael Vangelovski
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

function xmldb_local_activities_upgrade($oldversion) {
    global $DB;

    $dbman = $DB->get_manager();

    if ($oldversion < 2025060300) {

        $table = new xmldb_table('activities');
        $field = new xmldb_field('recurring', XMLDB_TYPE_INTEGER, '1', null, XMLDB_NOTNULL, null, 0, null, 'isallday');
        $field2 = new xmldb_field('recurrence', XMLDB_TYPE_TEXT, null, null, null, null, null, 'recurring');

        if (!$dbman->field_exists($table, $field)) {
            $dbman->add_field($table, $field);
        }

        if (!$dbman->field_exists($table, $field2)) {
            $dbman->add_field($table, $field2);
        }

        upgrade_plugin_savepoint(true, 2025060300, 'local', 'activities');
    }

    if ($oldversion < 2025060400) {
        $table = new xmldb_table('activities_occurrences');
        $table->add_field('id', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, XMLDB_SEQUENCE, null);
        $table->add_field('activityid', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null, 0, null, 'id');
        $table->add_field('timestart', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null, 0, null, 'activityid');
        $table->add_field('timeend', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null, 0, null, 'timestart');
        $table->add_key('primary', XMLDB_KEY_PRIMARY, ['id']);
        $table->add_key('fk_activityid', XMLDB_KEY_FOREIGN, ['activityid'], 'activities', ['id']);
        if (!$dbman->table_exists($table)) {
            $dbman->create_table($table);
        }

        upgrade_plugin_savepoint(true, 2025060400, 'local', 'activities');
    }

    if ($oldversion < 2025060600) {
        $table = new xmldb_table('activities_assessments_students');
        $table->add_field('id', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, XMLDB_SEQUENCE, null);
        $table->add_field('assessmentid', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null, 0, null, 'id');
        $table->add_field('username', XMLDB_TYPE_CHAR, '100', null, XMLDB_NOTNULL, null, null, null, 'assessmentid');
        $table->add_key('primary', XMLDB_KEY_PRIMARY, ['id']);
        $table->add_key('fk_assessmentid', XMLDB_KEY_FOREIGN, ['assessmentid'], 'activities_assessments', ['id']);
        if (!$dbman->table_exists($table)) {
            $dbman->create_table($table);
        }

        upgrade_plugin_savepoint(true, 2025060600, 'local', 'activities');
    }

    if ($oldversion < 2025061000) {
        $table = new xmldb_table('activities_assessments');
        $rollrequired = new xmldb_field('rollrequired', XMLDB_TYPE_INTEGER, '1', null, XMLDB_NOTNULL, null, 0, null, 'activityid');
        $activityrequired = new xmldb_field('activityrequired', XMLDB_TYPE_INTEGER, '1', null, XMLDB_NOTNULL, null, 0, null, 'rollrequired');
        $classrollprocessed = new xmldb_field('classrollprocessed', XMLDB_TYPE_INTEGER, '1', null, XMLDB_NOTNULL, null, 0, null, 'activityrequired');
        if (!$dbman->field_exists($table, $rollrequired)) {
            $dbman->add_field($table, $rollrequired);
        }
        if (!$dbman->field_exists($table, $activityrequired)) {
            $dbman->add_field($table, $activityrequired);
        }
        if (!$dbman->field_exists($table, $classrollprocessed)) {
            $dbman->add_field($table, $classrollprocessed);
        }

        // Delete the isallday column from the activities_assessments table.
        $table = new xmldb_table('activities_assessments');
        $field = new xmldb_field('isallday', XMLDB_TYPE_INTEGER, '1', null, XMLDB_NOTNULL, null, 0, null, 'activityid');
        if ($dbman->field_exists($table, $field)) {
            $dbman->drop_field($table, $field);
        }

        upgrade_plugin_savepoint(true, 2025061000, 'local', 'activities');
    }

    if ($oldversion < 2025061800) {
        $table = new xmldb_table('activities_assessments');
        $staffincharge = new xmldb_field('staffincharge', XMLDB_TYPE_CHAR, '100', null, XMLDB_NOTNULL, null, null, null, 'activityid');
        $staffinchargejson = new xmldb_field('staffinchargejson', XMLDB_TYPE_TEXT, null, null, null, null, null, 'staffincharge');
        if (!$dbman->field_exists($table, $staffincharge)) {
            $dbman->add_field($table, $staffincharge);
        }
        if (!$dbman->field_exists($table, $staffinchargejson)) {
            $dbman->add_field($table, $staffinchargejson);
        }

        upgrade_plugin_savepoint(true, 2025061800, 'local', 'activities');
    }

    if ($oldversion < 2025062500) {
        $table = new xmldb_table('activities_cal_sync');
        $field = new xmldb_field('occurrenceid', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null, 0, null, 'activityid');
        if (!$dbman->field_exists($table, $field)) {
            $dbman->add_field($table, $field);
        }

        upgrade_plugin_savepoint(true, 2025062500, 'local', 'activities');
    }

    if ($oldversion < 2025072900) {


        // Define table activities_risks to be created.
        $table = new xmldb_table('activities_risks');

        // Adding fields to table activities_risks.
        $table->add_field('id', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, XMLDB_SEQUENCE, null);
        $table->add_field('hazard', XMLDB_TYPE_TEXT, null, null, XMLDB_NOTNULL, null, null);
        $table->add_field('riskrating_before', XMLDB_TYPE_INTEGER, '3', null, XMLDB_NOTNULL, null, null);
        $table->add_field('controlmeasures', XMLDB_TYPE_TEXT, null, null, XMLDB_NOTNULL, null, null);
        $table->add_field('riskrating_after', XMLDB_TYPE_INTEGER, '3', null, XMLDB_NOTNULL, null, null);
        $table->add_field('responsible_person', XMLDB_TYPE_CHAR, '255', null, XMLDB_NOTNULL, null, null);
        $table->add_field('control_timing', XMLDB_TYPE_CHAR, '255', null, XMLDB_NOTNULL, null, null);
        $table->add_field('risk_benefit', XMLDB_TYPE_TEXT, null, null, null, null, null);
        $table->add_field('isstandard', XMLDB_TYPE_INTEGER, '1', null, XMLDB_NOTNULL, null, '0');

        // Adding keys to table activities_risks.
        $table->add_key('primary', XMLDB_KEY_PRIMARY, ['id']);

        // Conditionally launch create table for activities_risks.
        if (!$dbman->table_exists($table)) {
            $dbman->create_table($table);
        }

        // Define table activities_classifications to be created.
        $table = new xmldb_table('activities_classifications');

        // Adding fields to table activities_classifications.
        $table->add_field('id', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, XMLDB_SEQUENCE, null);
        $table->add_field('name', XMLDB_TYPE_CHAR, '100', null, XMLDB_NOTNULL, null, null);
        $table->add_field('sortorder', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null, 0);         

        // Adding keys to table activities_classifications.
        $table->add_key('primary', XMLDB_KEY_PRIMARY, ['id']);

        // Conditionally launch create table for activities_classifications.
        if (!$dbman->table_exists($table)) {
            $dbman->create_table($table);
        }


        // Define table activities_risk_classifications to be created.
        $table = new xmldb_table('activities_risk_classifications');

        // Adding fields to table activities_risk_classifications.
        $table->add_field('id', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, XMLDB_SEQUENCE, null);
        $table->add_field('riskid', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null, null);
        $table->add_field('classificationid', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null, null);

        // Adding keys to table activities_risk_classifications.
        $table->add_key('primary', XMLDB_KEY_PRIMARY, ['id']);
        $table->add_key('fk_riskid', XMLDB_KEY_FOREIGN, ['riskid'], 'activities_risks', ['id']);
        $table->add_key('fk_classificationid', XMLDB_KEY_FOREIGN, ['classificationid'], 'activities_classifications', ['id']);

        // Adding indexes to table activities_risk_classifications.
        $table->add_index('risk_classification_unique', XMLDB_INDEX_UNIQUE, ['riskid', 'classificationid']);

        // Conditionally launch create table for activities_risk_classifications.
        if (!$dbman->table_exists($table)) {
            $dbman->create_table($table);
        }

        // Activities savepoint reached.
        upgrade_plugin_savepoint(true, 2025072900, 'local', 'activities');
     }

    if ($oldversion < 2025073000) {
        $table = new xmldb_table('activities_classifications');
        $field = new xmldb_field('icon', XMLDB_TYPE_TEXT, null, null, null, null, null, 'name');
        $field2 = new xmldb_field('description', XMLDB_TYPE_TEXT, null, null, null, null, null, 'icon');
        
        if (!$dbman->field_exists($table, $field)) {
            $dbman->add_field($table, $field);
        }   
        if (!$dbman->field_exists($table, $field2)) {
            $dbman->add_field($table, $field2);
        }

        upgrade_plugin_savepoint(true, 2025073000, 'local', 'activities');
    }



    if ($oldversion < 2025080400) {
        // Add version field to activities_risks table
        $table = new xmldb_table('activities_risks');
        $field = new xmldb_field('version', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null, '0', 'isstandard');
        
        if (!$dbman->field_exists($table, $field)) {
            $dbman->add_field($table, $field);
        }
        
        // Add version field to activities_classifications table
        $table = new xmldb_table('activities_classifications');
        $field = new xmldb_field('version', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null, '0', 'sortorder');
        
        if (!$dbman->field_exists($table, $field)) {
            $dbman->add_field($table, $field);
        }
        
        // Add version field to activities_risk_classifications table
        $table = new xmldb_table('activities_risk_classifications');
        $field = new xmldb_field('version', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null, '0', 'classificationid');
        
        if (!$dbman->field_exists($table, $field)) {
            $dbman->add_field($table, $field);
        }
        
        // Create activities_risk_versions table
        $table = new xmldb_table('activities_risk_versions');
        $table->add_field('id', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, XMLDB_SEQUENCE, null);
        $table->add_field('version', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null, null);
        $table->add_field('is_published', XMLDB_TYPE_INTEGER, '1', null, XMLDB_NOTNULL, null, '0');
        $table->add_field('published_by', XMLDB_TYPE_CHAR, '100', null, null, null, null);
        $table->add_field('timepublished', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null, '0');
        $table->add_field('timecreated', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null, '0');
        $table->add_field('description', XMLDB_TYPE_CHAR, '255', null, null, null, null);
        
        $table->add_key('primary', XMLDB_KEY_PRIMARY, array('id'));
        $table->add_index('version_unique', XMLDB_INDEX_UNIQUE, array('version'));
        $table->add_index('published_version', XMLDB_INDEX_UNIQUE, array('is_published'));
        
        if (!$dbman->table_exists($table)) {
            $dbman->create_table($table);
        }
        
        upgrade_plugin_savepoint(true, 2025080400, 'local', 'activities');
    }

    if ($oldversion < 2025081100) {
        $table = new xmldb_table('activities_ra_gens');
        $table->add_field('id', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, XMLDB_SEQUENCE, null);
        $table->add_field('activityid', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null, 0, null, 'id');
        $table->add_field('riskversion', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null, 0, null, 'activityid');
        $table->add_field('classifications', XMLDB_TYPE_TEXT, null, null, XMLDB_NOTNULL, null, null);
        $table->add_field('timecreated', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null, 0, null, 'riskversion');
        $table->add_key('primary', XMLDB_KEY_PRIMARY, ['id']);
        $table->add_key('fk_activityid', XMLDB_KEY_FOREIGN, ['activityid'], 'activities', ['id']);
        if (!$dbman->table_exists($table)) {
            $dbman->create_table($table);
        }

        upgrade_plugin_savepoint(true, 2025081100, 'local', 'activities');
    }

    if ($oldversion < 2025081103) {

        // Add type field to activities_classifications table
        $table = new xmldb_table('activities_classifications');
        $field = new xmldb_field('type', XMLDB_TYPE_CHAR, '100', null, XMLDB_NOTNULL, null, null, 'name');
        if (!$dbman->field_exists($table, $field)) {
            $dbman->add_field($table, $field);
        }

        // Add isstandard field to activities_classifications table
        $field = new xmldb_field('isstandard', XMLDB_TYPE_INTEGER, '1', null, XMLDB_NOTNULL, null, '0', 'sortorder');
        if (!$dbman->field_exists($table, $field)) {
            $dbman->add_field($table, $field);
        }

        // Add contexts field to activities_classifications table
        $field = new xmldb_field('contexts', XMLDB_TYPE_TEXT, null, null, null, null, null, 'isstandard');
        if (!$dbman->field_exists($table, $field)) {
            $dbman->add_field($table, $field);
        }

        upgrade_plugin_savepoint(true, 2025081103, 'local', 'activities');
    }

    if ($oldversion < 2025081104) {
        $table = new xmldb_table('activities_classifications_contexts');
        $table->add_field('id', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, XMLDB_SEQUENCE, null);
        $table->add_field('classificationid', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null, 0, null, 'id');
        $table->add_field('contextid', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null, 0, null, 'classificationid');
        $table->add_field('version', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null, 0, null, 'contextid');
        $table->add_key('primary', XMLDB_KEY_PRIMARY, ['id']);
        $table->add_key('fk_classificationid', XMLDB_KEY_FOREIGN, ['classificationid'], 'activities_classifications', ['id']);
        $table->add_key('fk_contextid', XMLDB_KEY_FOREIGN, ['contextid'], 'activities_classifications', ['id']);
        if (!$dbman->table_exists($table)) {
            $dbman->create_table($table);
        }

        upgrade_plugin_savepoint(true, 2025081104, 'local', 'activities');
    }


    if ($oldversion < 2025082100) {

        // Define table activities_ra_gens_risks to be created.
        $table = new xmldb_table('activities_ra_gens_risks');

        // Adding fields to table activities_ra_gens_risks.
        $table->add_field('id', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, XMLDB_SEQUENCE, null);
        $table->add_field('ra_gen_id', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null, null);
        $table->add_field('hazard', XMLDB_TYPE_TEXT, null, null, XMLDB_NOTNULL, null, null);
        $table->add_field('riskrating_before', XMLDB_TYPE_INTEGER, '3', null, XMLDB_NOTNULL, null, null);
        $table->add_field('controlmeasures', XMLDB_TYPE_TEXT, null, null, XMLDB_NOTNULL, null, null);
        $table->add_field('riskrating_after', XMLDB_TYPE_INTEGER, '3', null, XMLDB_NOTNULL, null, null);
        $table->add_field('responsible_person', XMLDB_TYPE_CHAR, '255', null, XMLDB_NOTNULL, null, null);
        $table->add_field('control_timing', XMLDB_TYPE_CHAR, '255', null, XMLDB_NOTNULL, null, null);
        $table->add_field('risk_benefit', XMLDB_TYPE_TEXT, null, null, null, null, null);

        // Adding keys to table activities_ra_gens_risks.
        $table->add_key('primary', XMLDB_KEY_PRIMARY, ['id']);
        $table->add_key('fk_ra_gen_id', XMLDB_KEY_FOREIGN, ['ra_gen_id'], 'activities_ra_gens', ['id']);

        // Conditionally launch create table for activities_ra_gens_risks.
        if (!$dbman->table_exists($table)) {
            $dbman->create_table($table);
        }

        // Activities savepoint reached.
        upgrade_plugin_savepoint(true, 2025082100, 'local', 'activities');
    }


    return true;
}
