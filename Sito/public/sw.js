/**
 * Legacy service worker — PWA disabled.
 * Replaces the old installable shell: clears caches and unregisters itself
 * so browsers stop serving cached logo.png / favicons from v1.
 */
self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .then(() => self.registration.unregister()),
  );
});
