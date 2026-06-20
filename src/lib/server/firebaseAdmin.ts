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

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
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

function parseServiceAccountJson(raw: string, label: string): Parameters<typeof cert>[0] {
  try {
    return JSON.parse(raw) as Parameters<typeof cert>[0];
  } catch (err) {
    throw new Error(
      `[firebaseAdmin] ${label} is not valid JSON: ` +
        (err instanceof Error ? err.message : String(err)),
    );
  }
}

function serviceAccountPath(): string | null {
  const pathEnv = process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim();
  return pathEnv ? resolve(pathEnv) : null;
}

function loadServiceAccount(): Parameters<typeof cert>[0] | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.trim();
  if (raw) {
    return parseServiceAccountJson(raw, 'FIREBASE_SERVICE_ACCOUNT_KEY');
  }

  const filePath = serviceAccountPath();
  if (filePath) {
    if (!existsSync(filePath)) {
      throw new Error(`[firebaseAdmin] FIREBASE_SERVICE_ACCOUNT_PATH not found: ${filePath}`);
    }
    return parseServiceAccountJson(
      readFileSync(filePath, 'utf8'),
      `FIREBASE_SERVICE_ACCOUNT_PATH (${filePath})`,
    );
  }

  return null;
}

export function isFirebaseAdminConfigured(): boolean {
  if (cached) return true;
  if (initError) return false;
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.trim()) return true;
  const filePath = serviceAccountPath();
  if (filePath && existsSync(filePath)) return true;
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim()) return true;
  return false;
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
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim()) {
      cached = initializeApp({ credential: applicationDefault() });
      return cached;
    }

    throw new Error(
      '[firebaseAdmin] No Firebase Admin credentials configured. Set ' +
        'FIREBASE_SERVICE_ACCOUNT_KEY (JSON one-liner) or ' +
        'FIREBASE_SERVICE_ACCOUNT_PATH (path to the service-account JSON file).',
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
