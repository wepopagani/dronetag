'use client';

/**
 * Shared visual for every Next.js `error.tsx` boundary
 * (STAGING-OPS-1, requirement 6).
 *
 * Design goals:
 *   • One component — no per-section drift, no copy fragmentation.
 *   • User-safe by default: the stack trace is hidden in production
 *     and only the canonical "something went wrong" copy is shown.
 *   • Developer-friendly in dev: stack + digest collapsed by default,
 *     expandable with a single click; also mirrored to console.
 *   • Admin context: surface the Next.js `error.digest` (server log
 *     correlation id) prominently so the on-call can paste it into
 *     Firebase / Cloud Functions logs.
 *
 * No external observability (Sentry / Datadog / etc.) is wired here
 * — STAGING-OPS-1 explicitly defers that to PR-OBS-1. We only call
 * `console.error` so the browser DevTools log catches the failure.
 */

import { useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/Button';

export type ErrorPanelContext = 'account' | 'admin' | 'public' | 'global';

export interface ErrorPanelProps {
  /** The error caught by the Next.js `error.tsx` boundary. */
  error: Error & { digest?: string };
  /** Boundary-provided reset callback. */
  reset: () => void;
  /** Which surface this error happened on. Controls copy + actions. */
  context: ErrorPanelContext;
}

export function ErrorPanel({ error, reset, context }: ErrorPanelProps) {
  const { t } = useLanguage();
  const isDev = process.env.NODE_ENV !== 'production';

  useEffect(() => {
    // Always log to the browser console so DevTools picks it up. The
    // platform's broader observability story (PR-OBS-1) will replace
    // this with a structured client.
    console.error('[error-boundary]', { context, error, digest: error.digest });
  }, [context, error]);

  const body =
    context === 'public'
      ? t('error.boundary.publicBody')
      : context === 'admin'
        ? t('error.boundary.adminBody')
        : t('error.boundary.body');

  const homeHref = context === 'admin' ? '/admin' : context === 'public' ? '/' : '/account';
  const homeLabel =
    context === 'public' ? t('error.boundary.goPublic') : t('error.boundary.goHome');

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-12 text-center">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
        <svg
          className="h-7 w-7"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.6}
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
      </div>
      <h1 className="text-lg font-semibold text-gray-900">{t('error.boundary.title')}</h1>
      <p className="mt-2 text-sm leading-relaxed text-gray-600">{body}</p>

      <div className="mt-6 flex w-full flex-col items-stretch gap-2 sm:flex-row sm:justify-center">
        <Button onClick={reset} className="tap-44">{t('error.boundary.retry')}</Button>
        <Button href={homeHref} variant="secondary" className="tap-44">
          {homeLabel}
        </Button>
      </div>

      {(context === 'admin' || isDev) && (error.digest || isDev) ? (
        <details className="mt-6 w-full rounded-lg border border-gray-200 bg-gray-50/80 px-4 py-3 text-left text-xs">
          <summary className="cursor-pointer font-medium text-gray-700">
            {t('error.boundary.diagnostics')}
          </summary>
          {error.digest ? (
            <p className="mt-2 font-mono text-[11px] text-gray-600">
              <span className="font-semibold">{t('error.boundary.digest')}:</span> {error.digest}
            </p>
          ) : null}
          {isDev && error.stack ? (
            <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap text-[10px] leading-relaxed text-gray-500">
              {error.stack}
            </pre>
          ) : null}
        </details>
      ) : null}
    </div>
  );
}
