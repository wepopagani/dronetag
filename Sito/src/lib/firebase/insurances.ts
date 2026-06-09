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
  query, updateDoc, where,
} from 'firebase/firestore';

import { awaitFirebaseAuthReady } from '@/lib/firebase/auth';
import { DEMO_MODE, getFirebaseDb } from '@/lib/firebase/config';
import * as demo from '@/lib/demo/entitiesStore';
import { resyncUserPublicDrones } from '@/lib/firebase/dronesPublic';
import { adminFetch } from '@/lib/client/adminApi';
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
    holderName: str('holderName'),
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
  const snap = await getDocs(
    query(collection(db, INSURANCES), where('userId', '==', userId)),
  );
  return snap.docs
    .map((d) => insuranceFromRaw(d.id, d.data() as Record<string, unknown>))
    .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
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
 * Server-side create via `/api/entities/insurances` (Admin SDK).
 * Validates that the linked drone or operator belongs to the caller;
 * verificationStatus is forced to 'unverified'.
 */
export async function createInsurance(
  data: Omit<Insurance, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<string> {
  if (DEMO_MODE) return demo.createInsurance(data);
  const res = await adminFetch('/api/entities/insurances', {
    method: 'POST',
    body: JSON.stringify({
      link: data.link,
      droneId: data.droneId,
      operatorId: data.operatorId,
      provider: data.provider,
      policyNumber: data.policyNumber,
      holderName: data.holderName,
      issueDate: data.issueDate,
      expiryDate: data.expiryDate,
      notes: data.notes,
      pdfUrl: data.pdfUrl,
    }),
  });
  const body = (await res.json().catch(() => ({}))) as { id?: string; error?: string };
  if (!res.ok) {
    throw new Error(body.error || `create insurance failed (${res.status})`);
  }
  if (!body.id) throw new Error('create insurance failed: missing id');
  return body.id;
}

/** Upload policy PDF via Admin SDK (avoids client Storage rules). */
export async function uploadInsurancePolicyPdf(insuranceId: string, file: File): Promise<string> {
  if (DEMO_MODE) {
    await new Promise((r) => setTimeout(r, 300));
    return URL.createObjectURL(file);
  }
  const before = await getInsurance(insuranceId);
  const form = new FormData();
  form.append('file', file);
  const res = await adminFetch(`/api/entities/insurances/${insuranceId}/pdf`, {
    method: 'POST',
    body: form,
  });
  const body = (await res.json().catch(() => ({}))) as { pdfUrl?: string; error?: string };
  if (!res.ok) {
    throw new Error(body.error || `upload policy pdf failed (${res.status})`);
  }
  if (!body.pdfUrl) throw new Error('upload policy pdf failed: missing pdfUrl');
  if (before?.userId) await resyncUserPublicDrones(before.userId);
  return body.pdfUrl;
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
  await awaitFirebaseAuthReady({ refresh: true });
  const db = getFirebaseDb();
  const snap = await getDocs(collection(db, INSURANCES));
  return snap.docs
    .map((d) => insuranceFromRaw(d.id, d.data() as Record<string, unknown>))
    .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
}
