<?php

namespace local_activities\lib;

defined('MOODLE_INTERNAL') || die();

require_once(__DIR__.'/activities.lib.php');
require_once(__DIR__.'/utils.lib.php');
require_once(__DIR__.'/activity.class.php');
require_once(__DIR__.'/workflow.lib.php');
require_once($CFG->libdir.'/filelib.php');

use \local_activities\lib\activities_lib;
use \local_activities\lib\utils_lib;
use \local_activities\lib\Activity;
use \local_activities\lib\workflow_lib;

class generator_lib {

    const BASEURL = '/local/activities/generator.php';


    public static function export_dir(): string {
        global $CFG;
        return str_replace('\\\\', '\\', $CFG->dataroot) . '/local_activities_docs/';
    }

    public static function make($activityid, $document) {
        global $USER, $DB, $CFG, $PAGE;

        $output = $PAGE->get_renderer('core');

        //var_export($exportdir); exit;

        // Check for the export dir before moving forward.
        if (!is_dir(self::export_dir())) {
            if (!mkdir(self::export_dir())) {
                return array('code' => 'failed', 'data' => 'Failed to create export dir: ' . self::export_dir());
            }
        }

        if ($document == 'chargesheet') {
            self::make_chargesheet($activityid);
        } else if ($document == 'export') {
            self::make_export();
        }

        // Nothing left to do.
        die;

    }

    public static function make_chargesheet($activityid) {
        global $USER, $DB, $CFG, $PAGE;

        if ($activityid == 0) {
            echo 'No activity ID provided.';
            exit;
        }

        // Load the activity.
        $activity = new Activity($activityid);
        $activity = $activity->export();

        // Get the students.
        $attending = activities_lib::get_all_attending($activityid);
        //var_export($attending); exit;
        $students = array();
        foreach ($attending as $username) {
            $user = \core_user::get_user_by_username($username);
            // Add the student to the list.
            $row = array(
                'StudentID' => $username,
                'StudentName' => fullname($user),
                'DebtorID' => '',
                'FeeCode' => '',
                'TransactionDate' => date('d/m/Y', $activity->timeend),
                'TransactionAmount' => $activity->cost,
                'TransactionDescription' => $activity->activityname,
            );
            $students[] = $row;
        }

        // Create the csv file.
        $filename = 'activity_chargesheet_' . date('Y-m-d-His', time()) . '_' . $activityid . '.csv';
        $path = self::export_dir() . $filename;

        $fp = fopen($path, 'w');

        // Populate the header fields.
        $header = array(
            'StudentID',
            'StudentName',
            'DebtorID',
            'FeeCode',
            'TransactionDate',
            'TransactionAmount',
            'TransactionDescription',
        );
        fputcsv($fp, $header);

        // Populate the students.
        foreach ($students as $fields) {
            fputcsv($fp, $fields);
        }

        fclose($fp);

        // Send the file with force download, and don't die so that we can perform cleanup.
        send_file($path, $filename, 10, 0, false, true, 'text/csv', true); //Lifetime is 10 to prevent caching.

        // Delete the zip from the exports folder.
        unlink( $path );
    }

    public static function make_export() {
        global $USER, $DB, $CFG, $PAGE;

        // Check if user is a cal reviewer.
        if (!workflow_lib::is_cal_reviewer()) {
            echo 'You are not authorized to export activities.';
            exit;
        }
        
        $sql = "SELECT 
                    a.id,
                    COUNT(s.username) AS student_count,
                    a.activityname,
                    a.activitytype,
                    a.campus,
                    a.timestart,
                    a.timeend,
                    u.firstname,
                    u.lastname,
                    a.location,
                    a.description
                FROM mdl_activities a
                LEFT JOIN mdl_activities_students s ON a.id = s.activityid
                INNER JOIN mdl_user u on u.username = a.staffincharge
                WHERE a.deleted = 0
                AND a.status >= 1
                AND activityname != 'Test'
                GROUP BY 
                    a.id,
                    a.activityname,
                    a.activitytype,
                    a.campus,
                    a.timestart,
                    a.timeend,
                    u.firstname,
                    u.lastname,
                    a.location,
                    a.description
                HAVING COUNT(s.username) >= 0
                ORDER BY a.id ASC
        ";


        $activities = $DB->get_records_sql($sql, array());
        //var_export($activities); exit;
        
        // Create the csv file.
        $filename = 'activities_export_' . date('Y-m-d-His', time()) . '.csv';
        $path = self::export_dir() . $filename;

        $fp = fopen($path, 'w');

        // Populate the header fields.
        $header = array(
            'ID',
            'Student Count',
            'Activity Name',
            'Activity Type',
            'Campus',
            'Start Time',
            'End Time',
            'Staff First Name',
            'Staff Last Name',
            'Location',
            'Description',
        );
        fputcsv($fp, $header);

        // Populate the activities.
        foreach ($activities as $fields) {
            // Format Sun 22 Jan 2023 11:00pm
            $fields->timestart = date('D d M Y h:i A', $fields->timestart);
            $fields->timeend = date('D d M Y h:i A', $fields->timeend);
            fputcsv($fp, (array) $fields);
        }

        fclose($fp);

        // Send the file with force download, and don't die so that we can perform cleanup.
        send_file($path, $filename, 10, 0, false, true, 'text/csv', true); //Lifetime is 10 to prevent caching.

        // Delete the zip from the exports folder.
        unlink( $path );
    }

}