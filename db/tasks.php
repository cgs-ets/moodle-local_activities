<?php
defined('MOODLE_INTERNAL') || die();
$tasks = array(
    array(
        'classname' => 'local_activities\task\cron_sync_planning',
        'blocking' => 0,
        'minute' => '*',
        'hour' => '*',
        'day' => '*',
        'month' => '*',
        'dayofweek' => '*'
    ),
);