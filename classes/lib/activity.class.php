<?php

namespace local_activities\lib;

require_once(__DIR__.'/../lib/activities.lib.php');
require_once(__DIR__.'/../lib/service.lib.php');
require_once(__DIR__.'/../lib/utils.lib.php');

use \local_activities\lib\activities_lib;
use \local_activities\lib\service_lib;
use \local_activities\lib\utils_lib;

defined('MOODLE_INTERNAL') || die();

/**
 * Persistent model representing a single activity.
 */
class Activity {

    /** Table to store this persistent model instances. */
    const TABLE = 'activities';
    
    private $data = null;

    private const defaults = [
        'id' => 0,
        'creator' => '',
        'activityname' => '',
        'idnumber' => '',
        'campus' => 'senior',
        'activitytype' => 'excursion',
        'location' => '',
        'timestart' => 0,
        'timeend' => 0,
        'studentlistjson' => '',
        'description' => '',
        'transport' => '',
        'cost' => '',
        'status' => 0,
        'permissions' => 0,
        'permissionstype' => '',
        'permissionslimit' => 0,
        'permissionsdueby' => 0,
        'deleted' => 0,
        'riskassessment' => '',
        'attachments' => '',
        'timecreated' => 0,
        'timemodified' => 0,
        'staffincharge' => '',
        'staffinchargejson' => '',
        'planningstaffjson' => '',
        'accompanyingstaffjson' => '',
        'otherparticipants' => '',
        'absencesprocessed' => 0,
        'remindersprocessed' => 0,
        'categoriesjson' => '',
        'colourcategory' => '',
        'areasjson' => '',
        'displaypublic' => 0,
        'pushpublic' => 0,
        'timesynclive' => 0,
        'timesyncplanning' => 0,
        'assessmentid' => 0,
        //'isassessment' => 0,
        //'courseid' => 0,
        //'assessmenturl' => ''
    ];


    /**
     * Create an instance of this class.
     *
     * @param int $id If set, this is the id of an existing record, used to load the data.
     */
    public function __construct($id = 0) {
        global $CFG;

        $this->data = (object) static::defaults;

        if ($id > 0) {
            return $this->read($id);
        }
    }

    /**
     * Decorate the model for calendar. Minimal for performance.
     *
     * @return array
     */
    public function export_minimal() {
        global $USER;

        if (!$this->get('id')) {
            return static::defaults;
        }

        $data = clone($this->data);
        $other = $this->get_other_values_minimal();
        $merged = (object) array_merge((array) $data, (array) $other);
        return $merged;
    }

    /**
     * Decorate the model.
     *
     * @return array
     */
    public function export($usercontext = null) {
        global $USER;

        if (!$this->get('id')) {
            return static::defaults;
        }

        if (empty($usercontext)) {
            $usercontext = $USER;
        }

        $data = clone($this->data);
        $data->riskassessment = $this->export_files('riskassessment');
        // If nothing in riskassessment, check oldexcursionid.
        if (empty($data->riskassessment)) {
            if ($this->data->oldexcursionid) {
                $data->riskassessment = $this->export_old_files('ra', $this->data->oldexcursionid);
            }
        }
        $data->attachments = $this->export_files('attachments');
        if (empty($data->attachments)) {
            if ($this->data->oldexcursionid) {
                $data->attachments = $this->export_old_files('attachments', $this->data->oldexcursionid);
            }
        }
        $other = $this->get_other_values($usercontext);
        $merged = (object) array_merge((array) $data, (array) $other);

        return $merged;
    }
    
    /**
     * Load related assistant records 
     *
     * @return void
     */
    public function load_planningstaffdata() {
        global $DB;

        if (empty($this->get('id'))) {
            return [];
        }

        $sql = "SELECT *
                  FROM {activities_staff}
                 WHERE activityid = ?
                   AND usertype = 'planning'";
        $params = array($this->get('id'));
        $records = $DB->get_records_sql($sql, $params);

        $assistants = array();
        foreach($records as $rec) {
            $assistant = \local_activities\utils_lib::user_stub($rec->username);
            if (empty($assistant)) {
                continue;
            }
            $assistants[] = $assistant;
        }

        $this->set('plannerdata', json_encode($assistants));
    }

    /**
     * Load related coaches records
     *
     * @return void
     */
    public function load_accompanyingstaffdata() {
        global $DB;

        if (empty($this->get('id'))) {
            return [];
        }

        $sql = "SELECT *
                  FROM {activities_staff}
                 WHERE activityid = ?
                   AND usertype = 'accompanying'";
        $params = array($this->get('id'));
        $records = $DB->get_records_sql($sql, $params);

        $coaches = array();
        foreach($records as $rec) {
            $coach = \local_activities\lib\utils_lib::user_stub($rec->username);
            if (empty($coach)) {
                continue;
            }
            $coaches[] = $coach;
        }

        $this->set('accompanyingdata', json_encode($coaches));
    }

    /**
     * Load related student recods.
     *
     * @return void
     */
    public function load_studentsdata($withpermissions = false) {
        global $DB;

        if (empty($this->get('id'))) {
            return [];
        }

        $sql = "SELECT *
                FROM {activities_students}
                WHERE activityid = ?";
        $params = array($this->get('id'));
        $records = $DB->get_records_sql($sql, $params);

        $students = array();
        foreach($records as $rec) {
            $student = utils_lib::student_stub($rec->username);
            if (!$student) {
                continue;
            }
            $student->permission = -1;
            $student->parents = [];
            $students[] = $student;
        }
        //var_export($students); exit;

        // Get permissions.
        if ($withpermissions) {
            // Process students and attach permissions.
            $permissions = $this->get_permissions();
            foreach ($students as &$student) {
                // Determine whether student is allowed based on permissions.
                if (isset($permissions[$student->un])) {
                    $student->permission = max(array_column($permissions[$student->un], "response"));
                    $student->parents = $permissions[$student->un];
                }
            }
        }

        // Sort by last name.
        usort($students, function($a, $b) {
            return strcmp($a->ln, $b->ln);
        });

        $this->set('studentsdata', json_encode($students));
    }

    public function get_permissions() {
        global $DB;

        if (empty($this->get('id'))) {
            return [];
        }

        $sql = "SELECT *
                FROM {activities_permissions}
                WHERE activityid = ?";
        $params = array($this->get('id'));
        $records = $DB->get_records_sql($sql, $params);

        $permissions = array();
        foreach ($records as $rec) {
            if (!isset($permissions[$rec->studentusername])) {
                $permissions[$rec->studentusername] = array();
            }
            $parent = utils_lib::user_stub($rec->parentusername);
            $parent->response = $rec->response;
            $permissions[$rec->studentusername][] = $parent;
        }
        return $permissions;
    }

    /**
     * create a new block record in the db and return a block instance.
     *
     * @return static
     */
    public function create() {
        global $DB;

        
        $data = clone($this->data); // Make a copy.
        $data->timecreated = time();
        $data->timemodified = time();

        // Merge into default values
        $data = (object) array_replace(static::defaults, (array) $data);
        //var_export($data); exit;
        //$this->validate_data();

        $id = $DB->insert_record(static::TABLE, $data);

        return $this->read($id);
    }

    /**
     * Create or update an activity.
     *
     * @return static
     */
    public function save() {
        global $DB;

        if (empty($this->data->id)) {
            // Create new
            $this->data->id = $this->create()->data->id;
        } else {
            $this->update();
        }

        return $this->data->id;
    }

    /**
     * update activity data.
     *
     * @param $data
     * @return static
     */
    public function update() {
        global $DB;

        //var_export($this->data); exit;
        if (!empty($this->data->id)) {
            $this->data->timemodified = time();
            $DB->update_record(static::TABLE, $this->data);
            return $this->data->id;
        }

        return;
    }

    /**
     * Get information about team files.
     *
     * @param string $area
     * @param int $id
     * @return array
     */
    public function export_files($area, $id = 0) {
        global $CFG;

        if (empty($id)) {
            if (!$this->get('id')) {
                return [];
            }
            $id = $this->get('id');
        }
        $out = [];
        $fs = get_file_storage();
	    $files = $fs->get_area_files(1, 'local_activities', $area, $id, "filename", false);
        //var_export($files); exit;
        if ($files) {
            foreach ($files as $file) {
                $filenameParts = explode('__', $file->get_filename()); // Store result in a variable
                $displayname = array_pop($filenameParts); // Now array_pop can safely operate on the variable
                $path = file_encode_url($CFG->wwwroot.'/pluginfile.php', '/1/local_activities/'.$area.'/'.$id.'/'.$file->get_filename());
                $out[] = [
                    'displayname' => $displayname,
                    'fileid' => $file->get_id(),
                    'serverfilename' => $file->get_filename(),
                    'mimetype' => $file->get_mimetype(),
                    'path' => $path,
                    'existing' => true,
                ];
            }
        }
        
        return $out;
    }


    public function export_old_files($area, $id) {
        global $CFG;

        $out = [];
        $fs = get_file_storage();
	    $files = $fs->get_area_files(1, 'local_excursions', $area, $id, "filename", false);
        //var_export($files); exit;
        if ($files) {
            foreach ($files as $file) {
                $filenameParts = explode('__', $file->get_filename()); // Store result in a variable
                $displayname = array_pop($filenameParts); // Now array_pop can safely operate on the variable
                $path = file_encode_url($CFG->wwwroot.'/pluginfile.php', '/1/local_excursions/'.$area.'/'.$id.'/'.$file->get_filename());
                $out[] = [
                    'displayname' => $displayname,
                    'fileid' => $file->get_id(),
                    'serverfilename' => $file->get_filename(),
                    'mimetype' => $file->get_mimetype(),
                    'path' => $path,
                    'existing' => true,
                ];
            }
        }
        
        return $out;
    }

    /**
     * Delete team
     *
     * @return string randomised idnumber
     */
    public function soft_delete() {
        global $DB;
        
        $this->set('deleted', 1);
        //randomize idnumber to take it out of playing field.
        $slug = 'archive-' . $this->get('idnumber');
        do {
            $random = substr(str_shuffle(MD5(microtime())), 0, 10);
            $idnumber = $slug.'-'.$random;
            $exists = $DB->record_exists('activities', ['idnumber' => $idnumber]);
        } while ($exists);
        $this->set('idnumber', $slug.'-'.$random);
        $this->update();
        return $slug.'-'.$random;
    }


    /**
     * Load the data from the DB.
     *
     * @param $id
     * @return static
     */
    final public function read($id) {
        global $DB;

        $this->data = (object) $DB->get_record(static::TABLE, array('id' => $id, 'deleted' => 0), '*', IGNORE_MULTIPLE);

        return $this;
    }

    /**
     * Load the data from the DB.
     *
     * @param $id
     * @return static
     */
    final public static function exists($id) {
        global $DB;

        return $DB->record_exists(static::TABLE, array('id' => $id, 'deleted' => 0));
    }

    public function set($property, $value) {
        $this->data->$property = $value;
    }

    public function get($property) {
        if (isset($this->data->$property)) {
            return $this->data->$property;
        }
    }

    public function get_data() {
        return $this->data;
    }


    /**
     * Get the additional values to inject while exporting.
     *
     * @return array Keys are the property names, values are their values.
     */
    protected function get_other_values($usercontext) {
        global $USER, $DB;

        $usercontext = $USER;
        if (isset($this->related['usercontext'])) {
            $usercontext = $this->related['usercontext'];
        }

        $manageurl = new \moodle_url("/local/activities/{$this->data->id}");

        $permissionsurl = new \moodle_url("/local/activities/{$this->data->id}/permission");

        $isactivity = false;
        if ($this->data->activitytype == 'excursion' || $this->data->activitytype == 'incursion' || $this->data->activitytype == 'commercial') {
            $isactivity = true;
        }

        $ispast = false;
        if ($this->data->timeend && $this->data->timeend < time()) {
            $ispast = true;
        }
        
        $statushelper = activities_lib::status_helper($this->data->status);

        $iscreator = ($this->data->creator == $usercontext->username);

        $isplanner = false;
        $planning = json_decode($this->data->planningstaffjson);
        if ($planning) {
            foreach ($planning as $user) {
                if ($USER->username == $user->un) {
                    $isplanner = true;
                    break;
                }
            }
        }

        $isaccompanying = false;
        $accompanying = json_decode($this->data->accompanyingstaffjson);
        if ($accompanying) {
            foreach ($accompanying as $user) {
                if ($USER->username == $user->un) {
                    $isaccompanying = true;
                    break;
                }
            }
        }

        $isapprover = workflow_lib::is_approver_of_activity($this->data->id);
        if ($isapprover) {
            $userapprovertypes = workflow_lib::get_approver_types($usercontext->username);
        }

        $isstaffincharge = false;
        if ($this->data->staffincharge == $usercontext->username) {
            $isstaffincharge = true;
        }

        $usercanedit = false;
        if ($iscreator || $isstaffincharge || $isapprover || $isplanner || has_capability('moodle/site:config', \context_user::instance($USER->id))) {
            $usercanedit = true;
        }

        $usercansendmail = false;
        if ($iscreator || $isstaffincharge || $isplanner) {
            $usercansendmail = true;
        }

        $dateDiff = intval(($this->data->timeend-$this->data->timestart)/60);
        $days = intval($dateDiff/60/24);
        $hours = (int) ($dateDiff/60)%24;
        $minutes = $dateDiff%60;
        $duration = '';
        $duration .= $days ? $days . 'd ' : '';
        $duration .= $hours ? $hours . 'h ' : '';
        $duration .= $minutes ? $minutes . 'm ' : '';

        $startreadabletime = '';
        if ($this->data->timestart > 0) {
            $startreadabletime = date('j M Y, g:ia', $this->data->timestart);
        }
        $endreadabletime = '';
        if ($this->data->timeend > 0) {
            $endreadabletime = date('j M Y, g:ia', $this->data->timeend);
        }

        // Check if this activity is linked to an assessment.
        $assessmentid = $DB->get_field('activities_assessments', 'id', array('activityid' => $this->data->id));

    	return [
            'manageurl' => $manageurl->out(false),
            'permissionsurl' => $permissionsurl->out(false),
            'statushelper' => $statushelper,
            'iscreator' => $iscreator,
            'isapprover' => $isapprover,
            'isplanner' => $isplanner,
            'isaccompanying' => $isaccompanying,
            'isstaffincharge' => $isstaffincharge,
            'staffinchargedata' => utils_lib::user_stub($this->data->staffincharge),
            'usercanedit' => $usercanedit,
            'usercansendmail' => $usercansendmail,
            'ispast' => $ispast,
            'duration' => $duration,
            'isactivity' => $isactivity,
            'startreadabletime' => $startreadabletime,
            'endreadabletime' => $endreadabletime,
            //'isallday' => ( date('H:i', $this->data->timestart) == '00:00' && date('H:i', $this->data->timeend) == '23:59'),
            'assessmentid' => $assessmentid,
	    ];
    }


    /**
     * Get the additional values to inject while exporting.
     *
     * @return array Keys are the property names, values are their values.
     */
    protected function get_other_values_minimal() {
        global $USER, $DB;
        
        $statushelper = activities_lib::status_helper($this->data->status);

    	return [
            'statushelper' => $statushelper,
	    ];
    }

}