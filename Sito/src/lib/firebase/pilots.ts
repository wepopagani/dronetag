/**
 * Pilots collection — one document per user, doc id = userId.
 *
 * Path: `pilots/{uid}`
 * Owner-only read/write (see firestore.rules).
 */

import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

import { awaitFirebaseAuthReady } from '@/lib/firebase/auth';
import { DEMO_MODE, getFirebaseDb } from '@/lib/firebase/config';
import * as demo from '@/lib/demo/entitiesStore';
import { resyncUserPublicDrones } from '@/lib/firebase/dronesPublic';
import type { Pilot } from '@/lib/types/entities';
import type { Address } from '@/lib/types/account';

const PILOTS = 'pilots';

const EMPTY_ADDRESS: Address = {
  line1: '', line2: '', city: '', postalCode: '', country: '',
};

function pilotFromRaw(userId: string, raw: Record<string, unknown>): Pilot {
  const str = (k: string) => (typeof raw[k] === 'string' ? (raw[k] as string) : '');
  const addr = (raw['address'] ?? {}) as Record<string, unknown>;
  const addrStr = (k: string) => (typeof addr[k] === 'string' ? (addr[k] as string) : '');
  return {
    userId,
    firstName: str('firstName'),
    lastName: str('lastName'),
    dateOfBirth: str('dateOfBirth'),
    nationality: str('nationality'),
    email: str('email'),
    phone: str('phone'),
    address: {
      line1: addrStr('line1'),
      line2: addrStr('line2'),
      city: addrStr('city'),
      postalCode: addrStr('postalCode'),
      country: addrStr('country'),
    },
    operatorCode: str('operatorCode'),
    operatorLicense: str('operatorLicense'),
    emergencyContact: str('emergencyContact'),
    createdAt: str('createdAt'),
    updatedAt: str('updatedAt'),
  };
}

export async function getPilot(userId: string): Promise<Pilot | null> {
  if (DEMO_MODE) return demo.getPilot(userId);
  await awaitFirebaseAuthReady();
  const db = getFirebaseDb();
  const snap = await getDoc(doc(db, PILOTS, userId));
  if (!snap.exists()) return null;
  return pilotFromRaw(userId, snap.data() as Record<string, unknown>);
}

/** Idempotent create — leaves an existing doc untouched. */
export async function ensurePilot(
  userId: string,
  seed: Partial<Pilot> = {},
): Promise<Pilot> {
  const existing = await getPilot(userId);
  if (existing) return existing;
  const now = new Date().toISOString();
  const pilot: Pilot = {
    userId,
    firstName: seed.firstName ?? '',
    lastName: seed.lastName ?? '',
    dateOfBirth: seed.dateOfBirth ?? '',
    nationality: seed.nationality ?? '',
    email: seed.email ?? '',
    phone: seed.phone ?? '',
    address: seed.address ?? EMPTY_ADDRESS,
    operatorCode: seed.operatorCode ?? '',
    operatorLicense: seed.operatorLicense ?? '',
    emergencyContact: seed.emergencyContact ?? '',
    createdAt: now,
    updatedAt: now,
  };
  if (DEMO_MODE) {
    await demo.upsertPilot(pilot);
    return pilot;
  }
  await awaitFirebaseAuthReady();
  const db = getFirebaseDb();
  await setDoc(doc(db, PILOTS, userId), pilot);
  return pilot;
}

export async function updatePilot(userId: string, patch: Partial<Pilot>): Promise<void> {
  if (DEMO_MODE) {
    const existing = await demo.getPilot(userId);
    if (!existing) return;
    await demo.upsertPilot({ ...existing, ...patch, userId, updatedAt: new Date().toISOString() });
  } else {
    await awaitFirebaseAuthReady();
    const db = getFirebaseDb();
    const payload = Object.fromEntries(
      Object.entries(patch).filter(([k, v]) => k !== 'userId' && v !== undefined),
    );
    await updateDoc(doc(db, PILOTS, userId), { ...payload, updatedAt: new Date().toISOString() });
  }
  // Pilot identity feeds the public drone card's holder name when the
  // effective operator is missing. Refresh every public-active drone
  // owned by this user so the snapshot stays consistent.
  await resyncUserPublicDrones(userId);
}
