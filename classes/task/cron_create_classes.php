<?php

/**
 * A scheduled task for creating and updating classes for rollmarking.
 *
 * Uses a BUILD → UPSERT → CLEANUP pipeline so classes always exist during processing.
 * No DELETE → CREATE race conditions. No exit statements.
 *
 * @package   local_activities
 * @copyright 2024 Michael Vangelovski
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_activities\task;
defined('MOODLE_INTERNAL') || die();

require_once(__DIR__.'/../lib/activities.lib.php');
require_once(__DIR__.'/../lib/activity.class.php');
require_once(__DIR__.'/../lib/assessments.lib.php');
use \local_activities\lib\activities_lib;
use \local_activities\lib\activity;
use \local_activities\lib\assessments_lib;

class cron_create_classes extends \core\task\scheduled_task {

    use \core\task\logging_trait;

    /** @var string Class code prefix. */
    protected $prefix = 'XT';

    /** @var object The current term info. */
    protected $currentterminfo = null;

    /** @var \moodle_database The external database. */
    protected $externalDB = null;

    /** @var object Configuration object. */
    protected $config = null;

    public function get_name() {
        return get_string('cron_create_classes', 'local_activities') . ' (v3 sync)';
    }

    public function execute() {
        global $DB, $CFG;

        $now = time() - 3600;
        $plusdays = strtotime('+2 day', $now);
        $readablenow = date('Y-m-d H:i:s', $now);
        $readableplusdays = date('Y-m-d H:i:s', $plusdays);
        $this->log_start("Syncing classes for rollmarking (between {$readablenow} and {$readableplusdays}).");

        try {
            $this->config = get_config('local_activities');
            if (empty($this->config->dbhost ?? '') || empty($this->config->dbuser ?? '') || empty($this->config->dbpass ?? '') || empty($this->config->dbname ?? '')) {
                $this->log("No config found for local_activities");
                return;
            }
            $this->externalDB = \moodle_database::get_driver_instance($this->config->dbtype, 'native', true);
            $this->externalDB->connect($this->config->dbhost, $this->config->dbuser, $this->config->dbpass, $this->config->dbname, '');

            $currentterminfo = $this->externalDB->get_records_sql($this->config->getterminfosql);
            $this->currentterminfo = array_pop($currentterminfo);

            if ($CFG->wwwroot != 'https://connect.cgs.act.edu.au') {
                $this->prefix = 'XUAT_';
            }

            // Phase 1: Build expected classes (pure data collection, no external DB writes).
            $expectedClasses = $this->build_expected_classes($now, $plusdays);
            $this->log("Built " . count($expectedClasses) . " expected class definitions.");

            // Phase 2: Sync (upsert) all expected classes to external DB.
            $synced = $this->sync_classes($expectedClasses);

            // Phase 3: Cleanup obsolete classes.
            $this->cleanup_obsolete_classes($expectedClasses);

            // Bulk update classrollprocessed = 1 for synced IDs.
            if (!empty($synced['activities'])) {
                $activityids = array_unique($synced['activities']);
                foreach ($activityids as $aid) {
                    $DB->execute("UPDATE {activities} SET classrollprocessed = 1 WHERE id = ?", [$aid]);
                }
                $this->log("Marked " . count($activityids) . " activities as classrollprocessed.");
            }
            if (!empty($synced['assessments'])) {
                $assessmentids = array_unique($synced['assessments']);
                foreach ($assessmentids as $aid) {
                    $DB->execute("UPDATE {activities_assessments} SET classrollprocessed = 1 WHERE id = ?", [$aid]);
                }
                $this->log("Marked " . count($assessmentids) . " assessments as classrollprocessed.");
            }

        } catch (\Exception $ex) {
            $this->log("Error in cron_create_classes: " . $ex->getMessage());
        }

        $this->log_finish("Finished syncing class rolls");
    }

    /**
     * Phase 1: Build all expected class definitions from activities and assessments.
     * Pure data collection — no external DB writes.
     *
     * @param int $now Current timestamp
     * @param int $plusdays Timestamp for 7 days from now
     * @return array Array of class definition objects
     */
    private function build_expected_classes($now, $plusdays) {
        global $DB;

        $classes = [];

        // --- Activities ---
        $sql = "SELECT a.id, a.timestart, a.timeend, a.timemodified, a.classrollprocessed
                FROM mdl_activities a
                WHERE deleted = 0
                AND (
                    (
                        (timestart <= {$plusdays} AND timestart >= {$now}) OR
                        (timestart <= {$now} AND timeend >= {$now})
                    )
                    OR EXISTS (
                        SELECT 1
                        FROM mdl_activities_occurrences o
                        WHERE o.activityid = a.id AND (
                            (timestart <= {$plusdays} AND timestart >= {$now}) OR
                            (timestart <= {$now} AND timeend >= {$now})
                        )
                    )
                )";
        $activityrecords = $DB->get_records_sql($sql);
        $this->log("Found " . count($activityrecords) . " activities in time window.");

        foreach ($activityrecords as $record) {
            try {
                $activity = new Activity($record->id, true);
                $activitydata = $activity->export();

                $attending = activities_lib::get_all_attending($activitydata->id);
                if (empty($attending)) {
                    $this->log("Activity {$activitydata->id} ({$activitydata->activityname}) has no students, skipping.");
                    continue;
                }

                $extrastaff = $DB->get_records('activities_staff', array('activityid' => $activitydata->id));
                $extrastaffusernames = array_values(array_map(function($e) { return $e->username; }, $extrastaff));

                // Build class defs for the primary occurrence.
                $primaryClasses = $this->build_class_defs_for_timerange(
                    'activity',
                    $activitydata->id,
                    $activitydata->activityname,
                    $activitydata->staffincharge,
                    $activitydata->campus,
                    $activitydata->timestart,
                    $activitydata->timeend,
                    array_values($attending),
                    $extrastaffusernames
                );
                $classes = array_merge($classes, $primaryClasses);

                // Build class defs for recurrences.
                if (isset($activitydata->occurrences) && !empty($activitydata->occurrences->dates)) {
                    foreach ($activitydata->occurrences->dates as $occurrence) {
                        if ($activitydata->timestart == $occurrence['start']) {
                            continue; // Skip first occurrence (already processed above).
                        }
                        $recurrenceClasses = $this->build_class_defs_for_timerange(
                            'activity',
                            $activitydata->id,
                            $activitydata->activityname,
                            $activitydata->staffincharge,
                            $activitydata->campus,
                            $occurrence['start'],
                            $occurrence['end'],
                            array_values($attending),
                            $extrastaffusernames
                        );
                        $classes = array_merge($classes, $recurrenceClasses);
                    }
                }
            } catch (\Exception $ex) {
                $this->log("Error building classes for activity {$record->id}: " . $ex->getMessage());
            }
        }

        // --- Assessments ---
        $sql = "SELECT id, timestart, timeend, timemodified, classrollprocessed
                FROM {activities_assessments}
                WHERE deleted = 0
                AND (
                    (timestart <= {$plusdays} AND timestart >= {$now}) OR
                    (timestart <= {$now} AND timeend >= {$now})
                )";
        $assessmentrecords = $DB->get_records_sql($sql);
        $this->log("Found " . count($assessmentrecords) . " assessments in time window.");

        foreach ($assessmentrecords as $record) {
            try {
                $assessment = $DB->get_record('activities_assessments', ['id' => $record->id]);
                if (!$assessment) {
                    continue;
                }

                $rawattending = assessments_lib::get_assessment_students($assessment->id);
                $attending = array_values(array_column($rawattending, 'un'));
                if (empty($attending)) {
                    $this->log("Assessment {$assessment->id} ({$assessment->name}) has no students, skipping.");
                    continue;
                }

                $staffid = !empty($assessment->staffincharge) ? $assessment->staffincharge : $assessment->creator;

                $assessmentClasses = $this->build_class_defs_for_timerange(
                    'assessment',
                    $assessment->id,
                    $assessment->name,
                    $staffid,
                    'senior',
                    $assessment->timestart,
                    $assessment->timeend,
                    $attending,
                    []
                );
                $classes = array_merge($classes, $assessmentClasses);
            } catch (\Exception $ex) {
                $this->log("Error building classes for assessment {$record->id}: " . $ex->getMessage());
            }
        }

        return $classes;
    }

    /**
     * Build class definition objects for a given time range (splits multi-day events).
     *
     * @param string $sourcetype 'activity' or 'assessment'
     * @param int $sourceid Activity or assessment ID
     * @param string $description Activity/assessment name
     * @param string $staffid Staff in charge username
     * @param string $campus Campus name
     * @param int $timestart Start timestamp
     * @param int $timeend End timestamp
     * @param array $students Array of student usernames
     * @param array $extrastaff Array of extra staff usernames
     * @return array Array of class definition objects
     */
    private function build_class_defs_for_timerange($sourcetype, $sourceid, $description, $staffid, $campus, $timestart, $timeend, $students, $extrastaff) {
        $start = date('Y-m-d H:i', $timestart);
        $end = date('Y-m-d H:i', $timeend);
        $days = $this->split_into_days($start, $end);
        $defs = [];

        foreach ($days as $day) {
            $daystart = $day['start'];
            $dayend = $day['end'];

            $startDateTime = new \DateTime($daystart);
            $monthDay = $startDateTime->format('md');
            $classcode = $this->prefix . $sourceid . '_' . $monthDay;

            // Clamp start hour to 6-18.
            $starthour = (int)date('H', strtotime($daystart));
            if ($starthour < 6) {
                $daystart = date('Y-m-d 06:i', strtotime($daystart));
            }
            if ($starthour > 18) {
                $daystart = date('Y-m-d 18:i', strtotime($daystart));
            }

            $defs[] = (object)[
                'source_type' => $sourcetype,
                'source_id'   => $sourceid,
                'classcode'   => $classcode,
                'description' => $description,
                'staffid'     => $staffid,
                'campus'      => $campus == 'senior' ? 'SEN' : 'PRI',
                'daystart'    => $daystart,
                'dayend'      => $dayend,
                'students'    => $students,
                'extrastaff'  => $extrastaff,
            ];
        }

        return $defs;
    }

    /**
     * Phase 2: Sync (upsert) all expected classes to the external database.
     *
     * @param array $expectedClasses Array of class definition objects
     * @return array ['activities' => [...ids], 'assessments' => [...ids]]
     */
    private function sync_classes($expectedClasses) {
        $synced = ['activities' => [], 'assessments' => []];

        foreach ($expectedClasses as $classDef) {
            if ($classDef->source_id != 12439) {
                continue;
            }
            try {
                $this->log("Syncing class {$classDef->classcode} for {$classDef->source_type} {$classDef->source_id}, staff: {$classDef->staffid}, start: {$classDef->daystart}", 2);

                $sql = $this->config->createclasssql . ' :fileyear, :filesemester, :classcampus, :classcode, :description, :staffid, :leavingdate, :returningdate, :students';
                $params = array(
                    'fileyear' => $this->currentterminfo->fileyear,
                    'filesemester' => $this->currentterminfo->filesemester,
                    'classcampus' => $classDef->campus,
                    'classcode' => $classDef->classcode,
                    'description' => $classDef->description,
                    'staffid' => $classDef->staffid,
                    'leavingdate' => $classDef->daystart,
                    'returningdate' => $classDef->dayend,
                    'students' => json_encode(array_values($classDef->students)),
                );

                $seqnums = $this->externalDB->get_record_sql($sql, $params);
                $this->log("Sequence nums (staffscheduleseq, subjectclassesseq): " . json_encode($seqnums), 2);

                if (empty($seqnums) || empty($seqnums->staffscheduleseq) || empty($seqnums->subjectclassesseq)) {
                    $this->log("No sequence nums for {$classDef->source_type} {$classDef->source_id} class {$classDef->classcode}, skipping.", 2);
                    continue;
                }

                // Insert extra staff (activities only).
                /*if ($classDef->source_type == 'activity' && !empty($classDef->extrastaff)) {
                    foreach ($classDef->extrastaff as $staffusername) {
                        try {
                            $this->log("Inserting extra class teacher: {$staffusername} for {$classDef->classcode}", 2);
                            $sql = $this->config->insertclassstaffsql . ' :fileyear, :filesemester, :classcampus, :classcode, :staffid';
                            $params = array(
                                'fileyear' => $this->currentterminfo->fileyear,
                                'filesemester' => $this->currentterminfo->filesemester,
                                'classcampus' => $classDef->campus,
                                'classcode' => $classDef->classcode,
                                'staffid' => $staffusername,
                            );
                            $this->externalDB->execute($sql, $params);
                        } catch (\Exception $ex) {
                            $this->log("Error inserting extra staff {$staffusername} for {$classDef->classcode}: " . $ex->getMessage());
                        }
                    }
                }*/

                // Track successful sync.
                $key = $classDef->source_type == 'activity' ? 'activities' : 'assessments';
                $synced[$key][] = $classDef->source_id;

            } catch (\Exception $ex) {
                $this->log("Error syncing class {$classDef->classcode} for {$classDef->source_type} {$classDef->source_id}: " . $ex->getMessage());
            }
        }

        $this->log("Synced " . count(array_unique($synced['activities'])) . " activities, " . count(array_unique($synced['assessments'])) . " assessments.");
        return $synced;
    }

    /**
     * Phase 3: Cleanup obsolete classes that are no longer expected.
     *
     * @param array $expectedClasses Array of class definition objects
     * @param int $now Start of the scanned time window (unix timestamp)
     * @param int $plusdays End of the scanned time window (unix timestamp)
     */
    private function cleanup_obsolete_classes($expectedClasses, $now, $plusdays) {
        if (empty($this->config->cleanupclassessql)) {
            $this->log("No cleanupclassessql configured, skipping cleanup.");
            return;
        }

        $validCodes = array_values(array_unique(array_map(function($c) { return $c->classcode; }, $expectedClasses)));

        $this->log("Cleaning up obsolete classes. Valid class codes: " . count($validCodes));

        try {
            $sql = $this->config->cleanupclassessql . ' :fileyear, :filesemester, :validclasscodes, :datefrom, :dateto';
            $params = array(
                'fileyear' => $this->currentterminfo->fileyear,
                'filesemester' => $this->currentterminfo->filesemester,
                'validclasscodes' => json_encode($validCodes),
                'datefrom' => date('Y-m-d H:i:s', $now),
                'dateto' => date('Y-m-d H:i:s', $plusdays),
            );
            $this->externalDB->execute($sql, $params);
            $this->log("Cleanup complete.");
        } catch (\Exception $ex) {
            $this->log("Error during cleanup: " . $ex->getMessage());
        }
    }

    /**
     * Split a date range into individual days.
     *
     * @param string $start Start date/time (Y-m-d H:i)
     * @param string $end End date/time (Y-m-d H:i)
     * @return array Array of day arrays with 'start' and 'end' keys
     */
    private function split_into_days($start, $end) {
        $startDateTime = new \DateTime($start);
        $endDateTime = new \DateTime($end);
        $result = [];

        if ($startDateTime->format('Y-m-d') === $endDateTime->format('Y-m-d')) {
            $result[] = [
                "start" => $startDateTime->format('Y-m-d H:i'),
                "end" => $endDateTime->format('Y-m-d H:i')
            ];
        } else {
            $currentDate = clone $startDateTime;

            while ($currentDate <= $endDateTime) {
                if ($currentDate->format('Y-m-d') == $startDateTime->format('Y-m-d')) {
                    $result[] = [
                        "start" => $startDateTime->format('Y-m-d H:i'),
                        "end" => $startDateTime->format('Y-m-d') . ' 23:59'
                    ];
                } else if ($currentDate->format('Y-m-d') == $endDateTime->format('Y-m-d')) {
                    $result[] = [
                        "start" => $endDateTime->format('Y-m-d') . ' 00:00',
                        "end" => $endDateTime->format('Y-m-d H:i')
                    ];
                } else {
                    $result[] = [
                        "start" => $currentDate->format('Y-m-d') . ' 00:00',
                        "end" => $currentDate->format('Y-m-d') . ' 23:59'
                    ];
                }

                $currentDate->modify('+1 day');
            }
        }

        return $result;
    }
}
