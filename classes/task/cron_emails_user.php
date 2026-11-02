<?php

/**
 * A scheduled task to queue up permission/message emails.
 *
 * @package   local_activities
 * @copyright 2024 Michael Vangelovski
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace local_activities\task;
defined('MOODLE_INTERNAL') || die();

require_once(__DIR__.'/../lib/utils.lib.php');
require_once(__DIR__.'/../lib/service.lib.php');
require_once(__DIR__.'/../lib/activities.lib.php');
require_once(__DIR__.'/../lib/activity.class.php');
use \local_activities\lib\utils_lib;
use \local_activities\lib\service_lib;
use \local_activities\lib\activities_lib;
use \local_activities\lib\activity;

class cron_emails_user extends \core\task\scheduled_task {

    // Use the logging trait to get some nice, juicy, logging.
    use \core\task\logging_trait;

    /**
     * Get a descriptive name for this task (shown to admins).
     *
     * @return string
     */
    public function get_name() {
        return get_string('cron_emails_user', 'local_activities');
    }

    /**
     * Execute the scheduled task.
     */
    public function execute() {
        global $DB;

        // Get unprocessed permission send requests (process max 20 at a time).
        $timenow = time();
        $readabletime = date('Y-m-d H:i:s', $timenow);
        $this->log_start("Fetching unprocessed activity emails (process max 20 at a time) now ({$readabletime}).");
        $sql = "SELECT *
                  FROM {" . activities_lib::TABLE_ACTIVITY_EMAILS . "}
                 WHERE status = ?
              ORDER BY timecreated ASC";
        $emails = $DB->get_records_sql($sql, array(activities_lib::EMAIL_STATUS_QUEUED), 0, 20);

        $emailactionids = array_column($emails, 'id');
        if (empty($emailactionids)) {
            $this->log_finish("No records found. Exiting.");
            return;
        }
        $this->log(sprintf("Found the following activity_email records %s.",
            json_encode($emailactionids),
        ), 2);

        $fromUser = \core_user::get_noreply_user();
        $fromUser->bccaddress = array("lms.archive@cgs.act.edu.au");

        $this->log("Queueing relevant permissions for sending.", 2);
        foreach ($emails as $email) {
            try {
                $this->process_email($email, $fromUser);
            } catch (\Throwable $e) {
                $this->record_failure($email, $e->getMessage());
            }
        }

        $this->log_finish("Finished queuing permissions.");
    }

    /**
     * Leave a failed row queued for the next run, or give up once it has been failing too long.
     *
     * Age is only checked after a failed attempt, so a cron outage can't fail a row that was never
     * tried. A failed row has been rolled back, so the next run starts it cleanly.
     *
     * @param \stdClass $email the activities_emails record.
     * @param string $reason
     * @return void
     */
    protected function record_failure($email, $reason) {
        global $DB;

        if (time() - $email->timecreated < activities_lib::EMAIL_RETRY_LIMIT) {
            $this->log("Activity email $email->id failed and will be retried: $reason", 2);
            return;
        }

        $DB->set_field(activities_lib::TABLE_ACTIVITY_EMAILS, 'status', activities_lib::EMAIL_STATUS_FAILED,
            array('id' => $email->id));
        $this->log("Activity email $email->id failed and will not be retried: $reason", 2);
        error_log('[local_activities] cron_emails_user: gave up on activity email ' . $email->id .
            ' for activity ' . $email->activityid . ' :: ' . $reason);
    }

    /**
     * Queue everything for one activities_emails row, or nothing at all.
     *
     * A partial run must never be possible. It would leave the row queued and the next run would
     * email the same recipients again.
     *
     * @param \stdClass $email the activities_emails record.
     * @param \stdClass $fromUser
     * @return void
     * @throws \Exception if the row could not be processed. Nothing has been queued for it.
     */
    protected function process_email($email, $fromUser) {
        global $DB;

        $audiences = json_decode($email->audiences);

        // Get the scope.
        $scope = json_decode($email->studentsjson);
        if (empty($scope) && !in_array('staff', $audiences)) { // Scope needs to be for students and parents.
            throw new \Exception("No student scope for this email.");
        }

        // Get the activity.
        $activity = new activity($email->activityid);
        if (empty($activity)) {
            throw new \Exception("The activity wasn't found.");
        }
        $activity = $activity->export();

        // If the email is a "permissions" email then it sends in a different way, because it needs to send per student.
        $includes = json_decode($email->includes);
        $ispermissions = in_array('permissions', $includes) && $activity->permissions;

        // Looked up before the transaction, so a failed lookup leaves the row for the next run.
        $students = array();
        $mentors = array();
        if ($ispermissions) {
            // Saves skip students who already have rows, so catch any parents linked since then.
            // Without a row, a parent would get this email but have nothing to respond to.
            activities_lib::generate_permissions($email->activityid, false);

            foreach ($scope as $studentun) {
                $student = \core_user::get_user_by_username($studentun);
                if (!empty($student)) {
                    $students[$student->id] = $student;
                }
            }
            $mentors = utils_lib::get_mentors_by_student(array_keys($students));
            if ($mentors === false) {
                throw new \Exception("Could not look up parents.");
            }
        }

        $transaction = $DB->start_delegated_transaction();
        try {
            if ($ispermissions) {
                $this->queue_permission_emails($email, $activity, $students, $mentors, $includes, $fromUser);
            } else {
                $this->queue_message_emails($email, $activity, $scope, $audiences, $includes, $fromUser);
            }

            $email->status = activities_lib::EMAIL_STATUS_SENT;
            $DB->update_record(activities_lib::TABLE_ACTIVITY_EMAILS, $email);
            $transaction->allow_commit();
        } catch (\Throwable $e) {
            $transaction->rollback($e); // Rethrows.
        }

        $this->log("Activity email $email->id processing complete.", 2);
    }

    /**
     * Queue a permission request to each parent of each student.
     *
     * @param \stdClass $email the activities_emails record.
     * @param \stdClass $activity the exported activity.
     * @param array $students [userid => user]
     * @param array $mentors [userid => [parent usernames]]
     * @param array $includes
     * @param \stdClass $fromUser
     * @return void
     */
    protected function queue_permission_emails($email, $activity, $students, $mentors, $includes, $fromUser) {
        global $OUTPUT;

        foreach ($students as $student) {
            foreach ($mentors[$student->id] as $parentun) {
                $parent = \core_user::get_user_by_username($parentun);
                if (empty($parent)) {
                    continue;
                }

                $data = new \stdClass();
                $data->activity = $activity;
                $data->recipientname = "$parent->firstname $parent->lastname";
                $data->studentname = "$student->firstname $student->lastname";
                $data->extratext = $email->extratext;
                $data->includepermissions = true;
                $data->includedetails = in_array('details', $includes);
                $body = $OUTPUT->render_from_template('local_activities/email_message', $data);
                $subject = "Permissions required for: $activity->activityname";
                service_lib::wrap_and_email_to_user($parent, $fromUser, $subject, $body);
            }
        }
    }

    /**
     * Queue a message to each recipient in the chosen audiences.
     *
     * @param \stdClass $email the activities_emails record.
     * @param \stdClass $activity the exported activity.
     * @param array $scope student usernames.
     * @param array $audiences
     * @param array $includes
     * @param \stdClass $fromUser
     * @return void
     */
    protected function queue_message_emails($email, $activity, $scope, $audiences, $includes, $fromUser) {
        global $OUTPUT;

        // Determine the recipients.
        $students = [];
        $parents = [];
        $staff = [];

        if (in_array('students', $audiences)) {
            // Add students.
            $students = $scope;
        }

        if (in_array('staff', $audiences)) {
            // Add staff.
            $staff = activities_lib::get_all_staff($email->activityid);
        }

        if (in_array('parents', $audiences)) {
            // Add parents.
            $userids = utils_lib::get_userids($scope);
            $parents = utils_lib::get_users_mentors($userids);
        }

        $allusers = array_unique(array_merge($staff, $students, $parents));

        foreach ($allusers as $recipientun) {
            $recipient = \core_user::get_user_by_username($recipientun);
            if (empty($recipient)) {
                continue;
            }

            $data = new \stdClass();
            $data->activity = $activity;
            $data->recipientname = "$recipient->firstname $recipient->lastname";
            $data->extratext = $email->extratext;
            $data->includepermissions = false;
            $data->includedetails = in_array('details', $includes);
            $body = $OUTPUT->render_from_template('local_activities/email_message', $data);
            $subject = $activity->activityname;
            service_lib::wrap_and_email_to_user($recipient, $fromUser, $subject, $body);
        }
    }

}
