<?php

//const HOST = 'http://127.0.0.1:5133';
const HOST = 'http://localhost:5133';
const PLUGIN_DIR = '/local/activities';
const DIST_DIR = '/frontend/dist';

/**
 * Get the app favicon.
 *
 * @param string $entry
 * @return string
 */
function get_favicon(string $entry): string
{
    $activitiesconfig = get_config('local_activities');
    if (!empty($activitiesconfig->favicon)) {
        $favicon = $activitiesconfig->favicon;
    } else {
        // Default activities favicon.
        $manifest = getManifest();
        $src = isDev($entry)
            ? HOST . PLUGIN_DIR . "/frontend/" . $entry
            : (isset($manifest[$entry]) ? __DIR__ . DIST_DIR . '/' . $manifest[$entry]['file'] : '');

        if (!$src) {
            return '';
        }
        
        $img = file_get_contents($src);
        $data = base64_encode($img);
        $favicon = 'data:image/x-icon;base64,' . $data;
    }
    return $favicon;
}

/**
 * Get the app logo.
 *
 * @param string $entry
 * @return string
 */
function get_logo(string $entry): string
{
    $activitiesconfig = get_config('local_activities');
    if (!empty($activitiesconfig->logo)) {
        $logo = 'data:image/x-icon;base64,' . $activitiesconfig->logo;
    } else {
        // Default activities logo.
        $manifest = getManifest();
        $src = isDev($entry)
            ? HOST . PLUGIN_DIR . "/frontend/" . $entry
            : __DIR__ . DIST_DIR . '/' . $manifest[$entry]['file'];

        $img = file_get_contents($src);
        $data = base64_encode($img);
        $logo = 'data:image/x-icon;base64,' . $data;
    }
    return $logo;
}

/**
 * Prints all the html entries needed for Vite
 *
 * @param string $entry
 * @return string
 */
function bootstrap(string $entry): string
{
    $host = HOST;
    $base_dir = PLUGIN_DIR;
    $output = '';
    if (isDev($entry)) {
        $output .= <<<HTML
            <script type="module">
                import RefreshRuntime from "{$host}{$base_dir}/frontend/@react-refresh"
                RefreshRuntime.injectIntoGlobalHook(window)
                window.\$RefreshReg$ = () => {}
                window.\$RefreshSig$ = () => (type) => type
                window.__vite_plugin_react_preamble_installed__ = true
            </script>
            <script type="module" src="{$host}{$base_dir}/frontend/@vite/client"></script>
            <script type="module" src="{$host}{$base_dir}/frontend/src/main.tsx"></script>
        HTML;
    } else {
        $output .= "\n" . jsTag($entry)
        . "\n" . jsPreloadImports($entry)
        . "\n" . cssTag($entry);
    }

    return $output;
}


/**
 * Determine if dev or prod environment is loaded.
 *
 * @param string $entry
 * @return boolean
 */
function isDev(string $entry): bool
{
    // This method is very useful for the local server
    // if we try to access it, and by any means, didn't started Vite yet
    // it will fallback to load the production files from manifest
    // so you still navigate your site as you intended!
    static $exists = null;
    if ($exists !== null) {
        return $exists;
    }
    $handle = curl_init(HOST . '/' . $entry);
    curl_setopt($handle, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($handle, CURLOPT_NOBODY, true);

    curl_exec($handle);
    $error = curl_errno($handle);
    curl_close($handle);

    return $exists = !$error;
}


/**
 * Helper to print js tags
 *
 * @param string $entry
 * @return string
 */
function jsTag(string $entry): string
{
    $base_dir = PLUGIN_DIR;
    $url = isDev($entry)
        ? HOST . $base_dir . '/frontend/src/main.jsx'
        : assetUrl($entry);

    if (!$url) {
        return '';
    }

    $tag = '<script type="module" crossorigin src="' . $url . '"></script>';
    return $tag;
}

/**
 * Helper to print preloads
 *
 * @param string $entry
 * @return string
 */
function jsPreloadImports(string $entry): string
{
    if (isDev($entry)) {
        return '';
    }

    $res = '';
    foreach (importsUrls($entry) as $url) {
        $res .= '<link rel="modulepreload" href="'
            . $url
            . '">';
    }
    return $res;
}

/**
 * Helper to print css tags
 *
 * @param string $entry
 * @return string
 */
function cssTag(string $entry): string
{
    // not needed on dev, it's injected by Vite.
    if (isDev($entry)) {
        return '';
    }

    $tags = '';
    foreach (cssUrls($entry) as $url) {
        $tags .= '<link rel="stylesheet" href="'
            . $url
            . '">';
    }
    return $tags;
}


/**
 * Helpers to locate files.
 *
 * @return array
 */ 
function getManifest(): array
{
    $content = file_get_contents(__DIR__ . DIST_DIR . '/.vite/manifest.json');
    return json_decode($content, true);
}

function assetUrl(string $entry): string
{
    $manifest = getManifest();
    
    $base_dir = PLUGIN_DIR;

    $url = isset($manifest[$entry])
        ? $base_dir . DIST_DIR . '/' . $manifest[$entry]['file']
        : '';
        
    return $url;
}

function importsUrls(string $entry): array
{
    $urls = [];
    $manifest = getManifest();
    
    $base_dir = PLUGIN_DIR;

    if (!empty($manifest[$entry]['imports'])) {
        foreach ($manifest[$entry]['imports'] as $imports) {
            $urls[] = $base_dir . DIST_DIR . '/' . $manifest[$imports]['file'];
        }
    }
    return $urls;
}

function cssUrls(string $entry): array
{
    $urls = [];
    $manifest = getManifest();
    
    $base_dir = PLUGIN_DIR;

    if (!empty($manifest[$entry]['css'])) {
        foreach ($manifest[$entry]['css'] as $file) {
            $urls[] = $base_dir . DIST_DIR . '/' . $file;
        }
    }
    return $urls;
}

/**
 * Get the URL originally requested by the browser.
 *
 * The web server rewrites every SPA route to index.php (see web.config / .htaccess), and IIS does
 * not preserve the original path in REQUEST_URI - which is how deep links used to collapse to the
 * dashboard after the SSO round trip. The rewrite therefore hands the path over in "route".
 *
 * @return moodle_url The URL the browser actually asked for, always inside this plugin.
 */
function activities_request_url(): moodle_url
{
    // The caller's own query string, minus the routing parameter the rewrite added.
    $params = $_GET;
    unset($params['route']);

    $route = ltrim(clean_param($_GET['route'] ?? '', PARAM_PATH), '/');
    // Tolerate a rewrite that hands over the full path rather than one relative to the plugin.
    $prefix = ltrim(PLUGIN_DIR, '/') . '/';
    if (strpos($route, $prefix) === 0) {
        $route = substr($route, strlen($prefix));
    }

    if ($route === '') {
        // No rewrite involved: a direct hit on index.php, or on the directory itself.
        $path = parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH) ?: PLUGIN_DIR . '/';
        return new moodle_url($path, $params);
    }

    return new moodle_url(PLUGIN_DIR . '/' . $route, $params);
}

/**
 * Is this a request for the public, unauthenticated view?
 *
 * @param moodle_url $url As returned by activities_request_url().
 * @return bool
 */
function activities_is_public_url(moodle_url $url): bool
{
    $path = $url->get_path();
    $base = PLUGIN_DIR . '/public';
    return $path === $base || strpos($path, $base . '/') === 0;
}
