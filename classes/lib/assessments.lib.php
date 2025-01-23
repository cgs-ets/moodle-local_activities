<?php

namespace local_activities\lib;

defined('MOODLE_INTERNAL') || die();

require_once(__DIR__.'/activities.lib.php');
require_once(__DIR__.'/utils.lib.php');

use \local_activities\lib\activities_lib;
use \local_activities\lib\utils_lib;
use DateTime;

class assessments_lib {

    public static function get($id) {
        global $DB, $USER;

        $assessment = $DB->get_record('activity_assessments', array('id' => $id));

        $assessment->usercanedit = false;
        if ($assessment->creator == $USER->username || has_capability('moodle/site:config', \context_user::instance($USER->id))) {
            $assessment->usercanedit = true;
        }

        return $assessment;
    }

    public static function get_course_cats() {
        global $DB;

        // Get courses under Senior Academic
        $categories = array();
        $cat = $DB->get_record('course_categories', array('idnumber' => 'SEN-ACADEMIC'));
        if ($cat) {
            $cat = \core_course_category::get($cat->id);
            $cats = $cat->get_children();
            foreach($cats as $cat) {
                $categories[] = array(
                    'value' => $cat->id,
                    'label' => $cat->name
                );
            }
        }

        return $categories;
    }

    public static function get_courses() {
        global $DB;

        // Get courses under Senior Academic
        $courses = array();
        $cat = $DB->get_record('course_categories', array('idnumber' => 'SEN-ACADEMIC'));
        if ($cat) {
            $cat = \core_course_category::get($cat->id);
            $coursesinfo = $cat->get_courses(['recursive'=>true]);
            foreach($coursesinfo as $courseinfo) {
                $courses[] = array(
                    'value' => $courseinfo->id,
                    'label' => $courseinfo->fullname
                );
            }
        }

        // Get courses under 2025
        $cat = $DB->get_record('course_categories', array('idnumber' => '2025'));
        if ($cat) {
            $cat = \core_course_category::get($cat->id);
            $coursesinfo = $cat->get_courses(['recursive'=>true]);
            foreach($coursesinfo as $courseinfo) {
                $courses[] = array(
                    'value' => $courseinfo->id,
                    'label' => $courseinfo->fullname
                );
            }
        }

        if ($courses) {
            usort($courses, function($a, $b) {
                return strcmp($a['label'], $b['label']);
            });
        }

        return $courses;
    }


    public static function get_modules($courseid) {
        global $DB;

        $modules = array();

        $course = $DB->get_record('course', array('id' => $courseid));
        $modinfo = @get_fast_modinfo($course);

        foreach ($modinfo->cms as $cm) {
            $modules[] = array(
                'value' => $cm->id,
                'label' => $cm->name,
                'url' => !empty($cm->url) ? $cm->url->out(false) : '',
            );
        }
        //var_export($modules); exit;
        return $modules;
    }


    public static function save_from_data($data) {
        global $DB, $USER;

        if ($data->id) {
            $data->timemodified = time();
            $DB->update_record('activity_assessments', (object) $data);
        } else {
            $data->creator = $USER->username;
            $data->timecreated = time();
            $data->id = $DB->insert_record('activity_assessments', (object) $data);
        }

        



        return array(
            'id' => $data->id,
        );
    }

    public static function get_cal( $args ) {
		switch ($args['type']) {
            case 'list':
                return self::getList($args);
            default:
                return self::getList($args);
                //return self::getFull($args);
        }
	}


    /**
     * Get the assessments for the calendar.
     *
     * @param array $args
     * @return array
     */
    public static function get_assessments($args) {
        global $DB, $USER;

        utils_lib::require_staff();

        $start = strtotime($args->scope->start . " 00:00:00");
        $end = strtotime($args->scope->end . " 00:00:00");
        $end += 86400; //add a day


        $sql = "SELECT *
                FROM mdl_activity_assessments
                WHERE deleted = 0
                AND (timedue >= ? AND timedue <= ?)
                ORDER BY timedue ASC";
        $records = $DB->get_records_sql($sql, [$start, $end]);
        $assessments = array();
        foreach ($records as $record) {
            $record->creator = utils_lib::user_stub($record->creator);
            $record->timestart = $record->timedue;
            $record->timeend = $record->timedue;
            $record->course = $DB->get_record('course', array('id' => $record->courseid));
            $record->usercanedit = false;
            if ($record->creator == $USER->username || has_capability('moodle/site:config', \context_user::instance($USER->id))) {
                $record->usercanedit = true;
            }
            $assessments[] = $record;            
        }

        return $assessments;
    }
















    public static function getList( $args ) {
		$events_array = array();
		$events_array['days'] = array();
		$events_array['days']['current'] = array();
		$events_array['days']['upcoming'] = array();

		//default args
        $year_now = $year = date('Y');
		$long_events = true;
		$type = 'list';
		
		// Get year if provided
		if( ! empty($args['year']) && is_numeric($year) ) {
			$year = $args['year'];
		}

		$term_map = array(
			1 => array(
				'start' => $year . '-01-01',
				'end' => $year . '-04-13',
			),
			2 => array(
				'start' => $year . '-04-14',
				'end' => $year . '-06-29',
			),
			3 => array(
				'start' => $year . '-06-30',
				'end' => $year . '-09-28',
			),
			4 => array(
				'start' => $year . '-09-29',
				'end' => $year . '-12-31',
			),
		);

		// Default term
		$term_now = $term = 1;
		if ( date($year . '-m-d') > $term_map[2]['start'] ) {
			$term_now = $term = 2;
		}
		if ( date($year . '-m-d') > $term_map[3]['start'] ) {
			$term_now = $term = 3;
		}
		if ( date($year . '-m-d') > $term_map[4]['start'] ) {
			$term_now = $term = 4;
		}

		// Get term if provided
		if( ! empty( $args['term'] ) ) {
			if ( $args['term'] >= 1 && $args['term'] <= 4 ) {
				$term = $args['term'];
			}
		}

		// Get long events if provided.
		if( ! empty($args['long_events']) ) {
			$long_events = $args['long_events'];
		}

		// Get categories if provided
		$categories = array();
		if( ! empty( $args['categories'] ) ) {
			$categories = $args['categories'];
		}

		//query the database for events in this time span
		$scope_datetime_start = new DateTime($term_map[$term]['start']);
		$scope_datetime_end = new DateTime($term_map[$term]['end']);

		$term_last = $term-1;
		$term_next = $term+1;
		$year_last = $year; 
		$year_next = $year;
		
		if ( $term == 1 ) { 
		   $term_last = 4;
		   $year_last = $year - 1;
		} elseif ( $term == 4 ){
			$term_next = 1;
			$year_next = $year + 1; 
		}

        $previous = array('type'=>$args['type'], 'tm'=>$term_last, 'yr'=>$year_last);
		$next = array('type'=>$args['type'], 'tm'=>$term_next, 'yr'=>$year_next);

		$events_array['pagination'] = array( 'previous' => $previous, 'next' => $next);
		$events_array['type'] = $type;
		$events_array['term'] = $term;
		$events_array['term_last'] = $term_last;
		$events_array['term_next'] = $term_next;
		$events_array['year'] = $year;
		$events_array['year_last'] = $year_last;
		$events_array['year_next'] = $year_next;
		$events_array['curr_period'] = $year_now . $term_now;
        $events_array['days'] = array(
            'current' => array(),
            'upcoming' => array(),
        );

		$events_args = array (
			'scope' => array( 
				'start' => $scope_datetime_start->format('Y-m-d'), 
				'end' => $scope_datetime_end->format('Y-m-d')
			),
			'categories' => $categories
		);
        
        //var_export($events_args); exit;
		$events = assessments_lib::get_assessments(json_decode(json_encode($events_args, JSON_FORCE_OBJECT)));

		if (empty($events)) {
			return $events_array;
		}

		
        //go through the events and put them into a daily array
        $events_dates = array();
        foreach($events as $event){
            $event_start_date = $event->timestart;
            $event_eventful_date = date('Y-m-d', $event_start_date);

            $in_scope = strtotime($event_eventful_date) >= strtotime($scope_datetime_start->format('Y-m-d'));
            
            $past = $event->timeend < strtotime('today midnight') ? true : false;
            if ($past) { 
                continue; 
            }

            $currently_on = (!$past) && ($event->timestart < time()) ? true : false;
            if( $currently_on ) {
                $events_dates['current'][$event_eventful_date][] = $event;
            } else {
                if ($in_scope) {
                    $events_dates['upcoming'][$event_eventful_date][] = $event;
                }
            }

            //if long events requested, add event to other dates too
            if( (!$currently_on) && $long_events && date('Y-m-d', $event->timeend) != date('Y-m-d', $event->timestart) ) {
                $tomorrow = $event_start_date + 86400;
                while( $tomorrow <= $event->timeend && $tomorrow <= strtotime($scope_datetime_end->format('Y-m-d h:i:s')) ){
                    $event_eventful_date = date('Y-m-d', $tomorrow);
                    $in_scope = strtotime($event_eventful_date) >= strtotime($scope_datetime_start->format('Y-m-d'));
                    if ($in_scope) {
                        $events_dates['upcoming'][$event_eventful_date][] = $event;
                    }
                    $tomorrow = $tomorrow + 86400;
                }
            }
        }


		foreach($events_dates as $period_key => $days) {
			foreach($events_dates[$period_key] as $day_key => $events) {
				$events_array['days'][$period_key][$day_key]['date_key'] = $day_key;
				$events_array['days'][$period_key][$day_key]['date'] = strtotime($day_key);
				$events_array['days'][$period_key][$day_key]['events_count'] = count($events);
				$events_array['days'][$period_key][$day_key]['events'] = $events;
			}
            $events_array['days'][$period_key] = array_values($events_array['days'][$period_key]);
		}

		return $events_array;
	}











}