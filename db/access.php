<?php

defined('MOODLE_INTERNAL') || die();

$capabilities = array(
    'local/activities:manage' => array (
        'captype'       => 'write',
        'contextlevel'  => CONTEXT_SYSTEM,
        'archetypes'    => array (
            'teacher'        => CAP_ALLOW,
            'editingteacher' => CAP_ALLOW,
            'manager'        => CAP_ALLOW,
            'coursecreator'  => CAP_ALLOW,
        )
    ),
);
