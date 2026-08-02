/**
 * GitHub Pages doesn't let us set real Cache-Control response headers, so
 * the <meta> cache tags in index.html are only advisory — a browser can
 * still serve a stale cached index.html/JS bundle after a new deploy,
 * silently pointing at hashed asset filenames the new build already
 * deleted (blank white screen until a hard reload). This checks a tiny
 * unhashed file with fetch's "no-store" mode, which — unlike page-level
 * navigation caching — really is always fetched fresh regardless of
 * server cache headers, and forces a real reload (via a cache-busted URL,
 * since a plain reload() is still subject to the same cache headers) if
 * it finds a newer build is live than the one currently running.
 */
export function checkForUpdate() {
  if (import.meta.env.DEV) return;

  fetch(`${import.meta.env.BASE_URL}build-id.txt`, { cache: 'no-store' })
    .then((res) => (res.ok ? res.text() : null))
    .then((latest) => {
      const latestId = latest && latest.trim();
      if (latestId && latestId !== __BUILD_ID__) {
        const url = new URL(window.location.href);
        url.searchParams.set('_v', latestId);
        window.location.replace(url.toString());
      }
    })
    .catch(() => {
      // Offline or blocked — don't prevent the app from loading over this.
    });
}
