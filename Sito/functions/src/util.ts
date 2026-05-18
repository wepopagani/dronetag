/**
 * Shared helpers for DroneTag Cloud Functions.
 *
 * Built-in protections each call site should use:
 *   • requireAuth(request) — must be signed in.
 *   • requireAppCheck(request) — App Check token verified.
 *   • applyRateLimit(...) — per-uid / per-IP token bucket via Firestore.
 *   • cleanString(...) — normalises and length-caps strings.
 *
 * V-006 / V-035: App Check enforcement starts in MONITOR mode (just log
 * misses) and flips to enforce once the dashboard shows clean traffic.
 * `APP_CHECK_ENFORCE` env var controls the toggle without a redeploy.
 */

import * as logger from 'firebase-functions/logger';
import { HttpsError, type CallableRequest } from 'firebase-functions/v2/https';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const APP_CHECK_ENFORCE = (process.env.APP_CHECK_ENFORCE ?? 'true').toLowerCase() === 'true';

export interface AuthedContext {
  uid: string;
  email: string;
  admin: boolean;
}

export function requireAuth(req: CallableRequest): AuthedContext {
  const auth = req.auth;
  if (!auth?.uid) {
    throw new HttpsError('unauthenticated', 'Sign in required.');
  }
  return {
    uid: auth.uid,
    email: typeof auth.token.email === 'string' ? auth.token.email : '',
    admin: auth.token.admin === true,
  };
}

/**
 * Reject requests without a valid App Check token. In MONITOR mode
 * (APP_CHECK_ENFORCE=false), logs the miss instead of rejecting so we
 * can ship App Check init before forcing enforcement.
 */
export function requireAppCheck(req: CallableRequest, fnName: string): void {
  const ok = req.app != null;
  if (ok) return;
  if (APP_CHECK_ENFORCE) {
    throw new HttpsError('failed-precondition', 'App Check token missing.');
  }
  logger.warn('[appCheck monitor] missing token', { fn: fnName, uid: req.auth?.uid ?? null });
}

export function cleanString(v: unknown, max: number): string {
  if (typeof v !== 'string') return '';
  return v.trim().slice(0, max);
}

/**
 * Strict email validator (V-021). Drops anything that could pollute a
 * `mailto:` link with extra `?` / `&` parameters. The regex matches
 * the client-side `STRICT_EMAIL_RX` in `src/lib/utils/safeMailto.ts`
 * to keep server and client in sync.
 */
export function asEmail(v: unknown): string {
  const s = cleanString(v, 320);
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(s) ? s.toLowerCase() : '';
}

export function asUrl(v: unknown): string {
  const s = cleanString(v, 2000);
  return /^https?:\/\/[^\s]+$/i.test(s) ? s : '';
}

// ─── URL host allowlist (PR-SEC-3 V-019/V-020) ─────────────────────────────

const FIREBASE_STORAGE_HOSTS = [
  'firebasestorage.googleapis.com',
  'storage.googleapis.com',
];

function envTrustedHosts(): string[] {
  return (process.env.TRUSTED_PDF_HOSTS ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter((s) => /^[a-z0-9.-]+$/.test(s));
}

export function allowedFileHosts(): string[] {
  return [...FIREBASE_STORAGE_HOSTS, ...envTrustedHosts()];
}

/**
 * Strict URL validator for user-supplied file URLs. Behaviour:
 *   • Empty input → returns ''. Caller decides whether empty is OK.
 *   • Non-empty + invalid → throws HttpsError invalid-argument with the
 *     allowed host list, so the error reaches the user form intact.
 *   • Valid → returns the trimmed URL.
 *
 * Used by createCertificate / createDocument / createInsurance.
 */
export function sanitizeAllowedUrl(v: unknown, fieldName: string): string {
  const s = cleanString(v, 2000);
  if (!s) return '';
  let u: URL;
  try {
    u = new URL(s);
  } catch {
    throw new HttpsError('invalid-argument', `${fieldName} is not a valid URL`);
  }
  if (u.protocol !== 'https:') {
    throw new HttpsError('invalid-argument', `${fieldName} must use https://`);
  }
  const host = u.hostname.toLowerCase();
  const allow = allowedFileHosts();
  if (!allow.includes(host)) {
    throw new HttpsError(
      'invalid-argument',
      `${fieldName} host "${host}" is not allowed. Allowed hosts: ${allow.join(', ')}`,
    );
  }
  return s;
}

export function nowIso(): string {
  return new Date().toISOString();
}

// ─── Slot quota helper (V-004) ─────────────────────────────────────────────

export const MAX_OPERATORS_PER_USER = 3;

export type QuotaSlot = 'drone' | 'operator' | 'certificate' | 'pdf';

const QUOTA_COLLECTIONS: Record<QuotaSlot, string> = {
  drone: 'drones',
  operator: 'operators',
  certificate: 'certificates',
  pdf: 'documents',
};

const SLOT_DEFAULTS: Record<QuotaSlot, number> = {
  drone: 1,
  operator: 1,
  certificate: 1,
  pdf: 1,
};

/**
 * Reject the current operation if creating one more entity of the given
 * `kind` would exceed the user's quota. Slot caps live in `slots/{uid}`.
 *
 * For operators, we additionally apply a hard ceiling of MAX_OPERATORS_PER_USER
 * regardless of granted slots.
 */
export async function enforceQuota(uid: string, kind: QuotaSlot): Promise<void> {
  const db = getFirestore();
  const slotsSnap = await db.collection('slots').doc(uid).get();
  const slotsData = slotsSnap.exists ? (slotsSnap.data() as Record<string, unknown>) : {};
  const granted = typeof slotsData[kind] === 'number'
    ? (slotsData[kind] as number)
    : SLOT_DEFAULTS[kind];
  const cap = kind === 'operator' ? Math.min(granted, MAX_OPERATORS_PER_USER) : granted;

  const usageSnap = await db
    .collection(QUOTA_COLLECTIONS[kind])
    .where('userId', '==', uid)
    .count()
    .get();
  const used = usageSnap.data().count;

  if (used >= cap) {
    throw new HttpsError(
      'resource-exhausted',
      `Quota reached for ${kind}: ${used}/${cap}. Contact admin to add more slots.`,
    );
  }
}

// ─── Rate limit (V-006) ────────────────────────────────────────────────────

interface RateLimitOptions {
  bucket: string;
  /** Max requests per windowMs. */
  max: number;
  /** Window in milliseconds. */
  windowMs: number;
}

/**
 * Token-bucket rate limit backed by Firestore. Each (bucket, key) pair
 * has a doc that counts requests within the rolling window.
 *
 * NOTE: Firestore writes have a per-doc limit of 1 write/sec on
 * sustained traffic, so this is best-effort. For high-volume endpoints
 * (a public scraper hitting submitReport) we additionally rely on
 * App Check.
 */
export async function applyRateLimit(
  key: string,
  opts: RateLimitOptions,
): Promise<void> {
  const db = getFirestore();
  const docId = `${opts.bucket}:${key}`;
  const ref = db.collection('rateLimits').doc(docId);
  const now = Date.now();
  const windowStart = now - opts.windowMs;

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.exists ? (snap.data() as { hits?: number[] }) : {};
    const hits = (data.hits ?? []).filter((h) => h > windowStart);
    if (hits.length >= opts.max) {
      throw new HttpsError(
        'resource-exhausted',
        `Rate limit exceeded for ${opts.bucket}. Try again shortly.`,
      );
    }
    hits.push(now);
    tx.set(ref, { hits, updatedAt: FieldValue.serverTimestamp() });
  });
}
