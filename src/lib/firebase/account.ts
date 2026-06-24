import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

import { awaitFirebaseAuthReady } from '@/lib/firebase/auth';
import { adminFetch } from '@/lib/client/adminApi';
import { DEMO_MODE, getFirebaseDb } from '@/lib/firebase/config';
import * as demoStore from '@/lib/demo/accountStore';
import type { AccountType, UserAccount } from '@/lib/types/account';
import {
  EMPTY_CONTACT_VERIFICATION,
  type ContactVerificationState,
} from '@/lib/types/contactVerification';

const USERS = 'users';

function accountFromRaw(uid: string, raw: Record<string, unknown>): UserAccount {
  const str = (k: string) => (typeof raw[k] === 'string' ? (raw[k] as string) : '');
  const addr = (raw['address'] ?? {}) as Record<string, unknown>;
  const addrStr = (k: string) => (typeof addr[k] === 'string' ? (addr[k] as string) : '');

  const rawType = str('accountType');
  const accountType: AccountType = rawType === 'company' ? 'company' : 'private';

  const rawCv = (raw.contactVerification ?? {}) as Record<string, unknown>;
  const channels = Array.isArray(rawCv.channels)
    ? rawCv.channels.filter((c): c is 'email' | 'phone' => c === 'email' || c === 'phone')
    : [];
  const contactVerification: ContactVerificationState = {
    channels,
    emailVerifiedAt: typeof rawCv.emailVerifiedAt === 'string' ? rawCv.emailVerifiedAt : '',
    phoneVerifiedAt: typeof rawCv.phoneVerifiedAt === 'string' ? rawCv.phoneVerifiedAt : '',
  };

  return {
    uid,
    email: str('email'),
    accountType,
    firstName: str('firstName'),
    lastName: str('lastName'),
    dateOfBirth: str('dateOfBirth'),
    phone: str('phone'),
    address: {
      line1: addrStr('line1'),
      line2: addrStr('line2'),
      city: addrStr('city'),
      postalCode: addrStr('postalCode'),
      country: addrStr('country'),
    },
    companyName: str('companyName'),
    companyContactPerson: str('companyContactPerson'),
    companyVat: str('companyVat'),
    companyUniqueNumber: str('companyUniqueNumber'),
    profilePhotoUrl: str('profilePhotoUrl'),
    logoUrl: str('logoUrl'),
    bannerUrl: str('bannerUrl'),
    contactVerification,
    createdAt: str('createdAt'),
    updatedAt: str('updatedAt'),
  };
}

export async function getAccount(uid: string): Promise<UserAccount | null> {
  if (DEMO_MODE) return demoStore.getAccountByUid(uid);
  await awaitFirebaseAuthReady();
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
    accountType: seed.accountType ?? 'private',
    firstName: seed.firstName ?? '',
    lastName: seed.lastName ?? '',
    dateOfBirth: seed.dateOfBirth ?? '',
    phone: seed.phone ?? '',
    address: seed.address ?? {
      line1: '',
      line2: '',
      city: '',
      postalCode: '',
      country: '',
    },
    companyName: seed.companyName ?? '',
    companyContactPerson: seed.companyContactPerson ?? '',
    companyVat: seed.companyVat ?? '',
    companyUniqueNumber: seed.companyUniqueNumber ?? '',
    profilePhotoUrl: seed.profilePhotoUrl ?? '',
    logoUrl: seed.logoUrl ?? '',
    bannerUrl: seed.bannerUrl ?? '',
    contactVerification: seed.contactVerification ?? { ...EMPTY_CONTACT_VERIFICATION },
    createdAt: now,
    updatedAt: now,
  };

  const db = getFirebaseDb();
  await setDoc(doc(db, USERS, uid), account);
  return account;
}

/** Patch an existing `users/{uid}` document. */
export async function updateAccount(uid: string, patch: Partial<UserAccount>): Promise<void> {
  if (DEMO_MODE) return demoStore.updateAccount(uid, patch);
  await awaitFirebaseAuthReady();
  const db = getFirebaseDb();
  const payload = Object.fromEntries(
    Object.entries(patch).filter(([k, v]) => k !== 'uid' && v !== undefined),
  );
  await updateDoc(doc(db, USERS, uid), { ...payload, updatedAt: new Date().toISOString() });
}

export type AccountBrandingKind = 'photo' | 'logo' | 'banner';

/** Upload account branding image via Admin SDK (avoids client Storage rules). */
export async function uploadAccountBranding(
  kind: AccountBrandingKind,
  file: File,
): Promise<string> {
  if (DEMO_MODE) {
    await new Promise((r) => setTimeout(r, 300));
    return URL.createObjectURL(file);
  }

  const form = new FormData();
  form.append('kind', kind);
  form.append('file', file);
  const res = await adminFetch('/api/account/branding', {
    method: 'POST',
    body: form,
  });
  const body = (await res.json().catch(() => ({}))) as { url?: string; error?: string; message?: string };
  if (!res.ok) {
    throw new Error(body.error || body.message || `upload ${kind} failed (${res.status})`);
  }
  if (!body.url) throw new Error(`upload ${kind} failed: missing url`);
  return body.url;
}

export async function uploadAccountProfilePhoto(_uid: string, file: File): Promise<string> {
  return uploadAccountBranding('photo', file);
}

export async function uploadAccountLogo(_uid: string, file: File): Promise<string> {
  return uploadAccountBranding('logo', file);
}

export async function uploadAccountBanner(_uid: string, file: File): Promise<string> {
  return uploadAccountBranding('banner', file);
}

/**
 * Admin-only: list every user account. The Firestore rules grant read on
 * `users/*` to admin claims; ordinary users will get permission-denied.
 */
export async function listAllAccounts(): Promise<UserAccount[]> {
  if (DEMO_MODE) return demoStore.listAllAccounts();
  await awaitFirebaseAuthReady({ refresh: true });

  if (typeof window !== 'undefined') {
    try {
      const res = await adminFetch('/api/admin/accounts');
      if (res.ok) {
        const body = (await res.json()) as { accounts?: UserAccount[] };
        if (Array.isArray(body.accounts)) return body.accounts;
      }
    } catch {
      /* fall through to client Firestore */
    }
  }

  const db = getFirebaseDb();
  const snap = await getDocs(collection(db, USERS));
  const accounts = snap.docs.map((d) =>
    accountFromRaw(d.id, d.data() as Record<string, unknown>),
  );
  return accounts.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
}
