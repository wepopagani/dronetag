/**
 * Operators collection — up to 3 per user.
 *
 * Path: `operators/{operatorId}` with a `userId` field.
 * Only the owner reads/writes their operators (see firestore.rules).
 *
 * Slot/cap enforcement (max MAX_OPERATORS = 3) is performed at the call
 * site so the UI can give a meaningful error before round-tripping.
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
import {
  EMPTY_OPERATOR_COMPANY,
  EMPTY_OPERATOR_PRIVATE,
  type Operator,
  type OperatorKind,
} from '@/lib/types/entities';

const OPERATORS = 'operators';

function operatorFromRaw(id: string, raw: Record<string, unknown>): Operator {
  const str = (k: string) => (typeof raw[k] === 'string' ? (raw[k] as string) : '');
  const bool = (k: string) => raw[k] === true;

  const kindRaw = str('kind');
  const kind: OperatorKind = kindRaw === 'company' ? 'company' : 'private';

  const priv = (raw['private'] ?? {}) as Record<string, unknown>;
  const comp = (raw['company'] ?? {}) as Record<string, unknown>;

  return {
    id,
    userId: str('userId'),
    kind,
    label: str('label'),
    isDefault: bool('isDefault'),
    private: { ...EMPTY_OPERATOR_PRIVATE, ...priv } as Operator['private'],
    company: { ...EMPTY_OPERATOR_COMPANY, ...comp } as Operator['company'],
    createdAt: str('createdAt'),
    updatedAt: str('updatedAt'),
  };
}

export async function listOperators(userId: string): Promise<Operator[]> {
  if (DEMO_MODE) return demo.listOperators(userId);
  await awaitFirebaseAuthReady();
  const db = getFirebaseDb();
  const snap = await getDocs(
    query(collection(db, OPERATORS), where('userId', '==', userId)),
  );
  return snap.docs
    .map((d) => operatorFromRaw(d.id, d.data() as Record<string, unknown>))
    .sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
}

export async function getOperator(id: string): Promise<Operator | null> {
  if (DEMO_MODE) return demo.getOperator(id);
  await awaitFirebaseAuthReady();
  const db = getFirebaseDb();
  const snap = await getDoc(doc(db, OPERATORS, id));
  if (!snap.exists()) return null;
  return operatorFromRaw(snap.id, snap.data() as Record<string, unknown>);
}

/**
 * Server-side create via `/api/entities/operators` (Admin SDK).
 * Enforces ownership, kind validation, and the operator quota cap.
 */
export async function createOperator(
  data: Omit<Operator, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<string> {
  if (DEMO_MODE) return demo.createOperator(data);
  const res = await adminFetch('/api/entities/operators', {
    method: 'POST',
    body: JSON.stringify({
      kind: data.kind,
      label: data.label,
      isDefault: data.isDefault,
      private: data.private,
      company: data.company,
    }),
  });
  const body = (await res.json().catch(() => ({}))) as { id?: string; error?: string };
  if (!res.ok) {
    throw new Error(body.error || `create operator failed (${res.status})`);
  }
  if (!body.id) throw new Error('create operator failed: missing id');
  return body.id;
}

export async function updateOperator(id: string, patch: Partial<Operator>): Promise<void> {
  // Capture owner uid before the write so we can re-sync public drones after.
  const before = await getOperator(id);
  if (DEMO_MODE) {
    await demo.updateOperator(id, patch);
  } else {
    await awaitFirebaseAuthReady();
    const db = getFirebaseDb();
    const payload = Object.fromEntries(
      Object.entries(patch).filter(([k, v]) => k !== 'id' && v !== undefined),
    );
    await updateDoc(doc(db, OPERATORS, id), { ...payload, updatedAt: new Date().toISOString() });
  }
  if (before?.userId) await resyncUserPublicDrones(before.userId);
}

export async function deleteOperator(id: string): Promise<void> {
  const before = await getOperator(id);
  if (DEMO_MODE) {
    await demo.deleteOperator(id);
  } else {
    await awaitFirebaseAuthReady();
    const db = getFirebaseDb();
    await deleteDoc(doc(db, OPERATORS, id));
  }
  if (before?.userId) await resyncUserPublicDrones(before.userId);
}

/** Admin-only: list every operator across users. */
export async function listAllOperators(): Promise<Operator[]> {
  if (DEMO_MODE) return demo.listAllOperators();
  await awaitFirebaseAuthReady({ refresh: true });
  const db = getFirebaseDb();
  const snap = await getDocs(collection(db, OPERATORS));
  return snap.docs
    .map((d) => operatorFromRaw(d.id, d.data() as Record<string, unknown>))
    .sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
}
