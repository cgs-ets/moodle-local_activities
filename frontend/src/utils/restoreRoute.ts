export const BASENAME = '/local/activities'

/**
 * The web server rewrites deep links to index.php?route=<path> (see web.config / .htaccess). That
 * rewrite is internal, so it is invisible to the browser - except after the SAML round trip, which
 * returns the browser to the rewritten URL rather than to the deep link. Restore the real path
 * before the router reads location, otherwise every deep link renders the dashboard.
 *
 * A no-op on a normal request, where `route` never reaches the address bar.
 */
export function restoreRewrittenRoute() {
  const url = new URL(window.location.href)
  const route = url.searchParams.get('route')
  if (route === null) {
    return
  }
  url.searchParams.delete('route')
  url.pathname = BASENAME + '/' + route.replace(/^\/+/, '')
  window.history.replaceState(null, '', url.pathname + url.search + url.hash)
}
