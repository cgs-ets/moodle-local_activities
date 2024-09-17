<?php

defined('MOODLE_INTERNAL') || die;

if ($hassiteconfig) {
    $settings = new admin_settingpage('local_activities', get_string('pluginname', 'local_activities'));
    $ADMIN->add('localplugins', $settings);

    $settings->add(new admin_setting_heading('local_activities_appearance', get_string('settingsappearance', 'local_activities'), ''));

    // Custom tool name.
    $name = 'local_activities/toolname';
    $visiblename = get_string('toolname', 'local_activities');
    $description = get_string('toolname_desc', 'local_activities');
    $setting = new admin_setting_configtext($name, $visiblename, $description, 'Activity Planning');
    $settings->add($setting);

    // Logo.
    $name = 'local_activities/logo';
    $visiblename = get_string('logo', 'local_activities');
    $description = get_string('logo_desc', 'local_activities');
    $setting = new admin_setting_configtext($name, $visiblename, $description, null);
    $settings->add($setting);

    // Favicon.
    $name = 'local_activities/favicon';
    $visiblename = get_string('favicon', 'local_activities');
    $description = get_string('favicon_desc', 'local_activities');
    $setting = new admin_setting_configtext($name, $visiblename, $description, null);
    $settings->add($setting);

    // Header background color.
    $name = 'local_activities/headerbg';
    $visiblename = get_string('headerbg', 'local_activities');
    $setting = new admin_setting_configcolourpicker($name, $visiblename, '', '#0F172A', null , true);
    $settings->add($setting);

    // Header foreground color.
    $name = 'local_activities/headerfg';
    $visiblename = get_string('headerfg', 'local_activities');
    $setting = new admin_setting_configcolourpicker($name, $visiblename, '', '#FFFFFF', null , true);
    $settings->add($setting);


}
