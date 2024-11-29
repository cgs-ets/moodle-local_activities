<?php
defined('MOODLE_INTERNAL') || die();
$tasks = array(
    array(
        'classname' => 'local_activities\task\cron_sync_events',
        'blocking' => 0,
        'minute' => '*',
        'hour' => '*',
        'day' => '*',
        'month' => '*',
        'dayofweek' => '*'
    ),
    array(
        'classname' => 'local_activities\task\cron_emails_sys',
        'blocking' => 0,
        'minute' => '*',
        'hour' => '*',
        'day' => '*',
        'month' => '*',
        'dayofweek' => '*'
    ),
    array(
        'classname' => 'local_activities\task\cron_emails_user',
        'blocking' => 0,
        'minute' => '*',
        'hour' => '*',
        'day' => '*',
        'month' => '*',
        'dayofweek' => '*'
    ),
    array(
        'classname' => 'local_activities\task\cron_create_absences',
        'blocking' => 0,
        'minute' => '0',
        'hour' => '*',
        'day' => '*',
        'month' => '*',
        'dayofweek' => '*'
    ),
    array(
        'classname' => 'local_activities\task\cron_create_classes',
        'blocking' => 0,
        'minute' => '0',
        'hour' => '*',
        'day' => '*',
        'month' => '*',
        'dayofweek' => '*'
    ),
    array(
        'classname' => 'local_activities\task\cron_send_attendance_reminders',
        'blocking' => 0,
        'minute' => '0',
        'hour' => '*',
        'day' => '*',
        'month' => '*',
        'dayofweek' => '*'
    ),
    array(
        'classname' => 'local_activities\task\cron_send_approval_reminders',
        'blocking' => 0,
        'minute' => '10',
        'hour' => '5',
        'day' => '*',
        'month' => '*',
        'dayofweek' => '*'
    ),
);