/**
 * Analytics abstraction (PR-SEC-4).
 *
 * Goals:
 *   1. Vendor-neutral. The default `ConsoleAnalyticsClient` only logs to
 *      the console in development; production swaps in PostHog / GA /
 *      Mixpanel via `setAnalyticsClient(...)` from a single bootstrap
 *      module. No business code should ever import a vendor SDK.
 *
 *   2. Privacy-first. The event allow-list is closed (compile-time
 *      union) and props are restricted to safe primitives. The default
 *      sanitiser strips obvious PII (uid, email, phone) so callers
 *      can't accidentally leak it through.
 *
 *   3. Defensive. Tracking failures must never break the UX — every
 *      call is wrapped in try/catch and silently ignored.
 *
 * Wiring points (kept lean — high-signal lifecycle events only):
 *   • qr_page_opened            — public drone card finished mounting
 *   • report_submitted          — finder pressed "Send report" successfully
 *   • pwa_installed             — beforeinstallprompt accepted
 *   • login                     — interactive sign-in succeeded
 *   • signup                    — interactive sign-up succeeded
 *   • drone_created             — owner finished createDrone
 *   • operator_override_activated — owner activated a 24h temporary operator
 */

export type AnalyticsEvent =
  | 'qr_page_opened'
  | 'report_submitted'
  | 'pwa_installed'
  | 'login'
  | 'signup'
  | 'drone_created'
  | 'operator_override_activated';

/** Allowed prop value types — keep PII-free. */
type Primitive = string | number | boolean;

export type AnalyticsProps = Record<string, Primitive>;

export interface AnalyticsClient {
  track(event: AnalyticsEvent, props?: AnalyticsProps): void;
  /** Optional, vendor-specific. Default: no-op. */
  identify?(uid: string): void;
  /** Optional, vendor-specific. Default: no-op. */
  reset?(): void;
}

const PII_KEYS = new Set(['uid', 'userId', 'ownerUserId', 'email', 'phone', 'address']);

/** Strips suspected PII keys from props before they reach the wire. */
function sanitize(props: AnalyticsProps | undefined): AnalyticsProps {
  if (!props) return {};
  const out: AnalyticsProps = {};
  for (const [k, v] of Object.entries(props)) {
    if (PII_KEYS.has(k)) continue;
    if (typeof v === 'string' && v.length > 200) continue;
    out[k] = v;
  }
  return out;
}

class ConsoleAnalyticsClient implements AnalyticsClient {
  track(event: AnalyticsEvent, props?: AnalyticsProps): void {
    if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') return;
    console.info('[analytics]', event, sanitize(props));
  }
}

/**
 * No-op client used when the operator doesn't want any logs in
 * production. Set explicitly via `setAnalyticsClient(noopAnalyticsClient)`.
 */
export const noopAnalyticsClient: AnalyticsClient = {
  track: () => undefined,
};

let activeClient: AnalyticsClient = new ConsoleAnalyticsClient();

/**
 * Replace the active analytics client. Called once from the bootstrap
 * code that integrates the chosen vendor (e.g. a PostHog provider in
 * src/contexts/, gated by an env-flag).
 */
export function setAnalyticsClient(next: AnalyticsClient): void {
  activeClient = next;
}

/**
 * Fire-and-forget tracking helper. Sanitises props, swallows errors,
 * and never blocks the calling thread.
 */
export function trackEvent(event: AnalyticsEvent, props?: AnalyticsProps): void {
  try {
    activeClient.track(event, sanitize(props));
  } catch (err) {
    // Never break a feature on a tracking glitch.
    console.warn('[analytics] track failed', err);
  }
}

export function identify(uid: string): void {
  try {
    activeClient.identify?.(uid);
  } catch (err) {
    console.warn('[analytics] identify failed', err);
  }
}

export function resetAnalytics(): void {
  try {
    activeClient.reset?.();
  } catch (err) {
    console.warn('[analytics] reset failed', err);
  }
}
