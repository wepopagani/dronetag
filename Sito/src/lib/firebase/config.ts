import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, initializeFirestore, type Firestore } from 'firebase/firestore';
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
 */
export const DEMO_MODE = !apiKey || !projectId;

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

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

export default app;
