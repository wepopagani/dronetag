import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
  ReCaptchaV3Provider,
  type AppCheck,
} from 'firebase/app-check';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, initializeFirestore, type Firestore } from 'firebase/firestore';
import { getFunctions, type Functions } from 'firebase/functions';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

/**
 * Next.js inlines NEXT_PUBLIC_* env vars at compile time via literal replacement.
 * Dynamic access like process.env[key] does NOT work on the client.
 * Each var must be accessed directly.
 */
const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? '';
const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '';
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? '';
const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '';
const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '';
const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? '';

/**
 * When true, the app runs with in-memory mock data instead of Firebase.
 * Activated automatically when required Firebase env vars are not set.
 *
 * V-036 / PR-SEC-2: a runtime guard refuses to instantiate the app in a
 * browser served over https when DEMO_MODE is true. Combined with the
 * build-time guard in next.config.ts, this makes it impossible to ship
 * a production bundle that silently treats every visitor as admin.
 */
export const DEMO_MODE = !apiKey || !projectId;

if (typeof window !== 'undefined' && DEMO_MODE) {
  const isHttps = window.location.protocol === 'https:';
  const isLocalhost = ['localhost', '127.0.0.1', '0.0.0.0'].includes(window.location.hostname);
  if (isHttps && !isLocalhost) {
    throw new Error(
      '[firebase/config] DEMO_MODE detected on a production-like host. ' +
      'Refusing to start. Configure NEXT_PUBLIC_FIREBASE_* env vars and rebuild.',
    );
  }
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let functions: Functions | null = null;
let appCheck: AppCheck | null = null;

if (!DEMO_MODE) {
  const firebaseConfig = {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
  };
  const isNewFirebaseApp = getApps().length === 0;
  app = isNewFirebaseApp ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  // Safari/WebKit often blocks Firestore WebChannel ("Listen/channel" → access control checks).
  // Long polling avoids that transport. Must run before any getFirestore on a new app.
  db = isNewFirebaseApp
    ? initializeFirestore(app, { experimentalAutoDetectLongPolling: true })
    : getFirestore(app);
  storage = getStorage(app);
  functions = getFunctions(app, process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_REGION ?? 'us-central1');

  // ─── App Check (PR-SEC-2 V-035) ─────────────────────────────────────────
  // Init only in the browser. Two providers supported:
  //   1. NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY (preferred for prod)
  //   2. NEXT_PUBLIC_RECAPTCHA_SITE_KEY (reCAPTCHA v3 fallback)
  // Skipped silently in development if no key is present so local dev
  // doesn't require an Enterprise key. Enforcement is configured in the
  // Firebase Console — start in MONITOR mode for a couple of weeks.
  if (typeof window !== 'undefined' && isNewFirebaseApp) {
    const enterpriseKey = process.env.NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY;
    const v3Key = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
    const debugToken = process.env.NEXT_PUBLIC_APP_CHECK_DEBUG_TOKEN;
    if (debugToken) {
      // The debug provider lets local dev pass App Check enforcement.
      // The token is also the literal value reported to the Firebase
      // Console so devs can see who's connecting. NEVER expose a real
      // token via NEXT_PUBLIC_*; this var is for local dev only.
      (window as unknown as { FIREBASE_APPCHECK_DEBUG_TOKEN: string })
        .FIREBASE_APPCHECK_DEBUG_TOKEN = debugToken;
    }
    try {
      if (enterpriseKey) {
        appCheck = initializeAppCheck(app, {
          provider: new ReCaptchaEnterpriseProvider(enterpriseKey),
          isTokenAutoRefreshEnabled: true,
        });
      } else if (v3Key) {
        appCheck = initializeAppCheck(app, {
          provider: new ReCaptchaV3Provider(v3Key),
          isTokenAutoRefreshEnabled: true,
        });
      }
    } catch (err) {
      console.warn('[firebase/config] App Check init failed', err);
    }
  }
}

export function getFirebaseAuth(): Auth {
  if (!auth) throw new Error('Firebase Auth not initialized (demo mode?)');
  return auth;
}

export function getFirebaseDb(): Firestore {
  if (!db) throw new Error('Firestore not initialized (demo mode?)');
  return db;
}

export function getFirebaseStorage(): FirebaseStorage {
  if (!storage) throw new Error('Firebase Storage not initialized (demo mode?)');
  return storage;
}

export function getFirebaseFunctions(): Functions {
  if (!functions) throw new Error('Firebase Functions not initialized (demo mode?)');
  return functions;
}

/** Returns the App Check instance if it was initialised, else null. */
export function getAppCheckOrNull(): AppCheck | null {
  return appCheck;
}

export default app;
