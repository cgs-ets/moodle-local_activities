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

    /**
     * Create an instance of this class.
     *
     * @param int $id If set, this is the id of an existing record, used to load the data.
     */
    public function __construct($id = 0) {
        global $CFG;

        $this->data = new \stdClass();

        if ($id > 0) {
            return $this->read($id);
        }
    }

    /**
     * Decorate the model.
     *
     * @return array
     */
    public function export() {
        if (!$this->get('id')) {
            return [];
        }

        $this->load_planningstaffdata();
        $this->load_accompanyingstaffdata();

        return [
            'id' => $this->get('id'),
            'idnumber' => $this->get('idnumber'),
            'creator' => $this->get('creator'),
            'status' => $this->get('status'),
            'teamname' => $this->get('teamname'),
            'category' => $this->get('category'),
            'categoryname' => service_lib::get_cat_name($this->get('category')),
            'details' => $this->get('details'),
            'coaches' => $this->get('coachesdata'),
            'assistants' => $this->get('assistantsdata'),
            'timecreated' => $this->get('timecreated'),
            'timemodified' => $this->get('timemodified'),
        ];
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
                  FROM {activity_staff}
                 WHERE activityid = ?
                   AND usertype = 'planning'";
        $params = array($this->get('id'));
        $records = $DB->get_records_sql($sql, $params);

        $assistants = array();
        foreach($records as $rec) {
            $assistant = \local_activities\service_lib::user_stub($rec->username);
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
                  FROM {activity_staff}
                 WHERE activityid = ?
                   AND usertype = 'accompanying'";
        $params = array($this->get('id'));
        $records = $DB->get_records_sql($sql, $params);

        $coaches = array();
        foreach($records as $rec) {
            $coach = \local_activities\lib\service_lib::user_stub($rec->username);
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
    public function load_studentsdata() {
        global $DB;

        if (empty($this->get('id'))) {
            return [];
        }

        $sql = "SELECT *
                FROM {activity_students}
                WHERE activityid = ?
                AND status = 0";
        $params = array($this->get('id'));
        $records = $DB->get_records_sql($sql, $params);

        $students = array();
        foreach($records as $rec) {
            $mdluser = \core_user::get_user_by_username($rec->username);
            if (empty($mdluser)) {
                continue;
            }
            $student = new \stdClass();
            $student->un = $mdluser->username;
            $student->fn = $mdluser->firstname;
            $student->ln = $mdluser->lastname;
            $student->attributes = [];
            $students[] = $student;
        }

        // Sort by last name.
        usort($students, fn($a, $b) => strcmp($a->ln, $b->ln));

        $this->set('studentsdata', json_encode($students));
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
        if ($files) {
            foreach ($files as $file) {
                $displayname = array_pop(explode('__', $file->get_filename()));
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

}