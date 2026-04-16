import {
  doc,
  getDoc,
  setDoc,
} from 'firebase/firestore';

import { DEMO_MODE, getFirebaseDb } from '@/lib/firebase/config';
import * as demoStore from '@/lib/demo/accountStore';
import type { UserAccount } from '@/lib/types/account';

const USERS = 'users';

function accountFromRaw(uid: string, raw: Record<string, unknown>): UserAccount {
  const str = (k: string) => (typeof raw[k] === 'string' ? (raw[k] as string) : '');
  const addr = (raw['address'] ?? {}) as Record<string, unknown>;
  const addrStr = (k: string) => (typeof addr[k] === 'string' ? (addr[k] as string) : '');

  return {
    uid,
    email: str('email'),
    firstName: str('firstName'),
    lastName: str('lastName'),
    phone: str('phone'),
    address: {
      line1: addrStr('line1'),
      line2: addrStr('line2'),
      city: addrStr('city'),
      postalCode: addrStr('postalCode'),
      country: addrStr('country'),
    },
    createdAt: str('createdAt'),
    updatedAt: str('updatedAt'),
  };
}

export async function getAccount(uid: string): Promise<UserAccount | null> {
  if (DEMO_MODE) return demoStore.getAccountByUid(uid);
  const db = getFirebaseDb();
  const snap = await getDoc(doc(db, USERS, uid));
  if (!snap.exists()) return null;
  return accountFromRaw(uid, snap.data() as Record<string, unknown>);
}

/**
 * Idempotently create the `users/{uid}` document after signup or first login.
 * Safe to call every time the app starts — won't overwrite existing data.
 */
export async function ensureAccount(
  uid: string,
  email: string,
  seed: Partial<UserAccount> = {},
): Promise<UserAccount> {
  if (DEMO_MODE) return demoStore.ensureAccount(uid, email, seed);

  const existing = await getAccount(uid);
  if (existing) return existing;

  const now = new Date().toISOString();
  const account: UserAccount = {
    uid,
    email,
    firstName: seed.firstName ?? '',
    lastName: seed.lastName ?? '',
    phone: seed.phone ?? '',
    address: seed.address ?? {
      line1: '',
      line2: '',
      city: '',
      postalCode: '',
      country: '',
    },
    createdAt: now,
    updatedAt: now,
  };

  const db = getFirebaseDb();
  await setDoc(doc(db, USERS, uid), account);
  return account;
}
