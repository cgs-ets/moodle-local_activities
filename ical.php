<?php
/**
 * Public iCal feed endpoint for CGS Calendar.
 * 
 * This endpoint serves a cached iCal file containing public calendar events.
 * Rate limiting is applied to prevent abuse.
 *
 * @package   local_activities
 * @copyright 2024 Michael Vangelovski
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require(__DIR__.'/../../config.php');
require_once(__DIR__.'/classes/lib/activities.lib.php');

// Rate limiting configuration
define('ICAL_RATE_LIMIT_REQUESTS', 60); // Maximum requests per window
define('ICAL_RATE_LIMIT_WINDOW', 3600); // Time window in seconds (1 hour)

// Get client IP address
function get_client_ip() {
    $ipkeys = ['HTTP_CLIENT_IP', 'HTTP_X_FORWARDED_FOR', 'REMOTE_ADDR'];
    foreach ($ipkeys as $keyword) {
        if (array_key_exists($keyword, $_SERVER) && !empty($_SERVER[$keyword])) {
            $ip = $_SERVER[$keyword];
            if (strpos($ip, ',') !== false) {
                $ip = explode(',', $ip)[0];
            }
            $ip = trim($ip);
            if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                return $ip;
            }
        }
    }
    return isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : '0.0.0.0';
}

// Simple rate limiting using file-based cache
function check_rate_limit($ip) {
    global $CFG;
    
    $ip_hash = md5($ip);
    $now = time();
    $cache_dir = $CFG->dataroot . '/cache/local_activities_ical';
    
    // Ensure cache directory exists
    if (!is_dir($cache_dir)) {
        @mkdir($cache_dir, 0777, true);
    }
    
    $cache_file = $cache_dir . '/' . $ip_hash . '.json';
    
    // Clean up old cache files (older than the rate limit window)
    if (is_dir($cache_dir)) {
        $files = glob($cache_dir . '/*.json');
        foreach ($files as $file) {
            if (filemtime($file) < ($now - ICAL_RATE_LIMIT_WINDOW)) {
                @unlink($file);
            }
        }
    }
    
    // Read existing data
    $data = null;
    if (file_exists($cache_file)) {
        $content = @file_get_contents($cache_file);
        if ($content !== false) {
            $data = json_decode($content, true);
        }
    }
    
    if (!$data || !isset($data['window_start'])) {
        // First request from this IP
        $data = ['count' => 1, 'window_start' => $now];
        @file_put_contents($cache_file, json_encode($data), LOCK_EX);
        return true;
    }
    
    // Check if we're still in the same time window
    if (($now - $data['window_start']) < ICAL_RATE_LIMIT_WINDOW) {
        // Still in the same window
        if ($data['count'] >= ICAL_RATE_LIMIT_REQUESTS) {
            // Rate limit exceeded
            return false;
        }
        // Increment count
        $data['count']++;
        @file_put_contents($cache_file, json_encode($data), LOCK_EX);
        return true;
    } else {
        // New time window, reset
        $data = ['count' => 1, 'window_start' => $now];
        @file_put_contents($cache_file, json_encode($data), LOCK_EX);
        return true;
    }
}

// Check rate limit
$client_ip = get_client_ip();
if (!check_rate_limit($client_ip)) {
    http_response_code(429); // Too Many Requests
    header('Content-Type: text/plain');
    header('Retry-After: ' . ICAL_RATE_LIMIT_WINDOW);
    echo "Rate limit exceeded. Please try again later.";
    exit;
}

// Get cached iCal content from database
global $DB;

try {
    $ical_record = $DB->get_record('activities_ical_cache', ['id' => 1]);
    
    if (!$ical_record || empty($ical_record->icalcontent)) {
        // No cached content available yet (cron hasn't run)
        http_response_code(503); // Service Unavailable
        header('Content-Type: text/plain');
        echo "Calendar feed is not available yet. Please try again later.";
        exit;
    }
    
    $ical_content = $ical_record->icalcontent;
    
    // Set appropriate headers for iCal file
    header('Content-Type: text/calendar; charset=utf-8');
    header('Content-Disposition: inline; filename="cgs-calendar.ics"');
    header('Cache-Control: public, max-age=3600'); // Cache for 1 hour
    header('Expires: ' . gmdate('D, d M Y H:i:s', time() + 3600) . ' GMT');
    header('Last-Modified: ' . gmdate('D, d M Y H:i:s', $ical_record->timemodified) . ' GMT');
    header('ETag: "' . md5($ical_content) . '"');
    
    // Output the iCal content
    echo $ical_content;
    
} catch (\Exception $e) {
    // Log error but don't expose details to public
    error_log("Error serving iCal feed: " . $e->getMessage());
    http_response_code(500);
    header('Content-Type: text/plain');
    echo "An error occurred while generating the calendar feed.";
    exit;
}
