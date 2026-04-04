import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
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
