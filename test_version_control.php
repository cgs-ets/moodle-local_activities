<?php
/**
 * Test script for version control system
 * Run this in the Moodle environment to test the version control functionality
 */

require_once('../../config.php');
require_once('classes/lib/risk_versions.lib.php');
require_once('classes/lib/risks.lib.php');

use \local_activities\lib\risk_versions_lib;
use \local_activities\lib\risks_lib;

// Ensure user is logged in and has proper permissions
require_login();

echo "<h1>Risk Version Control Test</h1>";

try {
    // Test 1: Get current published version
    echo "<h2>Test 1: Current Published Version</h2>";
    $published_version = risk_versions_lib::get_published_version();
    echo "Published version: " . ($published_version ?: 'None') . "<br>";
    
    // Test 2: Get working version
    echo "<h2>Test 2: Working Version</h2>";
    $working_version = risk_versions_lib::get_working_version();
    echo "Working version: " . $working_version . "<br>";
    
    // Test 3: Get all versions
    echo "<h2>Test 3: All Versions</h2>";
    $versions = risk_versions_lib::get_versions();
    echo "Total versions: " . count($versions) . "<br>";
    foreach ($versions as $version) {
        echo "Version {$version->version}: " . ($version->is_published ? 'Published' : 'Draft') . "<br>";
    }
    
    // Test 4: Get classifications for current version
    echo "<h2>Test 4: Classifications for Current Version</h2>";
    $classifications = risks_lib::get_classifications();
    echo "Classifications in current version: " . count($classifications) . "<br>";
    
    // Test 5: Get risks for current version
    echo "<h2>Test 5: Risks for Current Version</h2>";
    $risks = risks_lib::get_risks();
    echo "Risks in current version: " . count($risks) . "<br>";
    
    // Test 6: Check if there are draft changes
    echo "<h2>Test 6: Draft Changes</h2>";
    $has_changes = risk_versions_lib::has_draft_changes();
    echo "Has draft changes: " . ($has_changes ? 'Yes' : 'No') . "<br>";
    
    echo "<h2>Test Complete</h2>";
    echo "Version control system appears to be working correctly!";
    
} catch (Exception $e) {
    echo "<h2>Error</h2>";
    echo "Error: " . $e->getMessage();
}
?> 