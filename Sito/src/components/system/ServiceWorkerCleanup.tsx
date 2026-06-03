'use client';

import { useEffect } from 'react';

/**
 * PWA was removed; unregister any legacy service worker and drop stale
 * shell caches (old logo.png, favicons, etc.).
 */
export function ServiceWorkerCleanup() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    void (async () => {
      try {
        if ('caches' in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map((k) => caches.delete(k)));
        }
        if ('serviceWorker' in navigator) {
          const regs = await navigator.serviceWorker.getRegistrations();
          await Promise.all(regs.map((r) => r.unregister()));
        }
      } catch {
        // non-fatal
      }
    })();
  }, []);

  return null;
}
