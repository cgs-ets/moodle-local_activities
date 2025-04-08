<?php

/**
 * A scheduled task for sending emails.
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

class cron_sync_events extends \core\task\scheduled_task {

    // Use the logging trait to get some nice, juicy, logging.
    use \core\task\logging_trait;

    /**
     * Get a descriptive name for this task (shown to admins).
     *
     * @return string
     */
    public function get_name() {
        return get_string('cron_sync_live', 'local_activities');
    }

    /**
     * Execute the scheduled task.
     */
    public function execute() {
        global $DB;
        $config = get_config('local_activities');

        // Get events that have been changed since last sync.
        $this->log_start("Looking for events that require sync (modified after last sync).");
        $sql = "SELECT *
                FROM {activities}
                WHERE timesynclive < timemodified"; 
        $events = $DB->get_records_sql($sql);

        $this->log_start("Looking for assessments that require sync (modified after last sync).");
        $sql = "SELECT *
                FROM {activities_assessments}
                WHERE timesynclive < timemodified"; 
        $rawassessments = $DB->get_records_sql($sql);

        // Loop through assessments and structure them like events.
        $assessments = [];
        foreach ($rawassessments as $assessment) {
            $assessments[] = (object) [
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
            ];
        }

        // Merge events and assessments.
        $all = array_merge($events, $assessments);
        
        foreach ($all as $event) {

            
            if ($event->id != 9344) {
                continue;
            }


            $sdt = date('Y-m-d H:i', $event->timestart);
            $this->log("Processing $event->activitytype $event->id: '$event->activityname', starting '$sdt'");
            $error = false;

            $approved = true;
            $inreview = false;
            $isActivity = false;
            if ($event->activitytype !== 'assessment') {
                $activity = new activity($event->id);
                $status = activities_lib::status_helper($activity->get('status'));
                $approved = $status->isapproved;
                $inreview = $status->inreview;
                $isActivity = activities_lib::is_activity($event->activitytype);
            }

            // Skip the event if it is deleted or not either approved or in review.
            $skipEvent = false;
            if ($event->deleted) {
                $skipEvent = true;
            }
            if (!($inreview || $approved)) {
                $skipEvent = true;
            }
            if ($skipEvent) {
                $this->log("Activity is deleted or needs to be skipped due to status.", 2);
            }



            // Determine which calendar this activity needs to feed into.
            $destinationCalendars = array();
            if (!empty($config->calendarupn)) {
                $destinationCalendars = array($config->calendarupn);
            } else {
                if ($skipEvent) {
                    // Do not add this event to any destination calendars as it needs to be deleted / skipped.
                } else {
                    // Determine which calendars this event needs to go to based on workflow AND category selection.
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
                    $destinationCalendars = array_unique($destinationCalendars);
                    $destinationCalendars = array_filter($destinationCalendars);
                    // If not already in something based on cats above, add it to SS.
                    if (empty($destinationCalendars)) {
                        $destinationCalendars[] = 'cgs_calendar_ss@cgs.act.edu.au';
                    }
                    // Activity always goes into Whole School / Planning calendar.
                    $destinationCalendars[] = 'cgs_cal_planning@cgs.act.edu.au';
                    $this->log("Event has the categories: " . $event->categoriesjson . ". Event will sync to: " . implode(', ', $destinationCalendars), 2);
                }
            }



            // Get existing sync entries.
            $sql = "SELECT *
                FROM {activities_cal_sync}
                WHERE activityid = ?";
            $externalevents = $DB->get_records_sql($sql, [$event->id]);



            // Update existing entries.
            foreach($externalevents as $externalevent) {
                $calIx = array_search($externalevent->calendar, $destinationCalendars);

                $deleteExternal = false;
                if ($calIx === false) {
                    // existing event is not in the list of calendars it should belong in.
                    $deleteExternal = true;
                }

                if ($skipEvent || $deleteExternal) {
                    // The event was deleted, or entry not in a valid destination calendar, delete it from the outlook calendar.
                    try {
                        $this->log("Deleting existing entry in calendar $externalevent->calendar", 2);
                        $result = graph_lib::deleteEvent($externalevent->calendar, $externalevent->externalid);
                    } catch (\Exception $e) {
                        $this->log("Failed to delete event in calendar $externalevent->calendar: " . $e->getMessage(), 3);
                    }
                    $this->log("Removing event $externalevent->eventid from sync table", 3);
                    $DB->delete_records('activities_cal_sync', array('id' => $externalevent->id));
                } else {
                    $destCal = $destinationCalendars[$calIx];
                    // Entry in a valid destination calendar, update entry.
                    $this->log("Updating existing entry in calendar $destCal", 2);
                    $categories = json_decode($event->areasjson);

                    // If entry appears in ps and ss calendars, public will only be added to SS cal for approved events.
                    if (in_array('cgs_calendar_ss@cgs.act.edu.au', $destinationCalendars) && in_array('cgs_calendar_ps@cgs.act.edu.au', $destinationCalendars)) {
                        if ($destCal == 'cgs_calendar_ss@cgs.act.edu.au' && $event->displaypublic && ($approved || $event->pushpublic)) {
                            $categories = $this->make_public_categories($categories);
                        }
                    } else {
                        if ($event->displaypublic && ($approved || $event->pushpublic)) {
                            $categories = $this->make_public_categories($categories);
                        }
                    }

                    // Colouring category.
                    $colourcat = explode('/', $event->colourcategory);
                    $colourcat = end($colourcat);
                    $categories = $this->sort_for_colouring_category($colourcat, $categories);

                    // Update calendar event
                    $eventdata = new \stdClass();
                    $eventdata->subject = $event->activityname;
                    $eventdata->body = new \stdClass();
                    $eventdata->body->contentType = "HTML";
                    $eventdata->body->content = nl2br($event->description);
                    if (!empty($categories)) {
                        $eventdata->categories = $categories;
                    }
                    $eventdata->start = new \stdClass();
                    $eventdata->start->dateTime = date('Y-m-d\TH:i:s', $event->timestart); 
                    $eventdata->start->timeZone = "AUS Eastern Standard Time";
                    $eventdata->end = new \stdClass();
                    $eventdata->end->dateTime = date('Y-m-d\TH:i:s', $event->timeend);
                    $eventdata->end->timeZone = "AUS Eastern Standard Time";
                    $eventdata->location = new \stdClass();
                    $eventdata->location->displayName = $event->location;
                    $multiday = date('Y-m-d', $event->timestart) !== date('Y-m-d', $event->timeend);
                    $eventdata->showAs = $approved ? ($multiday ? 'free': 'busy') : 'tentative';
                    if ($event->isallday ||
                        (strpos($eventdata->start->dateTime, 'T00:00:00') !== false && strpos($eventdata->end->dateTime, 'T00:00:00') !== false) ||
                        (strpos($eventdata->start->dateTime, 'T00:00:00') !== false && strpos($eventdata->end->dateTime, 'T23:59:59') !== false)
                    ) {
                        $eventdata->isAllDay = true;
                        // If the end time is 23:59:59, adjust it to 00:00:00 of the next day.
                        if (strpos($eventdata->end->dateTime, 'T23:59:59') !== false) {
                            $endDate = new \DateTime($eventdata->end->dateTime);
                            $endDate->modify('+1 day');
                            $eventdata->end->dateTime = $endDate->format('Y-m-d\T00:00:00');
                        }
                    }
                    try {
                        $result = graph_lib::updateEvent($destCal, $externalevent->externalid, $eventdata);
                        unset($destinationCalendars[$calIx]);
                    } catch (\Exception $e) {
                        $this->log("Failed to update event in calendar $externalevent->calendar: " . $e->getMessage(), 3);
                        $this->log("Cleaning event $externalevent->eventid from sync table", 3);
                        $DB->delete_records('activities_cal_sync', array('id' => $externalevent->id));
                        $error = true;
                    }
                }
            }

            if ($skipEvent) {
                // Event should not be added to any cal.
            } else {
                // Create entries in remaining calendars. There won't be any dest cals if the event was deleted.
                foreach($destinationCalendars as $destCal) {
                    $this->log("Creating new entry in calendar $destCal", 2);
                    $categories = json_decode($event->areasjson);

                    // Public categories.
                    // If entry appears in ps and ss calendars, public will only be added to SS cal for approved events.
                    if (in_array('cgs_calendar_ss@cgs.act.edu.au', $destinationCalendars) && in_array('cgs_calendar_ps@cgs.act.edu.au', $destinationCalendars)) {
                        if ($destCal == 'cgs_calendar_ss@cgs.act.edu.au' && $event->displaypublic && ($approved || $event->pushpublic)) {
                            $categories = $this->make_public_categories($categories);
                        }
                    } else {
                        if ($event->displaypublic && ($approved || $event->pushpublic)) {
                            $categories = $this->make_public_categories($categories);
                        }
                    }

                    // Colouring category.
                    $colourcat = explode('/', $event->colourcategory);
                    $colourcat = end($colourcat);
                    $categories = $this->sort_for_colouring_category($colourcat, $categories);

                    // Create calendar event
                    $eventdata = new \stdClass();
                    $eventdata->subject = $event->activityname;
                    $eventdata->body = new \stdClass();
                    $eventdata->body->contentType = "HTML";
                    $eventdata->body->content = nl2br($event->description);
                    if (!empty($categories)) {
                        $eventdata->categories = $categories;
                    }
                    $eventdata->start = new \stdClass();
                    $eventdata->start->dateTime = date('Y-m-d\TH:i:s', $event->timestart); 
                    $eventdata->start->timeZone = "AUS Eastern Standard Time";
                    $eventdata->end = new \stdClass();
                    $eventdata->end->dateTime = date('Y-m-d\TH:i:s', $event->timeend);
                    $eventdata->end->timeZone = "AUS Eastern Standard Time";
                    $eventdata->location = new \stdClass();
                    $eventdata->location->displayName = $event->location;
                    $eventdata->isOnlineMeeting = false;
                    $multiday = date('Y-m-d', $event->timestart) !== date('Y-m-d', $event->timeend);
                    $eventdata->showAs = $approved ? ($multiday ? 'free': 'busy') : 'tentative';
                                        
                    if ($event->isallday ||
                        (strpos($eventdata->start->dateTime, 'T00:00:00') !== false && strpos($eventdata->end->dateTime, 'T00:00:00') !== false) ||
                        (strpos($eventdata->start->dateTime, 'T00:00:00') !== false && strpos($eventdata->end->dateTime, 'T23:59:59') !== false)
                    ) {
                        $eventdata->isAllDay = true;
                        // If the end time is 23:59:59, adjust it to 00:00:00 of the next day.
                        if (strpos($eventdata->end->dateTime, 'T23:59:59') !== false) {
                            $endDate = new \DateTime($eventdata->end->dateTime);
                            $endDate->modify('+1 day');
                            $eventdata->end->dateTime = $endDate->format('Y-m-d\T00:00:00');
                        }
                    }
                    $record = new \stdClass();
                    $record->activityid = $event->id;
                    $record->calendar = $destCal;
                    $record->timesynclive = time();
                    $record->externalid = '';
                    $record->changekey = '';
                    $record->weblink = '';
                    $record->status = 0;
                    try {
                        $result = graph_lib::createEvent($destCal, $eventdata);
                        if ($result) {
                            $record->externalid = $result->getId();
                            $record->changekey = $result->getChangeKey();
                            $record->weblink = $result->getWebLink();
                            $record->status = 1;
                        }
                    } catch (\Exception $e) {
                        $this->log("Failed to insert event into calendar $externalevent->calendar: " . $e->getMessage(), 3);
                        $this->log(json_encode($eventdata), 3);
                        $error = true;
                    }
                    $id = $DB->insert_record('activities_cal_sync', $record);
                }
            }

            $event->timesynclive = time();
            if ($error) {
                $event->timesynclive = -1;
            }
            if ($event->activitytype == 'assessment') {
                $DB->execute('UPDATE {activities_assessments} SET timesynclive = ? WHERE id = ?', [$event->timesynclive, $event->id]);
            } else {
                $DB->execute('UPDATE {activities} SET timesynclive = ? WHERE id = ?', [$event->timesynclive, $event->id]);
            }

        }
        $this->log_finish("Finished syncing events.");  
    }

    private function make_public_categories($categories) {
        if (in_array("CGS Board", $categories)) {
            return $categories;
        }
        // Some categories need 'public' appended.
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

    private function sort_for_colouring_category($colourcategory, $categories) {
        // Make sure colouring category is first.
        if (in_array($colourcategory, $categories)) {
            $colouringix = array_search($colourcategory, $categories);
            $movecat = $categories[$colouringix];
            unset($categories[$colouringix]);
            array_unshift($categories, $movecat);
        }
        return $categories;
    }
    
    public function can_run(): bool {
        return true;
    }

}
