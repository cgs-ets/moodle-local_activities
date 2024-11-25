<?php
/**
 * A scheduled task for notifications.
 *
 * @package   local_activities
 * @copyright 2024 Michael Vangelovski
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_activities\task;
defined('MOODLE_INTERNAL') || die();

require_once(__DIR__.'/../lib/activities.lib.php');
require_once(__DIR__.'/../lib/activity.class.php');
use \local_activities\lib\activities_lib;
use \local_activities\lib\activity;

class cron_permissions_send extends \core\task\scheduled_task {

    // Use the logging trait to get some nice, juicy, logging.
    use \core\task\logging_trait;

    /**
     * Get a descriptive name for this task (shown to admins).
     *
     * @return string
     */
    public function get_name() {
        return get_string('cron_send_permissions', 'local_activities');
    }

    /**
     * Execute the scheduled task.
     */
    public function execute() {
        global $DB;

        // Get unsent permissions (max 100 at a time).
        $timenow = time();
        $readabletime = date('Y-m-d H:i:s', $timenow);
        $this->log_start("Fetching unsent permissions (max 100 at a time) now ({$readabletime}).");
        for ($i = 1; $i <= 100; $i++) {
            
            // Get the next unsent permission record.
            $sql = "SELECT *
                      FROM {" . activities_lib::TABLE_ACTIVITY_PERMISSIONS . "}
                     WHERE queueforsending = 1
                  ORDER BY timecreated ASC";
            $permission = $DB->get_record_sql($sql, null, IGNORE_MULTIPLE);

            if (empty($permission)) {
                $this->log_finish("No more permissions to send. Exiting.");
                return;
            }

            // Immediately mark sent.
            $sql = "UPDATE {" . activities_lib::TABLE_ACTIVITY_PERMISSIONS . "}
                       SET queueforsending = 0
                     WHERE id = ?";
            $params = array($permission->id);
            $DB->execute($sql, $params);


            // Send the notification.
            $this->log("Found permission " . $permission->id . ". Sending now.");
            $this->send_permission($permission);
        }

        $this->log_finish("Finished sending permissions.");
    }

    protected function send_permission($permission) {
        global $DB, $PAGE, $OUTPUT;

        // Get the activity for the permission.
        $activity = new activity($permission->activityid);
        $activity = $activity->export();

        // Get the permission_send record.
        $emailaction = $DB->get_record(activities_lib::TABLE_ACTIVITY_PERMISSIONS_SEND, array('id' => $permission->queuesendid));

        // Inject some extra things for the template.
        $activity->extratext = $emailaction->extratext;
        $parentuser = \core_user::get_user_by_username($permission->parentusername);
        $studentuser = \core_user::get_user_by_username($permission->studentusername);
        $activity->parentname = fullname($parentuser);
        $activity->studentname = fullname($studentuser);

        $messagetext = $OUTPUT->render_from_template('local_activities/email_permissions_text', $activity);
        $messagehtml = $OUTPUT->render_from_template('local_activities/email_permissions_html', $activity);
        $subject = "Permission required for: " . $activity->activityname;
        $userfrom = \core_user::get_noreply_user();

        $eventdata = new \core\message\message();
        $eventdata->courseid            = SITEID;
        $eventdata->component           = 'local_activities';
        $eventdata->name                = 'notifications';
        $eventdata->userfrom            = $this->minimise_recipient_record($userfrom);
        $eventdata->userto              = $this->minimise_recipient_record($parentuser);
        $eventdata->subject             = $subject;
        $eventdata->fullmessage         = $messagetext;
        $eventdata->fullmessageformat   = FORMAT_PLAIN;
        $eventdata->fullmessagehtml     = $messagehtml;
        $eventdata->notification        = 1;
        message_send($eventdata);

        return true;
    }

    /**
     * Removes properties from user record that are not necessary for sending post notifications.
     *
     */
    protected function minimise_recipient_record($user) {
        // Make sure we do not store info there we do not actually
        // need in mail generation code or messaging.
        unset($user->institution);
        unset($user->department);
        unset($user->address);
        unset($user->city);
        unset($user->url);
        unset($user->currentlogin);
        unset($user->description);
        unset($user->descriptionformat);
        unset($user->icq);
        unset($user->skype);
        unset($user->yahoo);
        unset($user->aim);
        unset($user->msn);
        unset($user->phone1);
        unset($user->phone2);
        unset($user->country);
        unset($user->firstaccess);
        unset($user->lastaccess);
        unset($user->lastlogin);
        unset($user->lastip);

        return $user;
    }

}