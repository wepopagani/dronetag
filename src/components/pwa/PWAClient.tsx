'use client';

/**
 * Mounts the service worker and the floating "Install app" prompt
 * plus the lightweight connectivity banner (STAGING-OPS-1).
 *
 *   • Registers `/sw.js` once on first paint (production only — dev mode
 *     skips registration to avoid stale chunks colliding with HMR).
 *   • Listens for the `beforeinstallprompt` event (Chromium / Edge) and
 *     surfaces an unobtrusive bottom-right button. Tapping it triggers
 *     the native install prompt; dismissal is remembered for 7 days via
 *     localStorage so we don't nag the user.
 *   • iOS Safari never fires `beforeinstallprompt`, so we sniff the
 *     UA + display-mode and show a one-shot "Add to Home Screen" hint
 *     pointing at the share sheet. Dismissed for 14 days once tapped.
 *   • A small toast confirms a successful install (`appinstalled`).
 *   • An "Offline" banner appears across the bottom when the browser
 *     reports offline and is replaced with a "Back online" toast that
 *     auto-dismisses after 3s on reconnect.
 *
 * All UI elements respect the iPhone home-indicator safe area via
 * `.safe-pb` so they never sit under the gesture pill.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { trackEvent } from '@/lib/analytics';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const DISMISS_KEY = 'dronetag.pwa.installDismissedAt';
const DISMISS_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const IOS_HINT_DISMISS_KEY = 'dronetag.pwa.iosHintDismissedAt';
const IOS_HINT_DISMISS_TTL_MS = 14 * 24 * 60 * 60 * 1000;

/** Read once on mount: are we already running in standalone mode? */
function detectInitialInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia?.('(display-mode: standalone)').matches) return true;
  // iOS Safari exposes a non-standard `navigator.standalone`.
  if ((navigator as Navigator & { standalone?: boolean }).standalone === true) return true;
  return false;
}

function detectInitialDismissed(): boolean {
  return readDismiss(DISMISS_KEY, DISMISS_TTL_MS);
}

function detectInitialIosHintDismissed(): boolean {
  return readDismiss(IOS_HINT_DISMISS_KEY, IOS_HINT_DISMISS_TTL_MS);
}

function readDismiss(key: string, ttl: number): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return false;
    const ts = parseInt(raw, 10);
    return Number.isFinite(ts) && Date.now() - ts < ttl;
  } catch {
    return false;
  }
}

function writeDismiss(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, String(Date.now()));
  } catch {
    /* Safari private mode → ignore. */
  }
}

/** True for iPhone / iPad Safari, including iPadOS which reports as MacIntel. */
function detectIosSafari(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const isIos = /iPad|iPhone|iPod/.test(ua)
    || (ua.includes('Mac') && 'ontouchend' in document);
  if (!isIos) return false;
  // Chrome on iOS (CriOS), Firefox (FxiOS), Edge (EdgiOS) all share the
  // restriction but they're separate browsers — only Safari proper renders
  // the share sheet that A2HS lives under, so we limit the hint to it.
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
  return isSafari;
}

/** Lazy initialiser: returns `navigator.onLine` once, defaulting to true. */
function detectInitialOnline(): boolean {
  if (typeof navigator === 'undefined') return true;
  return navigator.onLine;
}

export function PWAClient() {
  const { t } = useLanguage();

  // All derived-from-environment state uses lazy initialisers so we
  // avoid synchronous setState calls inside `useEffect` (React compiler
  // flags those as cascading renders).
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState<boolean>(detectInitialInstalled);
  const [dismissed, setDismissed] = useState<boolean>(detectInitialDismissed);
  const [iosHintDismissed, setIosHintDismissed] = useState<boolean>(detectInitialIosHintDismissed);
  const [isIosSafari] = useState<boolean>(detectIosSafari);

  // Connectivity state.
  const [online, setOnline] = useState<boolean>(detectInitialOnline);
  const [showReconnectToast, setShowReconnectToast] = useState<boolean>(false);
  const wasOffline = useRef<boolean>(!detectInitialOnline());

  // Install success toast (3s).
  const [showInstallToast, setShowInstallToast] = useState<boolean>(false);

  /* ── Service-worker registration (production only). ─────────────── */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (process.env.NODE_ENV !== 'production') return;
    if (!('serviceWorker' in navigator)) return;
    const onLoad = () => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .catch((err) => {
          console.warn('[pwa] sw registration failed', err);
        });
    };
    window.addEventListener('load', onLoad);
    return () => window.removeEventListener('load', onLoad);
  }, []);

  /* ── Install prompt management. ────────────────────────────────── */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (installed) return;

    function onBeforeInstall(e: Event) {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    }
    function onInstalled() {
      setInstalled(true);
      setDeferred(null);
      setShowInstallToast(true);
      trackEvent('pwa_installed');
      // Auto-dismiss the success toast.
      window.setTimeout(() => setShowInstallToast(false), 3000);
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, [installed]);

  /* ── Connectivity (navigator.onLine + /api/health probe). ─────── */
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let cancelled = false;

    async function probe(): Promise<boolean> {
      try {
        const res = await fetch('/api/health', {
          method: 'GET',
          cache: 'no-store',
          credentials: 'same-origin',
        });
        return res.ok;
      } catch {
        return false;
      }
    }

    async function refreshOnline() {
      const browserOnline = navigator.onLine;
      const serverReachable = browserOnline ? await probe() : false;
      const next = browserOnline && serverReachable;
      if (cancelled) return;
      setOnline(next);
      if (next && wasOffline.current) {
        setShowReconnectToast(true);
        window.setTimeout(() => setShowReconnectToast(false), 3000);
      }
      if (!next) wasOffline.current = true;
      else wasOffline.current = false;
    }

    function goOnline() {
      void refreshOnline();
    }
    function goOffline() {
      setOnline(false);
      wasOffline.current = true;
    }

    void refreshOnline();
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    const interval = window.setInterval(() => {
      void refreshOnline();
    }, 60_000);

    return () => {
      cancelled = true;
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
      window.clearInterval(interval);
    };
  }, []);

  const handleInstall = useCallback(() => {
    if (!deferred) return;
    void deferred.prompt();
    void deferred.userChoice.finally(() => {
      setDeferred(null);
    });
  }, [deferred]);

  const handleDismissInstall = useCallback(() => {
    writeDismiss(DISMISS_KEY);
    setDismissed(true);
  }, []);

  const handleDismissIosHint = useCallback(() => {
    writeDismiss(IOS_HINT_DISMISS_KEY);
    setIosHintDismissed(true);
  }, []);

  const showChromeInstall = !installed && !dismissed && deferred !== null;
  const showIosHint = !installed && !iosHintDismissed && isIosSafari && deferred === null;

  return (
    <>
      {/* ── Chrome / Edge install prompt ─────────────────────────── */}
      {showChromeInstall ? (
        <div
          className="pointer-events-auto safe-bottom-4 fixed right-4 z-[60] max-w-xs rounded-xl border border-gray-200 bg-white p-3 shadow-lg sm:safe-bottom-6 sm:right-6"
          role="region"
          aria-label={t('pwa.appName')}
        >
          <p className="text-sm font-medium text-gray-900">{t('pwa.appName')}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-gray-500">
            {t('pwa.appDescription')}
          </p>
          <div className="mt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleDismissInstall}
              className="tap-44 inline-flex items-center justify-center rounded-md px-2 py-1 text-xs font-medium text-gray-600 transition hover:bg-gray-100"
            >
              {t('pwa.install.dismiss')}
            </button>
            <button
              type="button"
              onClick={handleInstall}
              className="tap-44 inline-flex items-center justify-center rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800"
            >
              {t('pwa.install.cta')}
            </button>
          </div>
        </div>
      ) : null}

      {/* ── iOS Safari Add-to-Home-Screen tip ────────────────────── */}
      {showIosHint ? (
        <div
          className="pointer-events-auto safe-bottom-4 fixed left-4 right-4 z-[60] mx-auto max-w-md rounded-xl border border-gray-200 bg-white p-3 shadow-lg sm:safe-bottom-6"
          role="region"
          aria-label={t('pwa.iosHint.title')}
        >
          <div className="flex items-start gap-2.5">
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900">{t('pwa.iosHint.title')}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-gray-600">
                {t('pwa.iosHint.body')}
              </p>
            </div>
            <button
              type="button"
              onClick={handleDismissIosHint}
              className="tap-44 inline-flex items-center justify-center rounded-md px-2 text-xs font-medium text-gray-500 transition hover:bg-gray-100"
              aria-label={t('pwa.install.dismiss')}
            >
              {t('pwa.install.dismiss')}
            </button>
          </div>
        </div>
      ) : null}

      {/* ── Offline banner (persistent until reconnect) ──────────── */}
      {!online ? (
        <div
          className="safe-pb fixed bottom-0 left-0 right-0 z-[70] bg-amber-600 px-4 py-2 text-center text-xs font-semibold text-white shadow-[0_-2px_8px_rgba(0,0,0,0.08)]"
          role="status"
          aria-live="polite"
        >
          {t('pwa.offline.banner')}
        </div>
      ) : null}

      {/* ── Reconnect toast (3s) ─────────────────────────────────── */}
      {showReconnectToast ? (
        <div
          className="pointer-events-none safe-bottom-4 fixed left-1/2 z-[70] -translate-x-1/2 rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-lg"
          role="status"
          aria-live="polite"
        >
          {t('pwa.online.toast')}
        </div>
      ) : null}

      {/* ── Install success toast (3s) ───────────────────────────── */}
      {showInstallToast ? (
        <div
          className="pointer-events-none safe-bottom-4 fixed left-1/2 z-[70] -translate-x-1/2 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-lg"
          role="status"
          aria-live="polite"
        >
          {t('pwa.install.success')}
        </div>
      ) : null}
    </>
  );
}
