/**
 * Insurances collection — linked to either a drone or an operator.
 *
 * Path: `insurances/{insuranceId}` with a `userId` field.
 * Owner-only read/write. The relevant insurance for a public drone page is
 * resolved by id from `Drone.insuranceId` and projected through the public
 * projection layer (see src/lib/utils/publicProjection.ts).
 */

import {
  collection, deleteDoc, doc, getDoc, getDocs,
  orderBy, query, updateDoc, where,
} from 'firebase/firestore';

import { awaitFirebaseAuthReady } from '@/lib/firebase/auth';
import { DEMO_MODE, getFirebaseDb } from '@/lib/firebase/config';
import * as demo from '@/lib/demo/entitiesStore';
import { resyncUserPublicDrones } from '@/lib/firebase/dronesPublic';
import { callCreateInsurance } from '@/lib/firebase/callable';
import type { Insurance, InsuranceLink } from '@/lib/types/entities';
import type { VerificationStatus } from '@/lib/types';

const INSURANCES = 'insurances';

function insuranceFromRaw(id: string, raw: Record<string, unknown>): Insurance {
  const str = (k: string) => (typeof raw[k] === 'string' ? (raw[k] as string) : '');
  const optStr = (k: string) =>
    typeof raw[k] === 'string' ? (raw[k] as string) : null;
  return {
    id,
    userId: str('userId'),
    link: (str('link') || 'drone') as InsuranceLink,
    droneId: optStr('droneId'),
    operatorId: optStr('operatorId'),
    provider: str('provider'),
    policyNumber: str('policyNumber'),
    issueDate: str('issueDate'),
    expiryDate: str('expiryDate'),
    notes: str('notes'),
    pdfUrl: str('pdfUrl'),
    verificationStatus: (str('verificationStatus') || 'unverified') as VerificationStatus,
    createdAt: str('createdAt'),
    updatedAt: str('updatedAt'),
  };
}

export async function listInsurances(userId: string): Promise<Insurance[]> {
  if (DEMO_MODE) return demo.listInsurances(userId);
  await awaitFirebaseAuthReady();
  const db = getFirebaseDb();
  const q = query(
    collection(db, INSURANCES),
    where('userId', '==', userId),
    orderBy('updatedAt', 'desc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => insuranceFromRaw(d.id, d.data() as Record<string, unknown>));
}

export async function getInsurance(id: string): Promise<Insurance | null> {
  if (DEMO_MODE) return demo.getInsurance(id);
  await awaitFirebaseAuthReady();
  const db = getFirebaseDb();
  const snap = await getDoc(doc(db, INSURANCES, id));
  if (!snap.exists()) return null;
  return insuranceFromRaw(snap.id, snap.data() as Record<string, unknown>);
}

/**
 * Server-side create via `createInsurance` Cloud Function (PR-SEC-2).
 * Validates that the linked drone or operator belongs to the caller;
 * verificationStatus is forced to 'unverified'.
 */
export async function createInsurance(
  data: Omit<Insurance, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<string> {
  if (DEMO_MODE) return demo.createInsurance(data);
  const { id } = await callCreateInsurance({
    link: data.link,
    droneId: data.droneId,
    operatorId: data.operatorId,
    provider: data.provider,
    policyNumber: data.policyNumber,
    issueDate: data.issueDate,
    expiryDate: data.expiryDate,
    notes: data.notes,
    pdfUrl: data.pdfUrl,
  });
  return id;
}

export async function updateInsurance(id: string, patch: Partial<Insurance>): Promise<void> {
  const before = await getInsurance(id);
  if (DEMO_MODE) {
    await demo.updateInsurance(id, patch);
  } else {
    await awaitFirebaseAuthReady();
    const db = getFirebaseDb();
    const payload = Object.fromEntries(
      Object.entries(patch).filter(([k, v]) => k !== 'id' && v !== undefined),
    );
    await updateDoc(doc(db, INSURANCES, id), { ...payload, updatedAt: new Date().toISOString() });
  }
  if (before?.userId) await resyncUserPublicDrones(before.userId);
}

export async function deleteInsurance(id: string): Promise<void> {
  const before = await getInsurance(id);
  if (DEMO_MODE) {
    await demo.deleteInsurance(id);
  } else {
    await awaitFirebaseAuthReady();
    const db = getFirebaseDb();
    await deleteDoc(doc(db, INSURANCES, id));
  }
  if (before?.userId) await resyncUserPublicDrones(before.userId);
}

/** Admin-only: list every insurance policy across users. */
export async function listAllInsurances(): Promise<Insurance[]> {
  if (DEMO_MODE) return demo.listAllInsurances();
  await awaitFirebaseAuthReady();
  const db = getFirebaseDb();
  const q = query(collection(db, INSURANCES), orderBy('updatedAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => insuranceFromRaw(d.id, d.data() as Record<string, unknown>));
}
