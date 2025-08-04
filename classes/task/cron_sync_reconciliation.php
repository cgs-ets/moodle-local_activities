<?php

/**
 * A scheduled task for daily full reconciliation between system events and Outlook calendars.
 *
 * @package   local_activities
 * @copyright 2024 Michael Vangelovski
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_activities\task;
defined('MOODLE_INTERNAL') || die();

require_once(__DIR__.'/../lib/graph.lib.php');
require_once(__DIR__.'/../lib/activities.lib.php');
require_once(__DIR__.'/../lib/activity.class.php');
use \local_activities\lib\graph_lib;
use \local_activities\lib\activities_lib;
use \local_activities\lib\activity;

class cron_sync_reconciliation extends \core\task\scheduled_task {

    // Use the logging trait to get some nice, juicy, logging.
    use \core\task\logging_trait;

    // Define the calendars to reconcile
    private $calendars = [
        'cgs_calendar_ss@cgs.act.edu.au',
        'cgs_calendar_ps@cgs.act.edu.au', 
        'cgs_calendar_cm@cgs.act.edu.au',
        'cgs_cal_planning@cgs.act.edu.au'
    ];

    // Date range for reconciliation (1 day past to 60 days future)
    private $startDate;
    private $endDate;

    /**
     * Get a descriptive name for this task (shown to admins).
     *
     * @return string
     */
    public function get_name() {
        return get_string('cron_sync_reconciliation', 'local_activities');
    }

    /**
     * Execute the scheduled task.
     */
    public function execute() {
        global $DB, $CFG;
        $config = get_config('local_activities');

        // For this task, make sure we are in Prod!
        if ($CFG->wwwroot != 'https://connect.cgs.act.edu.au') {
            $this->log("Not in Prod, skipping reconciliation", 1);
            return;
        }

        // Start date shoulwd be midnight of the day before
        $this->startDate = strtotime('yesterday midnight');
        // End date should be midnight of the day after
        $this->endDate = strtotime('tomorrow midnight');

        $this->log_start("Starting daily full reconciliation for date range: " . 
                        date('Y-m-d H:i:s', $this->startDate) . " to " . 
                        date('Y-m-d H:i:s', $this->endDate));

        // Process each calendar
        foreach ($this->calendars as $calendar) {
            $this->log_start("Processing calendar: $calendar");
            $this->reconcile_calendar($calendar);
            $this->log_finish("Finished processing calendar: $calendar");
        }

        $this->log_finish("Daily full reconciliation completed.");
    }

    /**
     * Reconcile a single calendar with system events.
     *
     * @param string $calendar The calendar UPN to reconcile
     */
    private function reconcile_calendar($calendar) {
        global $DB, $CFG;

        try {
            // Get all events from Outlook calendar for the date range
            $this->log("Fetching events from Outlook calendar: $calendar", 2);
            $outlookEvents = $this->get_outlook_events($calendar);
            $this->log("Found " . count($outlookEvents) . " events in Outlook calendar", 2);

            // Get all system events for the date range
            $this->log("Fetching system events for date range", 2);
            $systemEvents = $this->get_system_events($calendar);
            $this->log("Found " . count($systemEvents) . " system events", 2);

            // Create lookup arrays for comparison
            $outlookLookup = $this->create_outlook_lookup($outlookEvents);
            $systemLookup = $this->create_system_lookup($systemEvents);


            // Find events to delete (in Outlook but not in system)
            $this->log("Checking for events to delete from Outlook", 2);
            $eventsToDelete = $this->find_events_to_delete($outlookLookup, $systemLookup);
            $this->log("Found " . count($eventsToDelete) . " events to delete from Outlook", 2);

            $o = [];
            foreach ($eventsToDelete as $outlookEvent) {
                $o[] = array($outlookEvent->getSubject(), $outlookEvent->getStart()->getDateTime(), $outlookEvent->getEnd()->getDateTime());
            }
            echo "DELETE\n";
            var_export($o);

            // Find events to create (in system but not in Outlook)
            $this->log("Checking for events to create in Outlook", 2);
            $eventsToCreate = $this->find_events_to_create($outlookLookup, $systemLookup);
            $this->log("Found " . count($eventsToCreate) . " events to create in Outlook", 2);

            $s = [];
            foreach ($eventsToCreate as $systemEvent) {
                $s[] = array($systemEvent->activityname, date('Y-m-d\TH:i:s', $systemEvent->timestart), date('Y-m-d\TH:i:s', $systemEvent->timeend));
            }
            echo "CREATE\n";
            var_export($s);

            // Find events to update (in both but with mismatched content)
            $this->log("Checking for events to update in Outlook", 2);
            $eventsToUpdate = $this->find_events_to_update($outlookLookup, $systemLookup);
            $this->log("Found " . count($eventsToUpdate) . " events to update in Outlook", 2);


            exit;

            // Execute the reconciliation actions
            $this->delete_events_from_outlook($calendar, $eventsToDelete);
            $this->create_events_in_outlook($calendar, $eventsToCreate);
            $this->update_events_in_outlook($calendar, $eventsToUpdate);

        } catch (\Exception $e) {
            $this->log("Error reconciling calendar $calendar: " . $e->getMessage(), 1);
        }
    }

    /**
     * Get all events from Outlook calendar for the date range.
     *
     * @param string $calendar The calendar UPN
     * @return array Array of Outlook events
     */
    private function get_outlook_events($calendar) {
        try {
            $startDateTime = gmdate("Y-m-d\TH:i:s\Z", $this->startDate);
            $endDateTime = gmdate("Y-m-d\TH:i:s\Z", $this->endDate);
            
            // Use the optimized date range function instead of filtering after fetch
            $events = graph_lib::getEventsByDateRange($calendar, $this->startDate, $this->endDate);
            
            return $events;
        } catch (\Exception $e) {
            $this->log("Error fetching Outlook events: " . $e->getMessage(), 1);
            return [];
        }
    }

    /**
     * Get all system events for the date range that should be in the specified calendar.
     *
     * @param string $calendar The calendar UPN
     * @return array Array of system events
     */
    private function get_system_events($calendar) {
        global $DB;

        $events = [];

        // Get activities (non-recurring)
        $sql = "SELECT *
                FROM {activities}
                WHERE timestart >= ?
                AND timestart <= ?
                AND deleted = 0
                AND (status >= ? OR status = ?)"; // In review or approved
        $params = [$this->startDate, $this->endDate, activities_lib::ACTIVITY_STATUS_INREVIEW, activities_lib::ACTIVITY_STATUS_APPROVED];
        $activities = $DB->get_records_sql($sql, $params);

        foreach ($activities as $activity) {
            $activityObj = new activity($activity->id);
            $exported = $activityObj->export_minimal();
            
            // Check if this activity should be in this calendar
            if ($this->should_be_in_calendar($exported, $calendar)) {
                $events[] = $exported;
            }
        }

        // Get occurrences of recurring activities
        $sql = "SELECT ao.id, ao.timestart, ao.timeend, a.id as activityid
                FROM {activities} a
                JOIN {activities_occurrences} ao ON ao.activityid = a.id
                WHERE ao.timestart >= ?
                AND ao.timestart <= ?
                AND a.deleted = 0
                AND (a.status >= ? OR a.status = ?)";
        $params = [$this->startDate, $this->endDate, activities_lib::ACTIVITY_STATUS_INREVIEW, activities_lib::ACTIVITY_STATUS_APPROVED];
        $occurrences = $DB->get_records_sql($sql, $params);

        foreach ($occurrences as $occurrence) {
            $activity = new activity($occurrence->activityid);
            $exported = $activity->export_minimal();
            $exported->timestart = $occurrence->timestart;
            $exported->timeend = $occurrence->timeend;
            $exported->is_occurrence = true;
            $exported->occurrenceid = $occurrence->id;
            
            if ($this->should_be_in_calendar($exported, $calendar)) {
                $events[] = $exported;
            }
        }

        // Get assessments
        $sql = "SELECT *
                FROM {activities_assessments}
                WHERE timestart >= ?
                AND timestart <= ?
                AND deleted = 0";
        $params = [$this->startDate, $this->endDate];
        $assessments = $DB->get_records_sql($sql, $params);

        foreach ($assessments as $assessment) {
            $event = (object) [
                'id' => $assessment->id,
                'activityname' => $assessment->name,
                'timestart' => $assessment->timestart,
                'timeend' => $assessment->timeend,
                'location' => '',
                'activitytype' => 'assessment',
                'deleted' => $assessment->deleted,
                'displaypublic' => false,
                'pushpublic' => false,
                'categoriesjson' => 'Senior School',
                'areasjson' => '["Assessment"]',
                'colourcategory' => 'Assessment',
                'description' => $assessment->url,
                'isallday' => false,
                'is_occurrence' => false,
                'occurrenceid' => 0,
            ];
            
            if ($this->should_be_in_calendar($event, $calendar)) {
                $events[] = $event;
            }
        }

        return $events;
    }

    /**
     * Check if an event should be in the specified calendar.
     *
     * @param object $event The event object
     * @param string $calendar The calendar UPN
     * @return bool True if event should be in calendar
     */
    private function should_be_in_calendar($event, $calendar) {
        $config = get_config('local_activities');
        
        // If a specific calendar is configured, use that
        if (!empty($config->calendarupn)) {
            return $calendar === $config->calendarupn;
        }

        // Determine calendar based on categories and workflow
        $destinationCalendars = [];
        
        if (strpos($event->categoriesjson, 'External Events') !== false || strpos($event->categoriesjson, 'Campus Management') !== false) {
            $destinationCalendars[] = 'cgs_calendar_cm@cgs.act.edu.au';
        } else {
            if (strpos($event->categoriesjson, 'Primary School') !== false || strpos($event->categoriesjson, 'Whole School') !== false) {
                $destinationCalendars[] = 'cgs_calendar_ps@cgs.act.edu.au';
            }
            if (strpos($event->categoriesjson, 'Senior School') !== false || strpos($event->categoriesjson, 'Whole School') !== false) {
                $destinationCalendars[] = 'cgs_calendar_ss@cgs.act.edu.au';
            }
        }
        
        // If not already in something based on categories above, add it to SS
        if (empty($destinationCalendars)) {
            $destinationCalendars[] = 'cgs_calendar_ss@cgs.act.edu.au';
        }
        
        // Activity always goes into Whole School / Planning calendar
        $destinationCalendars[] = 'cgs_cal_planning@cgs.act.edu.au';
        
        return in_array($calendar, $destinationCalendars);
    }

    /**
     * Create a lookup array for Outlook events.
     *
     * @param array $outlookEvents Array of Outlook events
     * @return array Lookup array keyed by event hash
     */
    private function create_outlook_lookup($outlookEvents) {
        $lookup = [];
        
        foreach ($outlookEvents as $event) {
            $subject = $event->getSubject();
            $start = $this->normalize_outlook_datetime($event->getStart()->getDateTime());
            $end = $this->normalize_outlook_datetime($event->getEnd()->getDateTime());
            
            // Create a hash for comparison
            $hash = $this->create_event_hash($subject, $start, $end);

            if ($subject == "Learner Licence Course") {
                echo "OUTLOOK start and end: " . $start . " - " . $end . "\n";
            }

            $lookup[$hash] = $event;
        }
        
        return $lookup;
    }

    /**
     * Create a lookup array for system events.
     *
     * @param array $systemEvents Array of system events
     * @return array Lookup array keyed by event hash
     */
    private function create_system_lookup($systemEvents) {
        $lookup = [];
        
        foreach ($systemEvents as $event) {
            $subject = $event->activityname;
            $start = date('Y-m-d\TH:i:s', $event->timestart);
            $end = date('Y-m-d\TH:i:s', $event->timeend);
            
            // Create a hash for comparison
            $hash = $this->create_event_hash($subject, $start, $end);
            $lookup[$hash] = $event;

            if ($subject == "Learner Licence Course") {
                echo "SYSTEM start and end: " . $start . " - " . $end . "\n";
            }
        }
        
        return $lookup;
    }

    /**
     * Create a hash for event comparison.
     *
     * @param string $subject Event subject/title
     * @param string $start Start datetime
     * @param string $end End datetime
     * @return string Hash for comparison
     */
    private function create_event_hash($subject, $start, $end) {
        return md5($subject . '|' . $start . '|' . $end);
    }

    /**
     * Normalize Outlook datetime string to match system format.
     *
     * @param string $outlookDatetime Outlook datetime string (e.g., '2025-08-03T00:00:00.0000000')
     * @return string Normalized datetime string (e.g., '2025-08-03T10:00:00')
     */
    private function normalize_outlook_datetime($outlookDatetime) {
        // Remove microseconds if present
        $datetime = preg_replace('/\.\d+$/', '', $outlookDatetime);
        
        // Parse the datetime string as UTC (Outlook sends UTC time)
        $dateTime = new \DateTime($datetime, new \DateTimeZone('UTC'));
        
        // Convert to AUS Eastern Standard Time (same timezone as system)
        $dateTime->setTimezone(new \DateTimeZone('Australia/Sydney'));
        
        // Format to match system format
        return $dateTime->format('Y-m-d\TH:i:s');
    }

    /**
     * Find events that should be deleted from Outlook (in Outlook but not in system).
     *
     * @param array $outlookLookup Outlook events lookup
     * @param array $systemLookup System events lookup
     * @return array Events to delete
     */
    private function find_events_to_delete($outlookLookup, $systemLookup) {
        $toDelete = [];
        
        foreach ($outlookLookup as $hash => $outlookEvent) {
            if (!isset($systemLookup[$hash])) {
                $toDelete[] = $outlookEvent;
            }
        }
        
        return $toDelete;
    }

    /**
     * Find events that should be created in Outlook (in system but not in Outlook).
     *
     * @param array $outlookLookup Outlook events lookup
     * @param array $systemLookup System events lookup
     * @return array Events to create
     */
    private function find_events_to_create($outlookLookup, $systemLookup) {
        $toCreate = [];
        
        foreach ($systemLookup as $hash => $systemEvent) {
            if (!isset($outlookLookup[$hash])) {
                $toCreate[] = $systemEvent;
            }
        }
        
        return $toCreate;
    }

    /**
     * Find events that should be updated in Outlook (in both but with mismatched content).
     *
     * @param array $outlookLookup Outlook events lookup
     * @param array $systemLookup System events lookup
     * @return array Events to update
     */
    private function find_events_to_update($outlookLookup, $systemLookup) {
        $toUpdate = [];
        
        foreach ($systemLookup as $hash => $systemEvent) {
            if (isset($outlookLookup[$hash])) {
                $outlookEvent = $outlookLookup[$hash];
                
                // Check if content is mismatched
                if ($this->events_content_mismatched($outlookEvent, $systemEvent)) {
                    $toUpdate[] = [
                        'outlook' => $outlookEvent,
                        'system' => $systemEvent
                    ];
                }
            }
        }
        
        return $toUpdate;
    }

    /**
     * Check if two events have mismatched content.
     *
     * @param object $outlookEvent Outlook event
     * @param object $systemEvent System event
     * @return bool True if content is mismatched
     */
    private function events_content_mismatched($outlookEvent, $systemEvent) {
        // Compare key fields
        $outlookSubject = $outlookEvent->getSubject();
        $systemSubject = $systemEvent->activityname;
        
        $outlookStart = $this->normalize_outlook_datetime($outlookEvent->getStart()->getDateTime());
        $systemStart = date('Y-m-d\TH:i:s', $systemEvent->timestart);
        
        $outlookEnd = $this->normalize_outlook_datetime($outlookEvent->getEnd()->getDateTime());
        $systemEnd = date('Y-m-d\TH:i:s', $systemEvent->timeend);
        
        $outlookLocation = $outlookEvent->getLocation() ? $outlookEvent->getLocation()->getDisplayName() : '';
        $systemLocation = $systemEvent->location ?? '';
        
        return ($outlookSubject !== $systemSubject ||
                $outlookStart !== $systemStart ||
                $outlookEnd !== $systemEnd ||
                $outlookLocation !== $systemLocation);
    }

    /**
     * Delete events from Outlook calendar.
     *
     * @param string $calendar Calendar UPN
     * @param array $eventsToDelete Events to delete
     */
    private function delete_events_from_outlook($calendar, $eventsToDelete) {
        foreach ($eventsToDelete as $event) {
            try {
                $this->log("Deleting event from Outlook: " . $event->getSubject(), 3);
                $result = graph_lib::deleteEvent($calendar, $event->getId());
                if ($result) {
                    $this->log("Successfully deleted event: " . $event->getSubject(), 3);
                }
            } catch (\Exception $e) {
                $this->log("Failed to delete event " . $event->getSubject() . ": " . $e->getMessage(), 2);
            }
        }
    }

    /**
     * Create events in Outlook calendar.
     *
     * @param string $calendar Calendar UPN
     * @param array $eventsToCreate Events to create
     */
    private function create_events_in_outlook($calendar, $eventsToCreate) {
        global $CFG;
        
        foreach ($eventsToCreate as $event) {
            try {
                $this->log("Creating event in Outlook: " . $event->activityname, 3);
                
                $eventdata = $this->prepare_event_data($event);
                $result = graph_lib::createEvent($calendar, $eventdata);
                
                if ($result) {
                    $this->log("Successfully created event: " . $event->activityname, 3);
                    
                    // Update sync table
                    $this->update_sync_table($event, $calendar, $result);
                }
            } catch (\Exception $e) {
                $this->log("Failed to create event " . $event->activityname . ": " . $e->getMessage(), 2);
            }
        }
    }

    /**
     * Update events in Outlook calendar.
     *
     * @param string $calendar Calendar UPN
     * @param array $eventsToUpdate Events to update
     */
    private function update_events_in_outlook($calendar, $eventsToUpdate) {
        global $CFG;
        
        foreach ($eventsToUpdate as $eventPair) {
            $outlookEvent = $eventPair['outlook'];
            $systemEvent = $eventPair['system'];
            
            try {
                $this->log("Updating event in Outlook: " . $systemEvent->activityname, 3);
                
                $eventdata = $this->prepare_event_data($systemEvent);
                $result = graph_lib::updateEvent($calendar, $outlookEvent->getId(), $eventdata);
                
                if ($result) {
                    $this->log("Successfully updated event: " . $systemEvent->activityname, 3);
                    
                    // Update sync table
                    $this->update_sync_table($systemEvent, $calendar, $result);
                }
            } catch (\Exception $e) {
                $this->log("Failed to update event " . $systemEvent->activityname . ": " . $e->getMessage(), 2);
            }
        }
    }

    /**
     * Prepare event data for Outlook API.
     *
     * @param object $event System event
     * @return object Event data for Outlook
     */
    private function prepare_event_data($event) {
        global $CFG;
        
        $eventdata = new \stdClass();
        $eventdata->subject = $event->activityname;
        $eventdata->body = new \stdClass();
        $eventdata->body->contentType = "HTML";
        $eventdata->body->content = nl2br($event->description ?? '');
        $eventdata->body->content .= '<br><br><br><a href="' . $CFG->wwwroot . '/local/activities/' . $event->id . '">View in CAPMS</a>';
        
        // Add categories if available
        if (!empty($event->areasjson)) {
            $categories = json_decode($event->areasjson);
            if ($categories) {
                $eventdata->categories = $this->prepare_categories($categories, $event);
            }
        }
        
        $eventdata->start = new \stdClass();
        $eventdata->start->dateTime = date('Y-m-d\TH:i:s', $event->timestart);
        $eventdata->start->timeZone = "AUS Eastern Standard Time";
        
        $eventdata->end = new \stdClass();
        $eventdata->end->dateTime = date('Y-m-d\TH:i:s', $event->timeend);
        $eventdata->end->timeZone = "AUS Eastern Standard Time";
        
        $eventdata->location = new \stdClass();
        $eventdata->location->displayName = $event->location ?? '';
        
        $eventdata->isOnlineMeeting = false;
        
        // Set showAs based on approval status
        $approved = $this->is_event_approved($event);
        $multiday = date('Y-m-d', $event->timestart) !== date('Y-m-d', $event->timeend);
        $eventdata->showAs = $approved ? ($multiday ? 'free' : 'busy') : 'tentative';
        
        // Handle all-day events
        if ($event->isallday || 
            (strpos($eventdata->start->dateTime, 'T00:00:00') !== false && strpos($eventdata->end->dateTime, 'T00:00:00') !== false) ||
            (strpos($eventdata->start->dateTime, 'T00:00:00') !== false && strpos($eventdata->end->dateTime, 'T23:59') !== false)) {
            $eventdata->isAllDay = true;
            
            // If the end time is 23:59, adjust it to 00:00:00 of the next day
            if (strpos($eventdata->end->dateTime, 'T23:59') !== false) {
                $endDate = new \DateTime($eventdata->end->dateTime);
                $endDate->modify('+1 day');
                $eventdata->end->dateTime = $endDate->format('Y-m-d\T00:00:00');
            }
        }
        
        return $eventdata;
    }

    /**
     * Check if an event is approved.
     *
     * @param object $event System event
     * @return bool True if approved
     */
    private function is_event_approved($event) {
        if ($event->activitytype === 'assessment') {
            return true; // Assessments are always considered approved
        }
        
        if (isset($event->statushelper)) {
            return $event->statushelper->isapproved;
        }
        
        // Fallback: check status directly
        return isset($event->status) && $event->status >= activities_lib::ACTIVITY_STATUS_APPROVED;
    }

    /**
     * Prepare categories for Outlook event.
     *
     * @param array $categories Original categories
     * @param object $event System event
     * @return array Processed categories
     */
    private function prepare_categories($categories, $event) {
        // Add public categories if needed
        if ($event->displaypublic && $this->is_event_approved($event)) {
            $categories = $this->make_public_categories($categories);
        }
        
        // Sort for colouring category
        if (!empty($event->colourcategory)) {
            $colourcat = explode('/', $event->colourcategory);
            $colourcat = end($colourcat);
            $categories = $this->sort_for_colouring_category($colourcat, $categories);
        }
        
        return $categories;
    }

    /**
     * Update the sync table with new event information.
     *
     * @param object $event System event
     * @param string $calendar Calendar UPN
     * @param object $result Outlook API result
     */
    private function update_sync_table($event, $calendar, $result) {
        global $DB;
        
        $record = new \stdClass();
        $record->activityid = $event->id;
        $record->calendar = $calendar;
        $record->timesynced = time();
        $record->externalid = $result->getId();
        $record->changekey = $result->getChangeKey();
        $record->weblink = $result->getWebLink();
        $record->status = 1; // Success
        $record->activitytype = $event->activitytype === 'assessment' ? 'assessment' : 'activity';
        $record->occurrenceid = $event->is_occurrence ? $event->occurrenceid : 0;
        
        // Check if record already exists
        $existing = $DB->get_record('activities_cal_sync', [
            'activityid' => $event->id,
            'calendar' => $calendar,
            'activitytype' => $record->activitytype,
            'occurrenceid' => $record->occurrenceid
        ]);
        
        if ($existing) {
            $record->id = $existing->id;
            $DB->update_record('activities_cal_sync', $record);
        } else {
            $DB->insert_record('activities_cal_sync', $record);
        }
    }

    /**
     * Make categories public if needed.
     *
     * @param array $categories Original categories
     * @return array Categories with public versions
     */
    private function make_public_categories($categories) {
        if (in_array("CGS Board", $categories)) {
            return $categories;
        }
        
        // Some categories need 'public' appended
        $publiccats = ['Primary School', 'Senior School', 'Whole School', 'ELC', 'Red Hill', 'Northside', 'Website', 'Alumni'];
        $categories = array_map(function($cat) use ($publiccats) {
            if (in_array($cat, $publiccats)) {
                return [$cat, $cat . ' Public'];
            }
            return [$cat];
        }, $categories);
        
        $categories = call_user_func_array('array_merge', $categories);
        $categories = array_values(array_unique($categories));
        
        return $categories;
    }

    /**
     * Sort categories for colouring.
     *
     * @param string $colourcategory The colouring category
     * @param array $categories Categories array
     * @return array Sorted categories
     */
    private function sort_for_colouring_category($colourcategory, $categories) {
        // Make sure colouring category is first
        if (in_array($colourcategory, $categories)) {
            $colouringix = array_search($colourcategory, $categories);
            $movecat = $categories[$colouringix];
            unset($categories[$colouringix]);
            array_unshift($categories, $movecat);
        }
        
        return $categories;
    }

    /**
     * Check if the task can run.
     *
     * @return bool True if task can run
     */
    public function can_run(): bool {
        return true;
    }
}
