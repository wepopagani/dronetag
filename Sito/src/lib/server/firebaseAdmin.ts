/**
 * Server-only Firebase Admin SDK accessor.
 *
 * Idempotent — safe to import from any server-side module (proxy.ts,
 * /api/* routes, scripts). The service-account credentials come from
 * either:
 *
 *   • FIREBASE_SERVICE_ACCOUNT_KEY  — full JSON of a service-account
 *                                     key file. Preferred for Vercel
 *                                     and other env-var-only hosts.
 *   • FIREBASE_SERVICE_ACCOUNT_PATH — filesystem path to the JSON.
 *                                     Useful for local dev.
 *   • Application Default Credentials (ADC) — used as last resort,
 *     e.g. on Cloud Run / GCE where ADC is automatic.
 *
 * Throws on first access if no credentials are available; callers
 * should treat this as a configuration error and fail loudly. The
 * proxy and /api/session route degrade gracefully if Admin is not
 * available (V-029) — they fall back to "no admin gating" rather than
 * leaking unauth'd traffic into /admin, which is rejected anyway by
 * the client-side AuthContext + Firestore rules.
 */

import {
  applicationDefault,
  cert,
  getApps,
  initializeApp,
  type App,
} from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

let cached: App | null = null;
let initError: Error | null = null;

function loadServiceAccount(): Parameters<typeof cert>[0] | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (raw) {
    try {
      return JSON.parse(raw) as Parameters<typeof cert>[0];
    } catch (err) {
      throw new Error(
        '[firebaseAdmin] FIREBASE_SERVICE_ACCOUNT_KEY is not valid JSON: ' +
          (err instanceof Error ? err.message : String(err)),
      );
    }
  }
  return null;
}

export function isFirebaseAdminConfigured(): boolean {
  if (cached) return true;
  if (initError) return false;
  return Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
    || Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
    || Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS);
}

export function getFirebaseAdmin(): App {
  if (cached) return cached;
  if (initError) throw initError;
  try {
    const existing = getApps()[0];
    if (existing) {
      cached = existing;
      return existing;
    }
    const sa = loadServiceAccount();
    if (sa) {
      cached = initializeApp({ credential: cert(sa) });
      return cached;
    }
    if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH || process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      cached = initializeApp({ credential: applicationDefault() });
      return cached;
    }
    throw new Error(
      '[firebaseAdmin] No Firebase Admin credentials configured. Set ' +
      'FIREBASE_SERVICE_ACCOUNT_KEY (env JSON) or ' +
      'FIREBASE_SERVICE_ACCOUNT_PATH / GOOGLE_APPLICATION_CREDENTIALS.',
    );
  } catch (err) {
    initError = err instanceof Error ? err : new Error(String(err));
    throw initError;
  }
}

export function adminAuth() {
  return getAuth(getFirebaseAdmin());
}

let firestore: Firestore | null = null;

/** Server-side Firestore (Admin SDK — bypasses security rules). */
export function adminFirestore(): Firestore {
  if (!firestore) {
    firestore = getFirestore(getFirebaseAdmin());
  }
  return firestore;
}
