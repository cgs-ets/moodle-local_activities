<?php

namespace local_activities\api;

defined('MOODLE_INTERNAL') || die();

require_once(__DIR__.'/../lib/calendar.lib.php');

use \local_activities\lib\calendar_lib;

/**
 * Conflicts API trait
 */
trait calendar_api {

    /**
     * Check for conflicts.
     *
     * @return array
     */
    static public function get_cal() {
        $type = required_param('type', PARAM_RAW);
        $month = optional_param('month', '', PARAM_ALPHANUMEXT);
        $year = optional_param('year', '', PARAM_ALPHANUMEXT);
        $term = optional_param('term', '', PARAM_ALPHANUMEXT);
        return calendar_lib::get([
            'type' => $type,
            'month' => $month,
            'year' => $year,
            'term' => $term,
        ]);
    }


    


}
