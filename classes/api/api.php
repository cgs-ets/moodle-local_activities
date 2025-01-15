<?php

namespace local_activities;

defined('MOODLE_INTERNAL') || die();

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require_once(__DIR__.'/activities.api.php');
require_once(__DIR__.'/conflicts.api.php');
require_once(__DIR__.'/utils.api.php');
require_once(__DIR__.'/workflow.api.php');
require_once(__DIR__.'/calendar.api.php');
require_once(__DIR__.'/assessments.api.php');

class API {
    use \local_activities\api\activities_api;
    use \local_activities\api\conflicts_api;
    use \local_activities\api\utils_api;
    use \local_activities\api\workflow_api;
    use \local_activities\api\calendar_api;
    use \local_activities\api\assessments_api;
}