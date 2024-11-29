<?php

// Include required files and classes.
require_once(dirname(__FILE__) . '/../../config.php');


$context = context_system::instance();
$PAGE->set_context($context);
$pageurl = new moodle_url('/local/activities/debugger.php');
$PAGE->set_url($pageurl);
$title = get_string('pluginname', 'local_activities');
$PAGE->set_heading($title);
$PAGE->set_title($SITE->fullname . ': ' . $title);
$PAGE->navbar->add($title);

// Check user is logged in.
require_login();
require_capability('moodle/site:config', $context, $USER->id); 


echo "<pre>"; 

$cron = new \local_activities\task\cron_create_absences();
$cron->execute();

echo "------------------------------------------------------------------------<br>";

$cron = new \local_activities\task\cron_create_classes();
$cron->execute();

echo "------------------------------------------------------------------------<br>";

$cron = new \local_activities\task\cron_emails_sys();
$cron->execute();

echo "------------------------------------------------------------------------<br>";

$cron = new \local_activities\task\cron_emails_user();
$cron->execute();

echo "------------------------------------------------------------------------<br>";

$cron = new \local_activities\task\cron_send_approval_reminders();
$cron->execute();

echo "------------------------------------------------------------------------<br>";

$cron = new \local_activities\task\cron_send_attendance_reminders();
$cron->execute();

echo "------------------------------------------------------------------------<br>";

$cron = new \local_activities\task\cron_sync_events();
$cron->execute();



exit;

