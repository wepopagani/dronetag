/**
 * DroneTag minimal service worker.
 *
 * Caching strategy (PRD §8 — installable + offline shell only):
 *   - APP_SHELL_CACHE: `/`, manifest, icons, root HTML. Pre-cached on
 *     install. Network-first with shell fallback so updates roll in
 *     quickly while still working offline.
 *   - PUBLIC_PAGE_CACHE: only the LAST-VIEWED public drone page. The
 *     SW writes the response when a navigation to `/u/<slug>` succeeds,
 *     evicting any older `/u/...` entry. This way a scanned QR keeps
 *     working without network for the most recent page the user opened
 *     and we don't snowball into a full-offline dashboard cache.
 *
 * NOT cached (deliberately):
 *   - /account/*, /admin/*, /login, /signup — sensitive, must always
 *     hit the network so auth state is fresh.
 *   - Firestore / API requests — handled by Firebase SDK retry logic.
 */

const APP_SHELL_CACHE = 'dronetag-shell-v1';
const PUBLIC_PAGE_CACHE = 'dronetag-public-v1';
const SHELL_URLS = [
  '/',
  '/manifest.webmanifest',
  '/icon-192.png',
  '/icon-512.png',
  '/favicon.png',
  '/apple-touch-icon.png',
  '/logo.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(APP_SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== APP_SHELL_CACHE && k !== PUBLIC_PAGE_CACHE)
            .map((k) => caches.delete(k)),
        ),
      ),
      self.clients.claim(),
    ]),
  );
});

function isPublicDronePath(url) {
  return url.pathname.startsWith('/u/');
}

function isAppShellPath(url) {
  if (url.origin !== self.location.origin) return false;
  return SHELL_URLS.includes(url.pathname);
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  // Don't intercept non-http(s) or cross-origin requests other than
  // the same-origin ones we explicitly handle below. Firebase SDK
  // requests go to googleapis.com and should pass through unchanged.
  let url;
  try {
    url = new URL(req.url);
  } catch {
    return;
  }
  if (url.origin !== self.location.origin) return;

  // ── Public drone pages: keep ONLY the most recently viewed ──────
  if (isPublicDronePath(url) && req.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(req);
          if (response && response.ok) {
            const cache = await caches.open(PUBLIC_PAGE_CACHE);
            const existing = await cache.keys();
            await Promise.all(existing.map((k) => cache.delete(k)));
            await cache.put(req, response.clone());
          }
          return response;
        } catch {
          const cache = await caches.open(PUBLIC_PAGE_CACHE);
          const cached = await cache.match(req);
          if (cached) return cached;
          // No cached copy → render the offline shell so the QR scanner
          // at least sees something coherent.
          const shell = await caches.open(APP_SHELL_CACHE);
          const shellResp = await shell.match('/');
          if (shellResp) return shellResp;
          throw new Error('offline and no cache available');
        }
      })(),
    );
    return;
  }

  // ── App shell: cache-first with network refresh ──────────────────
  if (isAppShellPath(url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(APP_SHELL_CACHE);
        const cached = await cache.match(req);
        if (cached) {
          fetch(req)
            .then((response) => {
              if (response.ok) cache.put(req, response.clone());
            })
            .catch(() => undefined);
          return cached;
        }
        try {
          const response = await fetch(req);
          if (response.ok) cache.put(req, response.clone());
          return response;
        } catch {
          throw new Error('shell fetch failed and no cache');
        }
      })(),
    );
    return;
  }

  // Everything else: pass through.
});
