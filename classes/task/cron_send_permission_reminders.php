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

require_once(__DIR__.'/../lib/workflow.lib.php');
require_once(__DIR__.'/../lib/service.lib.php');
require_once(__DIR__.'/../lib/activities.lib.php');
require_once(__DIR__.'/../lib/activity.class.php');
use \local_activities\lib\workflow_lib;
use \local_activities\lib\service_lib;
use \local_activities\lib\activities_lib;
use \local_activities\lib\activity;

class cron_send_permission_reminders extends \core\task\scheduled_task {

    // Use the logging trait to get some nice, juicy, logging.
    use \core\task\logging_trait;

    /**
     * Get a descriptive name for this task (shown to admins).
     *
     * @return string
     */
    public function get_name() {
        return get_string('cron_send_permission_reminders', 'local_activities');
    }

    /**
     * Execute the scheduled task.
     */
    public function execute() {
        global $DB, $PAGE;

        /********************
         * 14 Day Reminder
         */
        $this->log_start("Fetching activities for 14 day reminder.");
        $today = strtotime('today midnight');
        $plus14days = strtotime('+14 day', $today);
        $plus15days = strtotime('+15 day', $today);
        $readableplus14days= date('Y-m-d H:i:s', $plus14days);
        $readableplus15days= date('Y-m-d H:i:s', $plus15days);
        $this->log("Fetching activities with permissions starting between {$readableplus14days} and {$readableplus15days}.", 2);
        $activities = activities_lib::get_for_permission_reminders($plus14days, $plus15days);
        $this->process_activities($activities, '14');

        /********************
         * 7 Day Reminder
         */
        $this->log_start("Fetching activities for 7 day reminder.");
        $today = strtotime('today midnight');
        $plus7days = strtotime('+7 day', $today);
        $plus8days = strtotime('+8 day', $today);
        $readableplus7days= date('Y-m-d H:i:s', $plus7days);
        $readableplus8days= date('Y-m-d H:i:s', $plus8days);
        $this->log("Fetching activities with permissions starting between {$readableplus7days} and {$readableplus8days}.", 2);
        $activities = activities_lib::get_for_permission_reminders($plus7days, $plus8days);
        $this->process_activities($activities, '7');


        /********************
         * 3 Day Reminder
         */
        $this->log_start("Fetching activities for 3 day reminder.");
        $today = strtotime('today midnight');
        $plus3days = strtotime('+3 day', $today);
        $plus4days = strtotime('+4 day', $today);
        $readableplus3days= date('Y-m-d H:i:s', $plus3days);
        $readableplus4days= date('Y-m-d H:i:s', $plus4days);
        $this->log("Fetching activities with permissions starting between {$readableplus3days} and {$readableplus4days}.", 2);
        $activities = activities_lib::get_for_permission_reminders($plus3days, $plus4days);
        $this->process_activities($activities, '3');


        /********************
         * 1 Day Reminder
         */
        $this->log_start("Fetching activities for 1 day reminder.");
        $today = strtotime('today midnight');
        $plus1days = strtotime('+1 day', $today);
        $plus2days = strtotime('+2 day', $today);
        $readableplus1days= date('Y-m-d H:i:s', $plus1days);
        $readableplus2days= date('Y-m-d H:i:s', $plus2days);
        $this->log("Fetching activities with permissions starting between {$readableplus1days} and {$readableplus2days}.", 2);
        $activities = activities_lib::get_for_permission_reminders($plus1days, $plus2days);
        $this->process_activities($activities, '1');
    }

    protected function process_activities($activities, $numdays) {
        foreach ($activities as $activity) {
            // Export the activity.
            $data = $activity->export();
            
            // Add staff in charge to list of recipients.
            $recipients = array();
            $recipients[$data->staffincharge] = null;

            // Send to activity creator.
            //if ( ! array_key_exists($data->creator, $recipients)) {
            //    $recipients[$data->creator] = null;
            //}

            // If this is 1 day reminder, CC the approving director.
            if ($numdays == '1') {
                $finalapproval = activities_lib::get_final_approver($data->id);
                if ( ! array_key_exists($finalapproval->username, $recipients)) {
                    $recipients[$finalapproval->username] = null;
                }
            }

            // Get the list of students needing permissions.
            $students = activities_lib::get_unresponded_students($data->id);
            if (empty($students)) {
                continue;
            }
            $data->students = $students;
            $data->numdays = $numdays;

            // Send the reminders.
            foreach ($recipients as $username => $email) {
                $this->log("Sending permission reminder for activity " . $data->id . " to " . $username, 3);
                $this->send_reminder($data, $username, $email);
            }
            
            $this->log_finish("Finished sending {$numdays} day permission reminders for activity " . $data->id);
        }
    }




    protected function send_reminder($activity, $username, $email) {
        global $OUTPUT;

        $messageHtml = $OUTPUT->render_from_template('local_activities/email_permissions_reminder_html', $activity);
        $subject = "Permission reminder for: " . $activity->activityname;
        $toUser = \core_user::get_user_by_username($username);
        if ($email) {
            // Override the email address.
            $toUser->email = $email;
        }
        $fromUser = \core_user::get_noreply_user();
        $fromUser->bccaddress = array("lms.archive@cgs.act.edu.au"); 
        $result = service_lib::wrap_and_email_to_user($toUser, $fromUser, $subject, $messageHtml);
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