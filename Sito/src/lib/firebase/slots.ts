/**
 * Slots collection — per-user counts of grantable / purchasable capacity.
 *
 * Path: `slots/{uid}`.
 * Read: owner + admin. Write: admin only.
 *
 * PR-SEC-4 V-008 closure: the bootstrap of `slots/{uid}` lives in the
 * `bootstrapSlots` Cloud Function (auth.user().onCreate). The client
 * never tries to write base counts because firestore.rules deny owner
 * writes. `ensureSlots` therefore returns an in-memory BASE_SLOTS
 * object when no Firestore doc exists — the UI renders correct
 * quotas without needing the doc immediately, and the trigger seeds
 * the doc on user-create. Admin grants and admin-side setSlots remain
 * the only paths that actually write.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
} from 'firebase/firestore';

import { awaitFirebaseAuthReady } from '@/lib/firebase/auth';
import { DEMO_MODE, getFirebaseDb } from '@/lib/firebase/config';
import * as demo from '@/lib/demo/entitiesStore';
import { BASE_SLOTS, type Slots, type SlotKind } from '@/lib/types/entities';

const SLOTS = 'slots';

function slotsFromRaw(userId: string, raw: Record<string, unknown>): Slots {
  const num = (k: string) => (typeof raw[k] === 'number' ? (raw[k] as number) : 0);
  const str = (k: string) => (typeof raw[k] === 'string' ? (raw[k] as string) : '');
  return {
    userId,
    certificate: num('certificate'),
    drone: num('drone'),
    operator: num('operator'),
    pdf: num('pdf'),
    nfc_badge: num('nfc_badge'),
    personalization: num('personalization'),
    createdAt: str('createdAt'),
    updatedAt: str('updatedAt'),
  };
}

export async function getSlots(userId: string): Promise<Slots | null> {
  if (DEMO_MODE) return demo.getSlots(userId);
  await awaitFirebaseAuthReady();
  const db = getFirebaseDb();
  const snap = await getDoc(doc(db, SLOTS, userId));
  if (!snap.exists()) return null;
  return slotsFromRaw(userId, snap.data() as Record<string, unknown>);
}

/**
 * Returns a usable Slots view for the UI.
 *
 * - DEMO_MODE: delegates to the in-memory store, which provisions a
 *   doc on first read.
 * - Production: reads `slots/{uid}`; if missing (legacy account, or
 *   the `bootstrapSlots` trigger hasn't fired yet), synthesises an
 *   in-memory BASE_SLOTS view. **Does not write.** The Cloud Function
 *   is the only producer of slot docs in production.
 */
export async function ensureSlots(userId: string): Promise<Slots> {
  if (DEMO_MODE) return demo.ensureSlots(userId);
  const existing = await getSlots(userId);
  if (existing) return existing;
  const now = new Date().toISOString();
  return { userId, ...BASE_SLOTS, createdAt: now, updatedAt: now };
}

/** Increment a single slot count by `count` (default 1). Admin-only. */
export async function grantSlot(
  userId: string,
  kind: SlotKind,
  count = 1,
): Promise<void> {
  if (DEMO_MODE) return demo.grantSlot(userId, kind, count);
  const cur = await ensureSlots(userId);
  await awaitFirebaseAuthReady();
  const db = getFirebaseDb();
  await updateDoc(doc(db, SLOTS, userId), {
    [kind]: cur[kind] + count,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Admin-only: set every slot count for a user in a single update.
 * Caller is expected to pass valid non-negative integers; this is the
 * raw write used by the admin slot editor.
 *
 * If the doc doesn't exist (legacy account that signed up before
 * `bootstrapSlots` was deployed), this still uses `updateDoc` —
 * Firestore returns NOT_FOUND. In that case the admin must wait for
 * the user to sign in (the user creation trigger has already run for
 * any new account; legacy ones can be backfilled with a one-off
 * script if needed).
 */
export async function setSlots(
  userId: string,
  counts: Pick<Slots, 'certificate' | 'drone' | 'operator' | 'pdf' | 'nfc_badge' | 'personalization'>,
): Promise<void> {
  if (DEMO_MODE) {
    const cur = await demo.ensureSlots(userId);
    return demo.setSlots(userId, { ...cur, ...counts });
  }
  await awaitFirebaseAuthReady();
  const db = getFirebaseDb();
  await updateDoc(doc(db, SLOTS, userId), {
    ...counts,
    updatedAt: new Date().toISOString(),
  });
}

/** Admin-only: list every slots doc. */
export async function listAllSlots(): Promise<Slots[]> {
  if (DEMO_MODE) return demo.listAllSlots();
  await awaitFirebaseAuthReady();
  const db = getFirebaseDb();
  const snap = await getDocs(collection(db, SLOTS));
  return snap.docs.map((d) => slotsFromRaw(d.id, d.data() as Record<string, unknown>));
}
