<?php

namespace local_activities;

defined('MOODLE_INTERNAL') || die();

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require_once(__DIR__.'/activities.api.php');
require_once(__DIR__.'/utils.api.php');

use \local_activities\api\activities_api;
use \local_activities\api\utils_api;

class API {
    use activities_api;
    use utils_api;
}