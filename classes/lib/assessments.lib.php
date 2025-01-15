<?php

namespace local_activities\lib;

defined('MOODLE_INTERNAL') || die();

require_once(__DIR__.'/activities.lib.php');

use \local_activities\lib\activities_lib;

class assessments_lib {

    public static function get_courses() {
        global $DB;

        // Get courses under Senior Academic
        $courses = array();
        $cat = $DB->get_record('course_categories', array('idnumber' => 'SEN-ACADEMIC'));
        if ($cat) {
            $cat = \core_course_category::get($cat->id);
            $coursesinfo = $cat->get_courses(['recursive'=>true]);
            foreach($coursesinfo as $courseinfo) {
                $courses[] = array(
                    'value' => $courseinfo->id,
                    'label' => $courseinfo->fullname
                );
            }
        }

        // Get courses under 2025
        $cat = $DB->get_record('course_categories', array('idnumber' => '2025'));
        if ($cat) {
            $cat = \core_course_category::get($cat->id);
            $coursesinfo = $cat->get_courses(['recursive'=>true]);
            foreach($coursesinfo as $courseinfo) {
                $courses[] = array(
                    'value' => $courseinfo->id,
                    'label' => $courseinfo->fullname
                );
            }
        }

        if ($courses) {
            usort($courses, function($a, $b) {
                return strcmp($a['label'], $b['label']);
            });
        }

        return $courses;
    }


    public static function get_modules($courseid) {
        global $DB, $USER, $PAGE;

        $modules = array();

        $course = $DB->get_record('course', array('id' => $courseid));
        $modinfo = get_fast_modinfo($course);

        foreach ($modinfo->cms as $cm) {
            $modules[] = array(
                'value' => $cm->id,
                'label' => $cm->name,
                'url' => $cm->url->out(false),
            );
        }
        //var_export($modules); exit;
        return $modules;
    }


    public static function save_from_data($data) {
        global $DB, $USER;

        $data = (array) $data;

        $data['userid'] = $USER->id;
        $data['timecreated'] = time();
        $data['timemodified'] = time();

        $DB->insert_record('activities_assessments', (object) $data);

        return true;
    }



}