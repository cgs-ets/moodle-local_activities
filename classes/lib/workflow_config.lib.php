<?php

namespace local_activities\lib;

defined('MOODLE_INTERNAL') || die();

require_once($CFG->dirroot . '/local/activities/config.php');
require_once(__DIR__.'/utils.lib.php');

use \local_activities\lib\utils_lib;

/**
 * Reads and writes the approvers of workflow steps in config.php.
 *
 * Only the 'approvers' array of a step is ever rewritten. Everything else in config.php
 * (comments, step names, prerequisites, invalidated_on_edit, ...) is left byte-for-byte intact.
 * A copy of the current config.php is saved to configs/config.php.bak.N before each write.
 */
class workflow_config_lib {

    const GROUPS = array(
        'senior' => 'Senior School',
        'primary' => 'Primary School',
        'whole' => 'Whole School',
        'commercial' => 'Commercial',
        'cocurr' => 'Co-curricular',
    );

    /** Path to the live config file. */
    private static function config_path() {
        return realpath(__DIR__ . '/../../config.php');
    }

    /** Path to the backups folder. */
    private static function backup_dir() {
        return dirname(static::config_path()) . '/configs';
    }

    /**
     * Get the workflow steps and their approvers for the settings screen.
     *
     * @return array
     */
    public static function get_config() {
        $path = static::config_path();
        return static::export(\local_activities\local_activities_config::WORKFLOW, sha1_file($path));
    }

    /**
     * Shape a WORKFLOW array for the frontend.
     *
     * @param array $workflow
     * @param string $hash sha1 of config.php the workflow was read from.
     * @return array
     */
    private static function export($workflow, $hash) {
        $path = static::config_path();
        $dir = static::backup_dir();
        $steps = array();
        foreach ($workflow as $key => $step) {
            $prefix = explode('_', $key)[0];
            $approvers = array();
            foreach (($step['approvers'] ?? array()) as $akey => $approver) {
                $username = (string) ($approver['username'] ?? $akey);
                $user = utils_lib::user_stub($username);
                $approvers[] = array(
                    'username' => $username,
                    'fn' => $user ? $user->fn : '',
                    'ln' => $user ? $user->ln : '',
                    'silent' => !empty($approver['silent']),
                    'exists' => !empty($user),
                );
            }
            $steps[] = array(
                'key' => $key,
                'name' => $step['name'] ?? $key,
                'group' => static::GROUPS[$prefix] ?? 'Other',
                'fromsqlproc' => !empty($step['fromsqlproc']),
                'approvers' => $approvers,
            );
        }
        return array(
            'hash' => $hash,
            'writable' => is_writable($path) && (is_dir($dir) ? is_writable($dir) : is_writable(dirname($path))),
            'steps' => $steps,
        );
    }

    /**
     * Save the approver lists for one or more steps back to config.php.
     *
     * @param string $hash sha1 of config.php when the client loaded it.
     * @param array $steps stepkey => list of ['username' => string, 'silent' => bool]
     * @return array the new config, as get_config().
     */
    public static function save_approvers($hash, $steps) {
        global $DB, $USER;

        if (!is_string($hash) || !is_array($steps) || empty($steps)) {
            throw new \Exception('Malformed request.');
        }

        $path = static::config_path();
        if (!$path || !is_writable($path)) {
            throw new \Exception('config.php is not writable by the web server.');
        }
        $dir = static::ensure_backup_dir();

        $lock = fopen($dir . '/.lock', 'c');
        if (!$lock || !flock($lock, LOCK_EX)) {
            throw new \Exception('Could not lock workflow config.');
        }

        try {
            $source = file_get_contents($path);
            if ($source === false) {
                throw new \Exception('Could not read config.php.');
            }
            if (sha1($source) !== $hash) {
                throw new \Exception('The workflow config was changed by someone else. Reload the page and try again.');
            }

            // The truth is the file on disk, not the class constant loaded at request start.
            $current = static::load_workflow($source, $dir);

            $expected = $current;
            $summary = array();
            $changelog = array();
            $newsource = $source;
            foreach ($steps as $stepkey => $list) {
                $stepkey = (string) $stepkey;
                [$approvers, $changes] = static::merge_step($current, $stepkey, $list);
                if (!$changes) {
                    continue;
                }
                $expected[$stepkey]['approvers'] = $approvers;
                $newsource = static::splice_approvers($newsource, $stepkey, $approvers);
                $summary[] = $stepkey . ' [' . implode(', ', $changes) . ']';
                $changelog[$stepkey] = $changes;
            }

            if (empty($summary)) {
                return static::export($current, $hash);
            }

            // Verify the new source parses and produces exactly the intended array.
            try {
                token_get_all($newsource, TOKEN_PARSE);
            } catch (\ParseError $e) {
                throw new \Exception('Generated config.php is invalid: ' . $e->getMessage());
            }
            $actual = static::load_workflow($newsource, $dir);
            if ($actual !== $expected) {
                throw new \Exception('Generated config.php did not match the intended changes. Nothing was written.');
            }

            // Backup, then write.
            $backup = $dir . '/config.php.bak.' . static::next_backup_number($dir);
            if (!copy($path, $backup)) {
                throw new \Exception('Could not write backup ' . basename($backup) . '. Nothing was written.');
            }
            if (file_put_contents($path, $newsource, LOCK_EX) === false) {
                throw new \Exception('Could not write config.php. Backup saved as ' . basename($backup) . '.');
            }
            if (function_exists('opcache_invalidate')) {
                opcache_invalidate($path, true);
            }

            error_log('[local_activities] workflow config updated by ' . $USER->username
                . ' (backup ' . basename($backup) . '): ' . implode('; ', $summary));

            // Audit record. Written only after config.php has changed. A failure here must not
            // report the save as failed, because the file has already been written.
            try {
                $DB->insert_record('activities_logs', (object) array(
                    'activityid' => 0, // 0 = not tied to an activity.
                    'action' => 'workflow_config_updated',
                    'timecreated' => time(),
                    'datajson' => json_encode(array(
                        'userid' => (int) $USER->id,
                        'username' => $USER->username,
                        'fullname' => fullname($USER),
                        'backup' => basename($backup), // Diff against config.php for the exact before/after.
                        'changes' => $changelog, // stepkey => [change, ...]
                    )),
                ));
            } catch (\Throwable $e) {
                error_log('[local_activities] workflow config audit log insert failed: ' . $e->getMessage());
            }

            return static::export($actual, sha1($newsource));
        } finally {
            flock($lock, LOCK_UN);
            fclose($lock);
        }
    }

    /**
     * Validate a submitted approver list for a step and merge it with the existing entries.
     *
     * @return array [approvers array keyed by username, list of human-readable changes]
     */
    private static function merge_step($current, $stepkey, $list) {
        if (!isset($current[$stepkey])) {
            throw new \Exception("Unknown workflow step '$stepkey'.");
        }
        $step = $current[$stepkey];
        if (!empty($step['fromsqlproc'])) {
            throw new \Exception("Approvers for '$stepkey' come from the SIS and cannot be edited here.");
        }
        if (!array_key_exists('approvers', $step) || !is_array($step['approvers'])) {
            throw new \Exception("Step '$stepkey' has no approvers list.");
        }
        if (!is_array($list) || empty($list)) {
            throw new \Exception("Step '$stepkey' must have at least one approver.");
        }

        // Index existing entries by username.
        $existing = array();
        foreach ($step['approvers'] as $akey => $entry) {
            $existing[(string) ($entry['username'] ?? $akey)] = $entry;
        }

        $approvers = array();
        $changes = array();
        foreach ($list as $item) {
            if (!is_array($item) || !isset($item['username']) || !is_scalar($item['username'])) {
                throw new \Exception('Malformed approver.');
            }
            $username = (string) $item['username'];
            $silent = !empty($item['silent']);
            if ($username === '' || clean_param($username, PARAM_USERNAME) !== $username) {
                throw new \Exception("Invalid username '" . s($username) . "'.");
            }
            if (isset($approvers[$username])) {
                throw new \Exception("'$username' is listed twice in '$stepkey'.");
            }

            if (isset($existing[$username])) {
                $entry = $existing[$username];
                $wassilent = !empty($entry['silent']);
                unset($entry['silent']);
                if ($silent) {
                    $entry['silent'] = true;
                }
                if ($wassilent !== $silent) {
                    $changes[] = ($silent ? 'silenced ' : 'unsilenced ') . $username;
                }
            } else {
                if (!\core_user::get_user_by_username($username)) {
                    throw new \Exception("User '$username' does not exist.");
                }
                $entry = array('username' => $username, 'contacts' => null);
                if ($silent) {
                    $entry['silent'] = true;
                }
                $changes[] = 'added ' . $username . ($silent ? ' (silent)' : '');
            }
            $approvers[$username] = $entry;
        }

        foreach (array_keys($existing) as $username) {
            if (!isset($approvers[$username])) {
                $changes[] = 'removed ' . $username;
            }
        }

        // Re-keying (e.g. a numerically keyed entry) or reordering is still a change to write.
        if (!$changes && array_keys($step['approvers']) !== array_keys($approvers)) {
            $changes[] = 'normalised keys';
        }

        return array($approvers, $changes);
    }

    /**
     * Replace the 'approvers' array of one step in the config source.
     */
    private static function splice_approvers($source, $stepkey, $approvers) {
        $tokens = token_get_all($source);

        // Byte offset of every token.
        $offsets = array();
        $pos = 0;
        foreach ($tokens as $i => $t) {
            $offsets[$i] = $pos;
            $pos += strlen(is_array($t) ? $t[1] : $t);
        }
        $text = function($i) use ($tokens) {
            return is_array($tokens[$i]) ? $tokens[$i][1] : $tokens[$i];
        };
        $id = function($i) use ($tokens) {
            return ($i !== null && is_array($tokens[$i])) ? $tokens[$i][0] : null;
        };
        $count = count($tokens);
        $next = function($i) use ($count, $id) {
            for ($i++; $i < $count; $i++) {
                if (!in_array($id($i), array(T_WHITESPACE, T_COMMENT, T_DOC_COMMENT), true)) {
                    return $i;
                }
            }
            return null;
        };
        // Given the index of an array value start (T_ARRAY or '['), return [open bracket idx, close bracket idx].
        $arrayspan = function($i) use ($next, $text, $count) {
            $open = $text($i) === '[' ? $i : $next($i);
            if ($open === null || !in_array($text($open), array('(', '['), true)) {
                return null;
            }
            $depth = 0;
            for ($j = $open; $j < $count; $j++) {
                $c = $text($j);
                if ($c === '(' || $c === '[' || $c === '{') {
                    $depth++;
                } else if ($c === ')' || $c === ']' || $c === '}') {
                    $depth--;
                    if ($depth === 0) {
                        return array($open, $j);
                    }
                }
            }
            return null;
        };
        $isarraystart = function($i) use ($id, $text) {
            return $i !== null && ($id($i) === T_ARRAY || $text($i) === '[');
        };
        $isstring = function($i, $value) use ($id, $text) {
            return $id($i) === T_CONSTANT_ENCAPSED_STRING && substr($text($i), 1, -1) === $value;
        };

        // Locate: const WORKFLOW = array(
        $wfspan = null;
        for ($i = 0; $i < $count; $i++) {
            if ($id($i) === T_CONST) {
                $n = $next($i);
                if ($n !== null && $text($n) === 'WORKFLOW') {
                    $eq = $next($n);
                    $val = $eq !== null ? $next($eq) : null;
                    if ($isarraystart($val)) {
                        $wfspan = $arrayspan($val);
                    }
                    break;
                }
            }
        }
        if (!$wfspan) {
            throw new \Exception('Could not find WORKFLOW in config.php.');
        }

        // Find the step key at the top level of WORKFLOW.
        $stepspan = null;
        $depth = 0;
        for ($i = $wfspan[0] + 1; $i < $wfspan[1]; $i++) {
            $c = $text($i);
            if ($c === '(' || $c === '[' || $c === '{') { $depth++; continue; }
            if ($c === ')' || $c === ']' || $c === '}') { $depth--; continue; }
            if ($depth === 0 && $isstring($i, $stepkey)) {
                $arrow = $next($i);
                $val = $arrow !== null ? $next($arrow) : null;
                if ($id($arrow) === T_DOUBLE_ARROW && $isarraystart($val)) {
                    $stepspan = $arrayspan($val);
                    break;
                }
            }
        }
        if (!$stepspan) {
            throw new \Exception("Could not find step '$stepkey' in config.php.");
        }

        // Find 'approvers' => array(...) at the top level of the step.
        $start = $end = null;
        $depth = 0;
        for ($i = $stepspan[0] + 1; $i < $stepspan[1]; $i++) {
            $c = $text($i);
            if ($c === '(' || $c === '[' || $c === '{') { $depth++; continue; }
            if ($c === ')' || $c === ']' || $c === '}') { $depth--; continue; }
            if ($depth === 0 && $isstring($i, 'approvers')) {
                $arrow = $next($i);
                $val = $arrow !== null ? $next($arrow) : null;
                if ($id($arrow) === T_DOUBLE_ARROW && $isarraystart($val)) {
                    $span = $arrayspan($val);
                    if ($span) {
                        $start = $offsets[$val];
                        $end = $offsets[$span[1]] + strlen($text($span[1]));
                        $keyoffset = $offsets[$i];
                    }
                    break;
                }
            }
        }
        if ($start === null) {
            throw new \Exception("Could not find the approvers of '$stepkey' in config.php.");
        }

        // Indentation of the line holding 'approvers'.
        $linestart = strrpos(substr($source, 0, $keyoffset), "\n");
        $linestart = $linestart === false ? 0 : $linestart + 1;
        $indent = substr($source, $linestart, $keyoffset - $linestart);
        if (trim($indent) !== '') {
            $indent = preg_replace('/\S.*/', '', $indent);
        }

        return substr($source, 0, $start) . static::render($approvers, $indent) . substr($source, $end);
    }

    /**
     * Render a value as PHP source, arrays in the multi-line array(...) style used by config.php.
     */
    private static function render($value, $indent) {
        if (is_array($value)) {
            if (empty($value)) {
                return 'array()';
            }
            $inner = $indent . '    ';
            $islist = array_is_list($value);
            $out = "array(\n";
            foreach ($value as $k => $v) {
                $out .= $inner . ($islist ? '' : var_export((string) $k, true) . ' => ')
                    . static::render($v, $inner) . ",\n";
            }
            return $out . $indent . ')';
        }
        if ($value === null) {
            return 'null';
        }
        if (is_bool($value)) {
            return $value ? 'true' : 'false';
        }
        return var_export($value, true);
    }

    /**
     * Evaluate a config.php source and return its WORKFLOW array, without touching the loaded class.
     */
    private static function load_workflow($source, $dir) {
        $classname = 'local_activities_config_verify_' . bin2hex(random_bytes(8));
        $renamed = preg_replace('/\bclass\s+local_activities_config\b/', 'class ' . $classname, $source, 1, $replaced);
        if (!$replaced) {
            throw new \Exception('Could not find class local_activities_config in config.php.');
        }
        $tmp = $dir . '/' . $classname . '.tmp';
        if (file_put_contents($tmp, $renamed) === false) {
            throw new \Exception('Could not write to the configs folder.');
        }
        try {
            include($tmp);
        } finally {
            @unlink($tmp);
        }
        $fqcn = '\\local_activities\\' . $classname;
        if (!class_exists($fqcn, false)) {
            throw new \Exception('Could not load config.php for verification.');
        }
        return constant($fqcn . '::WORKFLOW');
    }

    /**
     * Create the backups folder if needed, protected from web access.
     *
     * @return string the folder path.
     */
    private static function ensure_backup_dir() {
        $dir = static::backup_dir();
        if (!is_dir($dir) && !@mkdir($dir, 0770)) {
            throw new \Exception('Could not create the configs backup folder. Create ' . $dir . ' and make it writable by the web server.');
        }
        if (!is_writable($dir)) {
            throw new \Exception('The configs backup folder is not writable by the web server.');
        }
        if (!file_exists($dir . '/.htaccess')) {
            file_put_contents($dir . '/.htaccess', "<IfModule mod_authz_core.c>\n    Require all denied\n</IfModule>\n<IfModule !mod_authz_core.c>\n    Deny from all\n</IfModule>\n");
        }
        if (!file_exists($dir . '/web.config')) {
            file_put_contents($dir . '/web.config', '<?xml version="1.0" encoding="UTF-8"?>' . "\n"
                . "<configuration>\n  <system.webServer>\n    <security>\n      <authorization>\n"
                . "        <remove users=\"*\" roles=\"\" verbs=\"\" />\n"
                . "        <add accessType=\"Deny\" users=\"*\" />\n"
                . "      </authorization>\n    </security>\n  </system.webServer>\n</configuration>\n");
        }
        return $dir;
    }

    /**
     * The next N for configs/config.php.bak.N.
     */
    private static function next_backup_number($dir) {
        $max = 0;
        foreach (glob($dir . '/config.php.bak.*') ?: array() as $file) {
            if (preg_match('/\.bak\.(\d+)$/', $file, $m)) {
                $max = max($max, (int) $m[1]);
            }
        }
        return $max + 1;
    }
}
