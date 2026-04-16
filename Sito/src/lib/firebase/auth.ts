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
