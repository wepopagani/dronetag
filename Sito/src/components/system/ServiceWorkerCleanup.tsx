'use client';

/**
 * Dev-only helper: unregister stale service workers so Next.js HMR
 * and fresh deploys aren't masked by an old PWA shell.
 */
import { useEffect } from 'react';

export function ServiceWorkerCleanup() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

    void navigator.serviceWorker.getRegistrations().then((regs) => {
      for (const reg of regs) {
        void reg.unregister();
      }
    });
  }, []);

  return null;
}
