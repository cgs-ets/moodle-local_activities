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

    // Email header image url.
    $name = 'local_activities/emaillogo';
    $visiblename = get_string('emaillogo', 'local_activities');
    $description = get_string('emaillogo_desc', 'local_activities');
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
    
    // Header logo url. //https://cgs.act.edu.au/wp-content/uploads/2021/04/header-logo.svg
    $name = 'local_activities/headerlogourl';
    $visiblename = get_string('headerlogourl', 'local_activities');
    $setting = new admin_setting_configtext($name, $visiblename, '', null);
    $settings->add($setting);

    // Event reviewers
    $settings->add(new admin_setting_configtext('local_activities/eventreviewers', 'Event reviewers', 'Comma-separated usernames', ''));

    // MS Graph API credentials
    $settings->add(new admin_setting_configtext('local_activities/graphclientid', 'Graph API Client ID', '', ''));
    $settings->add(new admin_setting_configtext('local_activities/graphclientsecret', 'Graph API Client Secret', '', ''));
    $settings->add(new admin_setting_configtext('local_activities/graphtenantid', 'Graph API Tenant ID', '', ''));
    $settings->add(new admin_setting_configtext('local_activities/calendarupn', 'Calendar User Principal Name', '', ''));

    // External DB connections
    $settings->add(new admin_setting_heading(
        'local_activities_exdbheader', 
        get_string('settingsheaderdb', 'local_activities'), 
        ''
    ));
	$options = array('', "mariadb", "mysqli", "oci", "pdo", "pgsql", "sqlite3", "sqlsrv");
    $options = array_combine($options, $options);
    $settings->add(new admin_setting_configselect(
        'local_activities/dbtype', 
        get_string('dbtype', 'local_activities'), 
        get_string('dbtype_desc', 'local_activities'), 
        '', 
        $options
    ));
    $settings->add(new admin_setting_configtext('local_activities/dbhost', get_string('dbhost', 'local_activities'), get_string('dbhost_desc', 'local_activities'), 'localhost'));
    $settings->add(new admin_setting_configtext('local_activities/dbuser', get_string('dbuser', 'local_activities'), '', ''));
    $settings->add(new admin_setting_configpasswordunmask('local_activities/dbpass', get_string('dbpass', 'local_activities'), '', ''));
    $settings->add(new admin_setting_configtext('local_activities/dbname', get_string('dbname', 'local_activities'), '', ''));

    $settings->add(new admin_setting_configtext('local_activities/usertaglistssql', get_string('usertaglistssql', 'local_activities'), '', ''));
    $settings->add(new admin_setting_configtext('local_activities/publictaglistssql', get_string('publictaglistssql', 'local_activities'), '', ''));
    $settings->add(new admin_setting_configtext('local_activities/taglistuserssql', get_string('taglistuserssql', 'local_activities'), '', ''));
    $settings->add(new admin_setting_configtext('local_activities/checkabsencesql', get_string('checkabsencesql', 'local_activities'), '', ''));
    $settings->add(new admin_setting_configtext('local_activities/createabsencesql', get_string('createabsencesql', 'local_activities'), '', ''));
    $settings->add(new admin_setting_configtext('local_activities/studentdatachecksql', get_string('studentdatachecksql', 'local_activities'), '', ''));
    $settings->add(new admin_setting_configtext('local_activities/excursionconsentsql', get_string('excursionconsentsql', 'local_activities'), '', ''));
    $settings->add(new admin_setting_configtext('local_activities/deleteabsencessql', get_string('deleteabsencessql', 'local_activities'), '', ''));

    $settings->add(new admin_setting_configtext('local_activities/createclasssql', get_string('createclasssql', 'local_activities'), '', ''));
    $settings->add(new admin_setting_configtext('local_activities/insertclassstaffsql', get_string('insertclassstaffsql', 'local_activities'), '', ''));
    $settings->add(new admin_setting_configtext('local_activities/insertclassstudentsql', get_string('insertclassstudentsql', 'local_activities'), '', ''));
    $settings->add(new admin_setting_configtext('local_activities/deleteclassstudentssql', get_string('deleteclassstudentssql', 'local_activities'), '', ''));
    $settings->add(new admin_setting_configtext('local_activities/getdisalloweduserssql', get_string('getdisalloweduserssql', 'local_activities'), '', ''));

    $settings->add(new admin_setting_configtext('local_activities/getterminfosql', get_string('getterminfosql', 'local_activities'), '', ''));

}
