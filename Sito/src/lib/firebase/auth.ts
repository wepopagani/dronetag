import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type Unsubscribe,
  type User,
  type UserCredential,
} from 'firebase/auth';

import { DEMO_MODE, getFirebaseAuth } from '@/lib/firebase/config';

// ─── Demo mode mock user ─────────────────────────────────────────────────────

const DEMO_USER = {
  uid: 'demo-admin',
  email: 'admin@dronetag.io',
  displayName: 'Demo Admin',
} as User;

// ─── Auth API ────────────────────────────────────────────────────────────────

export function loginWithEmail(
  email: string,
  password: string,
): Promise<UserCredential> {
  if (DEMO_MODE) {
    return Promise.resolve({ user: DEMO_USER } as UserCredential);
  }
  return signInWithEmailAndPassword(getFirebaseAuth(), email, password);
}

export async function signupWithEmail(
  email: string,
  password: string,
  displayName?: string,
): Promise<UserCredential> {
  if (DEMO_MODE) {
    // Demo mode: pretend the signup succeeded and return the demo user.
    return { user: DEMO_USER } as UserCredential;
  }
  const credential = await createUserWithEmailAndPassword(
    getFirebaseAuth(),
    email,
    password,
  );
  if (displayName && credential.user) {
    try {
      await updateProfile(credential.user, { displayName });
    } catch {
      // Non-fatal: displayName is cosmetic.
    }
  }
  return credential;
}

export function logout(): Promise<void> {
  if (DEMO_MODE) return Promise.resolve();
  return signOut(getFirebaseAuth());
}

/**
 * Wait until Auth has restored the session, then ensure an ID token exists when signed in.
 * Firestore calls before this often hit permission-denied (rules see no request.auth).
 */
export async function awaitFirebaseAuthReady(): Promise<void> {
  if (DEMO_MODE) return;
  const auth = getFirebaseAuth();
  await new Promise<void>((resolve) => {
    const unsub = onAuthStateChanged(auth, () => {
      unsub();
      resolve();
    });
  });
  const u = auth.currentUser;
  if (u) await u.getIdToken();
}

export function onAuthChange(
  callback: (user: User | null) => void,
): Unsubscribe {
  if (DEMO_MODE) {
    // Auto-login in demo mode
    setTimeout(() => callback(DEMO_USER), 50);
    return () => {};
  }
  return onAuthStateChanged(getFirebaseAuth(), callback);
}
