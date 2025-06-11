<?php

/**
 * Cron task to create absences in Synergetic.
 *
 * @package   local_activities
 * @copyright 2024 Michael Vangelovski
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_activities\task;
defined('MOODLE_INTERNAL') || die();

require_once(__DIR__.'/../lib/activities.lib.php');
require_once(__DIR__.'/../lib/activity.class.php');
use \local_activities\lib\activities_lib;
use \local_activities\lib\activity;


class cron_create_absences extends \core\task\scheduled_task {

    // Use the logging trait to get some nice, juicy, logging.
    use \core\task\logging_trait;

    /**
     * Get a descriptive name for this task (shown to admins).
     *
     * @return string
     */
    public function get_name() {
        return get_string('cron_create_absences', 'local_activities');
    }

    /**
     * Execute the scheduled task.
     */
    public function execute() {
        global $DB;
        // Find activities that need to be synced.
        $now = time();
        $plus14days = strtotime('+14 day', $now);
        $minus7days = strtotime('-7 day', $now);
        $readableplus14days= date('Y-m-d H:i:s', $plus14days);
        $readableminus7days = date('Y-m-d H:i:s', $minus7days);
        // Look ahead 2 weeks to find activities starting, look back 1 week to find activities ended
        $this->log_start("Fetching approved activities starting before {$readableplus14days} and finishing after {$readableminus7days}.");
        $activities = activities_lib::get_for_absences($now, $plus14days, $minus7days);
        try {

            $config = get_config('local_activities');
            if (empty($config->dbhost ?? '') || empty($config->dbuser ?? '') || empty($config->dbpass ?? '') || empty($config->dbname ?? '')) {
                return;
            }
            $externalDB = \moodle_database::get_driver_instance($config->dbtype, 'native', true);
            $externalDB->connect($config->dbhost, $config->dbuser, $config->dbpass, $config->dbname, '');


            foreach ($activities as $activity) {
                $this->log("Creating absences for activity " . $activity->get('id'));
                $activitystart = date('Y-m-d H:i', $activity->get('timestart'));
                $activityend = date('Y-m-d H:i', $activity->get('timeend'));

                // TODO: If activity time has changed since last time absences were synced we need to wipe all absences before starting the process below.
                // 1. Look for an absence record with this activity id.
                // 2. Compare the dates.
                // 3. If necessary, wipe all the absences.

                // Get list of attending students.
                $attending = activities_lib::get_all_attending($activity->get('id'));
                foreach ($attending as $student) {

                    // Sanity check whether absence already exists for student.
                    $sql = $config->checkabsencesql . ' :username, :leavingdate, :returningdate, :comment';
                    $params = array(
                        'username' => $student,
                        'leavingdate' => $activitystart,
                        'returningdate' => $activityend,
                        'comment' => '#ID-' . $activity->get('id'),
                    );
                    $absenceevents = $externalDB->get_field_sql($sql, $params);
                    if ($absenceevents) {
                        $this->log("Student is already absent during this time. Student: {$student}. Leaving date: {$activitystart}. Returning date: {$activityend}.", 2);
                        continue;
                    }

                    // Sanity check if created from old system.
                    if ($activity->get('oldexcursionid')) {
                        $params = array(
                            'username' => $student,
                            'leavingdate' => $activitystart,
                            'returningdate' => $activityend,
                            'comment' => '#ID-' . $activity->get('oldexcursionid'),
                        );
                        $absenceevents = $externalDB->get_field_sql($sql, $params);
                        if ($absenceevents) {
                            $this->log("Student is already absent during this time. Student: {$student}. Leaving date: {$activitystart}. Returning date: {$activityend}.", 2);
                            continue;
                        }
                    }

                    // Insert new absence.
                    $this->log("Creating absence. Student: {$student}. Leaving date: {$activitystart}. Returning date: {$activityend}.", 2);
                    $sql = $config->createabsencesql . ' :username, :leavingdate, :returningdate, :staffincharge, :comment';
                    $params = array(
                        'username' => $student,
                        'leavingdate' => $activitystart,
                        'returningdate' => $activityend,
                        'staffincharge' => $activity->get('staffincharge'),
                        'comment' => $activity->get('activityname') . ' #ID-' . $activity->get('id'),
                    );
                    $externalDB->execute($sql, $params);
                }

                // Delete absences for students no longer attending event.
                $studentscsv = implode(',', $attending);
                $this->log("Delete absences for students not in list: " . $studentscsv, 2);
                $sql = $config->deleteabsencessql . ' :leavingdate, :returningdate, :comment, :studentscsv';
                $params = array(
                    'leavingdate' => $activitystart,
                    'returningdate' => $activityend,
                    'comment' => '#ID-' . $activity->get('id'),
                    'studentscsv' => implode(',', $attending),
                );
                $externalDB->execute($sql, $params);
                //$this->log("Deletion complete", 2);

                // Mark as processed.
                //$this->log("Setting absencesprocess to 1", 2);
                $activity->set('absencesprocessed', 1);
                $activity->save();
                $this->log("Finished creating absences for activity " . $activity->get('id'));
            }


            // Loop through all the activities again searching for any orphaned occurrences in Synergetic….
            foreach ($activities as $activity) {
                $this->log("Checking for orphaned occurrences for activity " . $activity->get('id'));
                $occurrences = $DB->get_records('activities_occurrences', array('activityid' => $activity->get('id')));
                $sql = $config->findabsencessql . ' :activityid';
                $params = array(
                    'activityid' => $activity->get('id'),
                );
                $activityabsences = $externalDB->get_records_sql($sql, $params);

                $datesthatdonotexist = array();
                foreach ($activityabsences as $activityabsence) {
                    // Check if this absence is related to a real occurrence.
                    $start = strtotime($activityabsence->eventdatetime);

                    if (!in_array($start, array_column($occurrences, 'timestart'))) {
                        $this->log("Start date: " . $start . " does not exist in occurrences: " . implode(', ', array_column($occurrences, 'timestart')));
                        $datesthatdonotexist[] = $activityabsence->eventdatetime;
                    }
                }
                if (count($datesthatdonotexist) > 0) {
                    $this->log("Orphaned occurrences found for activity " . $activity->get('id') . ". Dates that don't exist: " . implode(', ', $datesthatdonotexist));
                }
            }


        } catch (Exception $ex) {
            // Error.
        }

        $this->log_finish("Finished creating absences");

    }

}