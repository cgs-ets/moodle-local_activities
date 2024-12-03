<?php
// <url>/local/activities/avatar.php?username=admin
require(__DIR__.'/../../config.php');
require_once(__DIR__.'/classes/lib/utils.lib.php');
require_once(__DIR__.'/classes/lib/generator.lib.php');

use \local_activities\lib\utils_lib;
use \local_activities\lib\generator_lib;

$activityid = required_param('activityid', PARAM_INT);
$doc = required_param('doc', PARAM_RAW);

require_login();
utils_lib::require_staff();

$context = context_system::instance();
$PAGE->set_context($context);

generator_lib::make($activityid, $doc);