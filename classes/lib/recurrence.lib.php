<?php

namespace local_activities\lib;

defined('MOODLE_INTERNAL') || die();

require_once(__DIR__.'/activities.lib.php');
require_once(__DIR__.'/utils.lib.php');
require_once(__DIR__.'/activity.class.php');

use \local_activities\lib\activities_lib;
use \local_activities\lib\utils_lib;
use \local_activities\lib\Activity;

class recurrence_lib {

    public static function get_recurrence_dates($recurrence, $timestart, $timeend) {
        $dates = array();
        $datesReadable = array();
        $format = "D, j M Y g:ia";
        
        if ($recurrence->recurringpattern == 'daily') {
            // If daily is selected but event goes for longer than a day, that's an issue.
            $daystart = date('d', $timestart);
            $dayend = date('d', $timeend);
            if ($daystart !== $dayend) {
                return false;
            }
            while ($timestart <= $recurrence->recuruntil) {
                if ($recurrence->recurringdailypattern == 'weekdays') {
                    if (date('N', $timestart) < 6) {
                        $dates[] = array('start' => $timestart,'end' => $timeend);
                        $datesReadable[] = array('start' => date($format, $timestart),'end' => date($format, $timeend));
                    }
                } else {
                    $dates[] = array('start' => $timestart,'end' => $timeend);
                    $datesReadable[] = array('start' => date($format, $timestart),'end' => date($format, $timeend));
                }
                $timestart += 60*60*24;
                $timeend += 60*60*24;
            };
        } else if ($recurrence->recurringpattern == 'weekly') {
            // If week is selected but event goes for longer than a week, that's an issue.
            if ($timeend-$timestart > 604800) { // seconds in a week.
                return false;
            }
            while ($timestart <= $recurrence->recuruntil) {
                $dates[] = array('start' => $timestart,'end' => $timeend);
                $datesReadable[] = array('start' => date($format, $timestart),'end' => date($format, $timeend));
                $timestart += 60*60*24*7;
                $timeend += 60*60*24*7;
            };
        }

        return ['dates'=> $dates, 'datesReadable'=> $datesReadable];
    }

  

}