<?php

namespace local_activities;

defined('MOODLE_INTERNAL') || die();

require_once(__DIR__.'/team.api.php');
require_once(__DIR__.'/events.api.php');
require_once(__DIR__.'/messages.api.php');
require_once(__DIR__.'/tu.api.php');

use \local_activities\api\team_api;
use \local_activities\api\events_api;
use \local_activities\api\messages_api;
use \local_activities\api\tu_api;

class API {
    use team_api;
    use events_api;
    use messages_api;
    use tu_api;
}