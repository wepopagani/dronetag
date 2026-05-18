/**
 * Certificates collection — A1/A3, A2, STS-theoretical, STS-01, STS-02, custom.
 *
 * Path: `certificates/{certId}` with a `userId` field.
 * Owner-only read/write; admin can read all (see firestore.rules).
 */

import {
  collection, deleteDoc, doc, getDoc, getDocs,
  orderBy, query, updateDoc, where,
} from 'firebase/firestore';

import { awaitFirebaseAuthReady } from '@/lib/firebase/auth';
import { DEMO_MODE, getFirebaseDb } from '@/lib/firebase/config';
import * as demo from '@/lib/demo/entitiesStore';
import { callCreateCertificate } from '@/lib/firebase/callable';
import type { Certificate, CertificateKind } from '@/lib/types/entities';
import type { VerificationStatus } from '@/lib/types';

const CERTIFICATES = 'certificates';

function certificateFromRaw(id: string, raw: Record<string, unknown>): Certificate {
  const str = (k: string) => (typeof raw[k] === 'string' ? (raw[k] as string) : '');
  return {
    id,
    userId: str('userId'),
    kind: (str('kind') || 'custom') as CertificateKind,
    label: str('label'),
    issuedBy: str('issuedBy'),
    issuedAt: str('issuedAt'),
    expiresAt: str('expiresAt'),
    fileUrl: str('fileUrl'),
    verificationStatus: (str('verificationStatus') || 'unverified') as VerificationStatus,
    notes: str('notes'),
    createdAt: str('createdAt'),
    updatedAt: str('updatedAt'),
  };
}

export async function listCertificates(userId: string): Promise<Certificate[]> {
  if (DEMO_MODE) return demo.listCertificates(userId);
  await awaitFirebaseAuthReady();
  const db = getFirebaseDb();
  const q = query(
    collection(db, CERTIFICATES),
    where('userId', '==', userId),
    orderBy('createdAt', 'asc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => certificateFromRaw(d.id, d.data() as Record<string, unknown>));
}

export async function getCertificate(id: string): Promise<Certificate | null> {
  if (DEMO_MODE) return demo.getCertificate(id);
  await awaitFirebaseAuthReady();
  const db = getFirebaseDb();
  const snap = await getDoc(doc(db, CERTIFICATES, id));
  if (!snap.exists()) return null;
  return certificateFromRaw(snap.id, snap.data() as Record<string, unknown>);
}

/**
 * Server-side create via `createCertificate` Cloud Function (PR-SEC-2).
 * Quota-checked and verificationStatus is forced to 'unverified'.
 */
export async function createCertificate(
  data: Omit<Certificate, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<string> {
  if (DEMO_MODE) return demo.createCertificate(data);
  const { id } = await callCreateCertificate({
    kind: data.kind,
    label: data.label,
    issuedBy: data.issuedBy,
    issuedAt: data.issuedAt,
    expiresAt: data.expiresAt,
    fileUrl: data.fileUrl,
    notes: data.notes,
  });
  return id;
}

export async function updateCertificate(id: string, patch: Partial<Certificate>): Promise<void> {
  if (DEMO_MODE) return demo.updateCertificate(id, patch);
  await awaitFirebaseAuthReady();
  const db = getFirebaseDb();
  const payload = Object.fromEntries(
    Object.entries(patch).filter(([k, v]) => k !== 'id' && v !== undefined),
  );
  await updateDoc(doc(db, CERTIFICATES, id), { ...payload, updatedAt: new Date().toISOString() });
}

export async function deleteCertificate(id: string): Promise<void> {
  if (DEMO_MODE) return demo.deleteCertificate(id);
  await awaitFirebaseAuthReady();
  const db = getFirebaseDb();
  await deleteDoc(doc(db, CERTIFICATES, id));
}

/** Admin-only: list every certificate across users. */
export async function listAllCertificates(): Promise<Certificate[]> {
  if (DEMO_MODE) return demo.listAllCertificates();
  await awaitFirebaseAuthReady();
  const db = getFirebaseDb();
  const q = query(collection(db, CERTIFICATES), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => certificateFromRaw(d.id, d.data() as Record<string, unknown>));
}
