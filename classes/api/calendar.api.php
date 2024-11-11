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
        return calendar_lib::get([
            'type' => $type,
        ]);
    }


    


}
