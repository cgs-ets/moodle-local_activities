<?php

namespace local_activities\api;

defined('MOODLE_INTERNAL') || die();

require_once(__DIR__.'/../lib/risks.lib.php');
require_once(__DIR__.'/../lib/risk_versions.lib.php');

use \local_activities\lib\risks_lib;
use \local_activities\lib\risk_versions_lib;

/**
 * Risks API trait
 */
trait risks_api {


    /**
     * Get published risk version and classifications.
     *
     * @return array
     */
    static public function get_published_ra() {
        $version = risk_versions_lib::get_published_version();
        $classifications = risk_versions_lib::get_classifications($version);
        return ['version' => $version, 'classifications' => $classifications];
    }

    /**
     * Save a risk assessment.
     *
     * @return object
     */
    static public function generate_ra($args) {
        return risks_lib::generate_ra((object) $args);
    }

    

}
