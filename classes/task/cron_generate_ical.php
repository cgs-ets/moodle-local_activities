<?php

/**
 * A scheduled task for generating and caching iCal file for public calendar.
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

class cron_generate_ical extends \core\task\scheduled_task {

    // Use the logging trait to get some nice, juicy, logging.
    use \core\task\logging_trait;

    /**
     * Get a descriptive name for this task (shown to admins).
     *
     * @return string
     */
    public function get_name() {
        return get_string('cron_generate_ical', 'local_activities');
    }

    /**
     * Execute the scheduled task.
     */
    public function execute() {
        global $DB, $CFG;

        $this->log_start("Generating iCal file for public calendar");

        try {
            // Calculate date range: today -1 year to today +1 year
            $now = time();
            $startDate = strtotime('-1 year', $now);
            $endDate = strtotime('+1 year', $now);

            // Format dates for get_for_public_calendar
            $startDateStr = date('Y-m-d', $startDate);
            $endDateStr = date('Y-m-d', $endDate);

            $this->log("Fetching public calendar events from {$startDateStr} to {$endDateStr}");

            // Prepare arguments for get_for_public_calendar
            $args = (object) [
                'scope' => (object) [
                    'start' => $startDateStr,
                    'end' => $endDateStr
                ]
            ];

            // Get all public calendar events
            $activities = activities_lib::get_for_public_calendar($args);

            $this->log("Found " . count($activities) . " public calendar events");

            // Generate iCal content
            $icalContent = $this->generate_ical($activities, $CFG);

            // Store in database
            $existing = $DB->get_record('activities_ical_cache', ['id' => 1]);
            $now = time();

            if ($existing) {
                // Update existing record
                $existing->icalcontent = $icalContent;
                $existing->timemodified = $now;
                $DB->update_record('activities_ical_cache', $existing);
                $this->log("Updated existing iCal cache record");
            } else {
                // Create new record
                $record = new \stdClass();
                $record->id = 1;
                $record->icalcontent = $icalContent;
                $record->timecreated = $now;
                $record->timemodified = $now;
                $DB->insert_record('activities_ical_cache', $record);
                $this->log("Created new iCal cache record");
            }

            $this->log_finish("Successfully generated and cached iCal file");

        } catch (\Exception $e) {
            $this->log("Error generating iCal: " . $e->getMessage(), 1);
            throw $e;
        }
    }

    /**
     * Generate iCal content from activities array.
     *
     * @param array $activities Array of activity objects
     * @param object $CFG Moodle config object
     * @return string iCal content
     */
    private function generate_ical($activities, $CFG) {
        $ical = "BEGIN:VCALENDAR\r\n";
        $ical .= "VERSION:2.0\r\n";
        $ical .= "PRODID:-//CGS Calendar//NONSGML v1.0//EN\r\n";
        $ical .= "CALSCALE:GREGORIAN\r\n";
        $ical .= "METHOD:PUBLISH\r\n";
        $ical .= "X-WR-CALNAME:CGS Calendar\r\n";
        $ical .= "X-WR-CALDESC:Canberra Grammar School Public Calendar\r\n";
        $ical .= "X-WR-TIMEZONE:" . date_default_timezone_get() . "\r\n";

        foreach ($activities as $activity) {
            $ical .= $this->generate_vevent($activity, $CFG);
        }

        $ical .= "END:VCALENDAR\r\n";

        return $ical;
    }

    /**
     * Generate a VEVENT for a single activity.
     *
     * @param object $activity Activity object
     * @param object $CFG Moodle config object
     * @return string VEVENT content
     */
    private function generate_vevent($activity, $CFG) {
        $ical = "BEGIN:VEVENT\r\n";

        // UID - unique identifier for the event
        $uid = 'activity-' . $activity->id;
        if (isset($activity->occurrenceid) && $activity->occurrenceid) {
            $uid .= '-occurrence-' . $activity->occurrenceid;
        }
        $uid .= '@' . parse_url($CFG->wwwroot, PHP_URL_HOST);
        $ical .= "UID:" . $uid . "\r\n";

        // DTSTAMP - timestamp when event was created
        $ical .= "DTSTAMP:" . $this->format_ical_date(time()) . "\r\n";

        // DTSTART - event start time
        $ical .= "DTSTART:" . $this->format_ical_date($activity->timestart) . "\r\n";

        // DTEND - event end time
        $ical .= "DTEND:" . $this->format_ical_date($activity->timeend) . "\r\n";

        // SUMMARY - event title
        $summary = $this->escape_ical_text($activity->activityname);
        $ical .= "SUMMARY:" . $summary . "\r\n";

        // DESCRIPTION - event description
        if (!empty($activity->description)) {
            $description = $this->escape_ical_text($activity->description);
            $ical .= "DESCRIPTION:" . $description . "\r\n";
        }

        // LOCATION - event location
        if (!empty($activity->location)) {
            $location = $this->escape_ical_text($activity->location);
            $ical .= "LOCATION:" . $location . "\r\n";
        }

        // URL - link to event (if available)
        $url = $CFG->wwwroot . '/local/activities/public/index.php';
        $ical .= "URL:" . $url . "\r\n";

        // STATUS - confirmed
        $ical .= "STATUS:CONFIRMED\r\n";

        // SEQUENCE - for tracking updates (using timemodified if available)
        $sequence = isset($activity->timemodified) ? $activity->timemodified : 0;
        $ical .= "SEQUENCE:" . $sequence . "\r\n";

        // LAST-MODIFIED
        if (isset($activity->timemodified)) {
            $ical .= "LAST-MODIFIED:" . $this->format_ical_date($activity->timemodified) . "\r\n";
        }

        $ical .= "END:VEVENT\r\n";

        return $ical;
    }

    /**
     * Format a Unix timestamp as iCal date-time format.
     *
     * @param int $timestamp Unix timestamp
     * @return string iCal formatted date-time
     */
    private function format_ical_date($timestamp) {
        return gmdate('Ymd\THis\Z', $timestamp);
    }

    /**
     * Escape text for iCal format.
     * iCal text should have commas, semicolons, and backslashes escaped.
     *
     * @param string $text Text to escape
     * @return string Escaped text
     */
    private function escape_ical_text($text) {
        // Remove HTML tags
        $text = strip_tags($text);
        // Decode HTML entities
        $text = html_entity_decode($text, ENT_QUOTES, 'UTF-8');
        // Escape special characters
        $text = str_replace('\\', '\\\\', $text);
        $text = str_replace(',', '\\,', $text);
        $text = str_replace(';', '\\;', $text);
        $text = str_replace("\n", '\\n', $text);
        $text = str_replace("\r", '', $text);
        // Fold long lines (max 75 characters per line)
        $text = wordwrap($text, 75, "\r\n ", true);
        return $text;
    }
}
