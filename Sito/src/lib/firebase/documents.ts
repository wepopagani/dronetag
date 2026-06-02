/**
 * Documents collection — additional uploaded PDFs / images.
 *
 * Path: `documents/{docId}` with a `userId` field.
 * Owner-only read/write; admin can read all (see firestore.rules).
 *
 * NOTE: This module is named `documents.ts` deliberately to avoid clashes
 * with the legacy `Profile.documents[]` array embedded inside the old
 * `profiles/*` documents. The old shape lives on as a sub-array; the new
 * shape is its own collection.
 */

import {
  collection, deleteDoc, doc, getDoc, getDocs,
  query, updateDoc, where,
} from 'firebase/firestore';

import { awaitFirebaseAuthReady } from '@/lib/firebase/auth';
import { DEMO_MODE, getFirebaseDb } from '@/lib/firebase/config';
import * as demo from '@/lib/demo/entitiesStore';
import { callCreateDocument } from '@/lib/firebase/callable';
import type { DocumentRef, DocumentKind } from '@/lib/types/entities';
import type { VerificationStatus } from '@/lib/types';

const DOCUMENTS = 'documents';

function documentFromRaw(id: string, raw: Record<string, unknown>): DocumentRef {
  const str = (k: string) => (typeof raw[k] === 'string' ? (raw[k] as string) : '');
  const num = (k: string) => (typeof raw[k] === 'number' ? (raw[k] as number) : 0);
  return {
    id,
    userId: str('userId'),
    kind: (str('kind') || 'other') as DocumentKind,
    label: str('label'),
    fileUrl: str('fileUrl'),
    fileName: str('fileName'),
    fileSize: num('fileSize'),
    mimeType: str('mimeType'),
    verificationStatus: (str('verificationStatus') || 'unverified') as VerificationStatus,
    notes: str('notes'),
    createdAt: str('createdAt'),
    updatedAt: str('updatedAt'),
  };
}

export async function listDocuments(userId: string): Promise<DocumentRef[]> {
  if (DEMO_MODE) return demo.listDocuments(userId);
  await awaitFirebaseAuthReady();
  const db = getFirebaseDb();
  const snap = await getDocs(
    query(collection(db, DOCUMENTS), where('userId', '==', userId)),
  );
  return snap.docs
    .map((d) => documentFromRaw(d.id, d.data() as Record<string, unknown>))
    .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
}

export async function getDocument(id: string): Promise<DocumentRef | null> {
  if (DEMO_MODE) return demo.getDocument(id);
  await awaitFirebaseAuthReady();
  const db = getFirebaseDb();
  const snap = await getDoc(doc(db, DOCUMENTS, id));
  if (!snap.exists()) return null;
  return documentFromRaw(snap.id, snap.data() as Record<string, unknown>);
}

/**
 * Server-side create via `createDocument` Cloud Function (PR-SEC-2).
 * Quota-checked and content-type allowlisted; verificationStatus is
 * forced to 'unverified'.
 */
export async function createDocument(
  data: Omit<DocumentRef, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<string> {
  if (DEMO_MODE) return demo.createDocument(data);
  const { id } = await callCreateDocument({
    kind: data.kind,
    label: data.label,
    fileUrl: data.fileUrl,
    fileName: data.fileName,
    fileSize: data.fileSize,
    mimeType: data.mimeType,
    notes: data.notes,
  });
  return id;
}

export async function updateDocument(id: string, patch: Partial<DocumentRef>): Promise<void> {
  if (DEMO_MODE) return demo.updateDocument(id, patch);
  await awaitFirebaseAuthReady();
  const db = getFirebaseDb();
  const payload = Object.fromEntries(
    Object.entries(patch).filter(([k, v]) => k !== 'id' && v !== undefined),
  );
  await updateDoc(doc(db, DOCUMENTS, id), { ...payload, updatedAt: new Date().toISOString() });
}

export async function deleteDocument(id: string): Promise<void> {
  if (DEMO_MODE) return demo.deleteDocument(id);
  await awaitFirebaseAuthReady();
  const db = getFirebaseDb();
  await deleteDoc(doc(db, DOCUMENTS, id));
}

/** Admin-only: list every document across users. */
export async function listAllDocuments(): Promise<DocumentRef[]> {
  if (DEMO_MODE) return demo.listAllDocuments();
  await awaitFirebaseAuthReady({ refresh: true });
  const db = getFirebaseDb();
  const snap = await getDocs(collection(db, DOCUMENTS));
  return snap.docs
    .map((d) => documentFromRaw(d.id, d.data() as Record<string, unknown>))
    .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
}
