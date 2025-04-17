<?php
    require(__DIR__.'/../../config.php');
    // If url is /local/activities/public, then we do not require login.
    if (!str_contains($_SERVER['REQUEST_URI'], '/local/activities/public') || isloggedin()) {
        require_login();
    }
    require_once __DIR__ . '/bootstrap.php';
    require_once(__DIR__.'/classes/lib/service.lib.php');
    require_once(__DIR__.'/classes/lib/utils.lib.php');

    $activitiesconfig = get_config('local_activities');
    $config = new \stdClass();
    $config->version = $activitiesconfig->version;
    $config->sesskey = sesskey();
    $config->wwwroot = $CFG->wwwroot;
    $config->sitename = $SITE->fullname;
    $config->toolname = \local_activities\lib\service_lib::get_toolname();
    $config->headerbg = $activitiesconfig->headerbg;
    $config->headerfg = $activitiesconfig->headerfg;
    $config->headerlogourl = $activitiesconfig->headerlogourl;
    $user = \local_activities\lib\utils_lib::user_stub($USER->username);
    $config->user = $user;
    $config->roles = \local_activities\lib\service_lib::get_user_roles($USER->username);
    $config->calroles = \local_activities\lib\utils_lib::get_cal_roles($USER->username);
    $config->loginUrl = (new moodle_url('/login/index.php'))->out();
    $config->logoutUrl = (new moodle_url('/login/logout.php', ['sesskey' => $config->sesskey]))->out();
    
    $config->favicon = get_favicon('src/assets/favicon.png');
    $config->logo = get_logo('src/assets/logo.png');

?>
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Activity Planning</title>
        <script>
            window.appdata = {}
            window.appdata.config = <?= json_encode($config) ?>
        </script>
        <link rel="icon" type="image/x-icon" href="<?= $config->favicon ?>" />
        <?= bootstrap('index.html') ?>

        <meta name="theme-color" content="#0F172A">

        <!-- PWA contents -->
        <!-- Generated assets and the following code via npx pwx-asset-generator command in npm run build -->

    </head>
    <body>
        <div id="root"></div>
    </body>
</html>