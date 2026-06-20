/**
 * Plans collection — admin-managed pricing per slot kind.
 *
 * Path: `plans/{planId}`.
 * Read: anyone (the public marketing page may show prices in M5).
 * Write: admin only.
 */

import {
  addDoc, collection, deleteDoc, doc, getDocs,
  orderBy, query, setDoc, updateDoc,
} from 'firebase/firestore';

import { awaitFirebaseAuthReady } from '@/lib/firebase/auth';
import { DEMO_MODE, getFirebaseDb } from '@/lib/firebase/config';
import * as demo from '@/lib/demo/entitiesStore';
import type { Plan, SlotKind } from '@/lib/types/entities';

const PLANS = 'plans';

function planFromRaw(id: string, raw: Record<string, unknown>): Plan {
  const str = (k: string) => (typeof raw[k] === 'string' ? (raw[k] as string) : '');
  const num = (k: string) => (typeof raw[k] === 'number' ? (raw[k] as number) : 0);
  const bool = (k: string) => raw[k] === true;
  return {
    id,
    slotKind: (str('slotKind') || 'pdf') as SlotKind,
    priceCents: num('priceCents'),
    currency: str('currency') || 'CHF',
    active: bool('active'),
    label: str('label'),
    description: str('description'),
    createdAt: str('createdAt'),
    updatedAt: str('updatedAt'),
  };
}

export async function listPlans(): Promise<Plan[]> {
  if (DEMO_MODE) return demo.listPlans();
  await awaitFirebaseAuthReady();
  const db = getFirebaseDb();
  const q = query(collection(db, PLANS), orderBy('slotKind', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => planFromRaw(d.id, d.data() as Record<string, unknown>));
}

export async function createPlan(
  data: Omit<Plan, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<string> {
  const now = new Date().toISOString();
  const payload = { ...data, createdAt: now, updatedAt: now };
  if (DEMO_MODE) {
    const id = `plan-${data.slotKind}-${Date.now()}`;
    await demo.upsertPlan({ ...payload, id });
    return id;
  }
  await awaitFirebaseAuthReady();
  const db = getFirebaseDb();
  const ref = await addDoc(collection(db, PLANS), payload);
  return ref.id;
}

export async function upsertPlan(plan: Plan): Promise<void> {
  if (DEMO_MODE) { await demo.upsertPlan(plan); return; }
  await awaitFirebaseAuthReady();
  const db = getFirebaseDb();
  await setDoc(doc(db, PLANS, plan.id), { ...plan, updatedAt: new Date().toISOString() });
}

export async function updatePlan(id: string, patch: Partial<Plan>): Promise<void> {
  if (DEMO_MODE) {
    const all = await demo.listPlans();
    const cur = all.find((p) => p.id === id);
    if (!cur) return;
    await demo.upsertPlan({ ...cur, ...patch, id, updatedAt: new Date().toISOString() });
    return;
  }
  await awaitFirebaseAuthReady();
  const db = getFirebaseDb();
  const payload = Object.fromEntries(
    Object.entries(patch).filter(([k, v]) => k !== 'id' && v !== undefined),
  );
  await updateDoc(doc(db, PLANS, id), { ...payload, updatedAt: new Date().toISOString() });
}

export async function deletePlan(id: string): Promise<void> {
  if (DEMO_MODE) {
    // No-op friendly: demo store keeps plans by id, so we mark inactive.
    const cur = (await demo.listPlans()).find((p) => p.id === id);
    if (cur) await demo.upsertPlan({ ...cur, active: false, updatedAt: new Date().toISOString() });
    return;
  }
  await awaitFirebaseAuthReady();
  const db = getFirebaseDb();
  await deleteDoc(doc(db, PLANS, id));
}
