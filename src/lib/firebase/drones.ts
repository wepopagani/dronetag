/**
 * Drones collection — the unit of public addressing.
 *
 * Path: `drones/{droneId}` with a `userId` field and a unique `slug`.
 *
 * PR-SEC-1 changes:
 *   • Raw `drones` are now PRIVATE — only the owner and admin can read.
 *     Anonymous public visitors read sanitised snapshots from the
 *     `dronesPublic` collection (see `src/lib/firebase/dronesPublic.ts`).
 *   • Every successful write to a drone re-syncs the public snapshot,
 *     so the public card stays consistent without a Cloud Function.
 *   • Active-operator override timestamps are stored as Firestore
 *     `Timestamp` values so rules can clamp the TTL to ≤ 24h with
 *     arithmetic (V-007). The data layer converts to/from ISO strings
 *     at the boundary so the rest of the codebase keeps using strings.
 *   • `setActiveOperator()` requires a non-empty `setBy` (the rules
 *     verify it equals `request.auth.uid`); callers that don't provide
 *     one will be rejected by Firestore.
 */

import {
  Timestamp,
  collection, deleteDoc, doc, getDoc, getDocs,
  limit, orderBy, query, serverTimestamp, updateDoc, where,
} from 'firebase/firestore';

import { awaitFirebaseAuthReady } from '@/lib/firebase/auth';
import { DEMO_MODE, getFirebaseDb } from '@/lib/firebase/config';
import * as demo from '@/lib/demo/entitiesStore';
import { generateDroneSlug } from '@/lib/utils/entities';
import {
  deleteDronePublicBySlug,
  syncDronePublicSnapshot,
} from '@/lib/firebase/dronesPublic';
import { adminFetch } from '@/lib/client/adminApi';
import type {
  Drone,
  DroneClass,
  DroneStatus,
  DroneVisibility,
} from '@/lib/types/entities';
import type { VerificationStatus } from '@/lib/types';

const DRONES = 'drones';
const SLUG_MAX_RETRIES = 8;

// ─── Wire-format conversion helpers ────────────────────────────────────────

/**
 * Read a Firestore field that may be either a Firestore `Timestamp`
 * (new wire format introduced in PR-SEC-1) or a legacy ISO string,
 * returning an ISO string so downstream code keeps using strings.
 */
function readTimestampOrString(v: unknown): string {
  if (typeof v === 'string') return v;
  if (v && typeof v === 'object') {
    const maybe = v as { toDate?: () => Date };
    if (typeof maybe.toDate === 'function') {
      try { return maybe.toDate().toISOString(); } catch { /* ignore */ }
    }
  }
  return '';
}
function readTimestampOrStringOrNull(v: unknown): string | null {
  const s = readTimestampOrString(v);
  return s || null;
}

function droneFromRaw(id: string, raw: Record<string, unknown>): Drone {
  const str = (k: string) => (typeof raw[k] === 'string' ? (raw[k] as string) : '');
  const optStr = (k: string) =>
    typeof raw[k] === 'string' ? (raw[k] as string) : null;

  return {
    id,
    userId: str('userId'),
    slug: str('slug'),
    status: (str('status') || 'draft') as DroneStatus,
    visibility: (str('visibility') || 'private') as DroneVisibility,
    verificationStatus: (str('verificationStatus') || 'unverified') as VerificationStatus,
    manufacturer: str('manufacturer'),
    model: str('model'),
    classMarking: (str('classMarking') || 'unknown') as DroneClass,
    droneSerialNumber: str('droneSerialNumber'),
    controllerSerialNumber: str('controllerSerialNumber'),
    linkedPilotId: str('linkedPilotId'),
    defaultOperatorId: str('defaultOperatorId'),
    activeOperatorId: optStr('activeOperatorId'),
    activeOperatorUntil: readTimestampOrStringOrNull(raw['activeOperatorUntil']),
    activeOperatorSetAt: readTimestampOrString(raw['activeOperatorSetAt']),
    activeOperatorSetBy: str('activeOperatorSetBy'),
    activeOperatorReason: str('activeOperatorReason'),
    insuranceId: optStr('insuranceId'),
    createdAt: str('createdAt'),
    updatedAt: str('updatedAt'),
    publishedAt: str('publishedAt'),
    lastVerifiedAt: str('lastVerifiedAt'),
    dataLockedAt: str('dataLockedAt'),
  };
}

// ─── Reads ──────────────────────────────────────────────────────────────────

export async function listDronesByUser(userId: string): Promise<Drone[]> {
  if (DEMO_MODE) return demo.listDronesByUser(userId);
  await awaitFirebaseAuthReady();
  const db = getFirebaseDb();
  const snap = await getDocs(
    query(collection(db, DRONES), where('userId', '==', userId)),
  );
  return snap.docs
    .map((d) => droneFromRaw(d.id, d.data() as Record<string, unknown>))
    .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
}

export async function getDrone(id: string): Promise<Drone | null> {
  if (DEMO_MODE) return demo.getDrone(id);
  await awaitFirebaseAuthReady();
  const db = getFirebaseDb();
  const snap = await getDoc(doc(db, DRONES, id));
  if (!snap.exists()) return null;
  return droneFromRaw(snap.id, snap.data() as Record<string, unknown>);
}

/**
 * Resolve a drone by slug. Owner and admin only — anonymous visitors must
 * use `getDronePublicBySlug()` from `dronesPublic.ts` (PR-SEC-1).
 */
export async function getDroneBySlug(slug: string): Promise<Drone | null> {
  if (DEMO_MODE) return demo.getDroneBySlug(slug);
  await awaitFirebaseAuthReady();
  const db = getFirebaseDb();
  const q = query(collection(db, DRONES), where('slug', '==', slug), limit(1));
  const snap = await getDocs(q);
  const first = snap.docs[0];
  if (!first) return null;
  return droneFromRaw(first.id, first.data() as Record<string, unknown>);
}

async function slugExists(slug: string): Promise<boolean> {
  if (DEMO_MODE) return (await demo.getDroneBySlug(slug)) !== null;
  const db = getFirebaseDb();
  const q = query(collection(db, DRONES), where('slug', '==', slug), limit(1));
  const snap = await getDocs(q);
  return !snap.empty;
}

async function findFreeSlug(preferred?: string): Promise<string> {
  let candidate = preferred?.trim() || generateDroneSlug();
  for (let i = 0; i < SLUG_MAX_RETRIES; i += 1) {
    if (!(await slugExists(candidate))) return candidate;
    candidate = generateDroneSlug();
  }
  throw new Error('drones: failed to mint a unique slug after retries');
}

// ─── Writes ─────────────────────────────────────────────────────────────────

/**
 * Server-side create via `/api/entities/drones` (Admin SDK).
 * Mints a unique slug, validates operator ownership, enforces quota.
 */
export async function createDrone(
  data: Omit<Drone, 'id' | 'slug' | 'createdAt' | 'updatedAt'> & { slug?: string },
): Promise<{ id: string; slug: string }> {
  if (DEMO_MODE) {
    const slug = await findFreeSlug(data.slug);
    const id = await demo.createDrone({ ...data, slug });
    const fresh = await demo.getDrone(id);
    if (fresh) await syncDronePublicSnapshot(fresh);
    return { id, slug };
  }
  await awaitFirebaseAuthReady();
  const res = await adminFetch('/api/entities/drones', {
    method: 'POST',
    body: JSON.stringify({
      manufacturer: data.manufacturer,
      model: data.model,
      classMarking: data.classMarking,
      droneSerialNumber: data.droneSerialNumber,
      controllerSerialNumber: data.controllerSerialNumber,
      defaultOperatorId: data.defaultOperatorId,
      insuranceId: data.insuranceId,
      status: data.status,
      visibility: data.visibility,
    }),
  });
  const body = (await res.json().catch(() => ({}))) as {
    id?: string;
    slug?: string;
    error?: string;
  };
  if (!res.ok) {
    throw new Error(body.error || `create drone failed (${res.status})`);
  }
  if (!body.id || !body.slug) {
    throw new Error('create drone failed: missing id or slug');
  }
  const result = { id: body.id, slug: body.slug };
  const fresh = await getDrone(result.id);
  if (fresh) await syncDronePublicSnapshot(fresh);
  return result;
}

export async function updateDrone(id: string, patch: Partial<Drone>): Promise<void> {
  if (DEMO_MODE) {
    await demo.updateDrone(id, patch);
    const fresh = await demo.getDrone(id);
    if (fresh) await syncDronePublicSnapshot(fresh);
    return;
  }
  await awaitFirebaseAuthReady();
  const db = getFirebaseDb();
  const payload = Object.fromEntries(
    Object.entries(patch).filter(([k, v]) => k !== 'id' && v !== undefined),
  );
  await updateDoc(doc(db, DRONES, id), { ...payload, updatedAt: new Date().toISOString() });
  const fresh = await getDrone(id);
  if (fresh) await syncDronePublicSnapshot(fresh);
}

export async function deleteDrone(id: string): Promise<void> {
  // Capture slug BEFORE delete so we can drop the public snapshot too.
  const before = await getDrone(id);
  if (DEMO_MODE) {
    await demo.deleteDrone(id);
  } else {
    await awaitFirebaseAuthReady();
    const db = getFirebaseDb();
    await deleteDoc(doc(db, DRONES, id));
  }
  if (before?.slug) await deleteDronePublicBySlug(before.slug);
}

// ─── Active-operator switch (PRD §5, PR-SEC-1 hardened) ────────────────────

export const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

export interface SetActiveOperatorOptions {
  /**
   * Uid of the user activating the switch. Required: Firestore rules
   * verify `activeOperatorSetBy == request.auth.uid` so a malicious
   * client cannot pretend the switch was set by someone else.
   */
  setBy: string;
  /** Optional free-text reason supplied by the user. */
  reason?: string;
}

/**
 * Set a temporary active operator. Auto-expires after 24h via the lazy
 * `effectiveOperatorId()` helper at read time.
 *
 * Wire format:
 *   • `activeOperatorUntil` is written as a Firestore `Timestamp`
 *     (now + 24h). Rules clamp this server-side.
 *   • `activeOperatorSetAt` is written as `serverTimestamp()` so the
 *     server, not the client clock, decides the audit timestamp.
 *   • `activeOperatorSetBy` MUST equal the authenticated uid; rules
 *     reject mismatches.
 */
export async function setActiveOperator(
  droneId: string,
  operatorId: string,
  options: SetActiveOperatorOptions,
): Promise<void> {
  if (!options.setBy) {
    throw new Error('setActiveOperator: setBy is required (must be the authenticated uid)');
  }
  if (DEMO_MODE) {
    const nowIso = new Date().toISOString();
    const untilIso = new Date(Date.now() + TWENTY_FOUR_HOURS_MS).toISOString();
    await demo.updateDrone(droneId, {
      activeOperatorId: operatorId,
      activeOperatorUntil: untilIso,
      activeOperatorSetAt: nowIso,
      activeOperatorSetBy: options.setBy,
      activeOperatorReason: options.reason ?? '',
    });
    const fresh = await demo.getDrone(droneId);
    if (fresh) await syncDronePublicSnapshot(fresh);
    return;
  }
  await awaitFirebaseAuthReady();
  const db = getFirebaseDb();
  // Client timestamp, used only to compute the 24h target. The rule
  // accepts a slack of a few minutes between this value and request.time
  // so client clock drift doesn't reject legitimate writes.
  const until = Timestamp.fromMillis(Date.now() + TWENTY_FOUR_HOURS_MS);
  await updateDoc(doc(db, DRONES, droneId), {
    activeOperatorId: operatorId,
    activeOperatorUntil: until,
    activeOperatorSetAt: serverTimestamp(),
    activeOperatorSetBy: options.setBy,
    activeOperatorReason: options.reason ?? '',
    updatedAt: new Date().toISOString(),
  });
  const fresh = await getDrone(droneId);
  if (fresh) await syncDronePublicSnapshot(fresh);
}

/** Clear any active-operator override and revert to the default. */
export async function clearActiveOperator(droneId: string): Promise<void> {
  if (DEMO_MODE) {
    await demo.updateDrone(droneId, {
      activeOperatorId: null,
      activeOperatorUntil: null,
      activeOperatorSetAt: '',
      activeOperatorSetBy: '',
      activeOperatorReason: '',
    });
    const fresh = await demo.getDrone(droneId);
    if (fresh) await syncDronePublicSnapshot(fresh);
    return;
  }
  await awaitFirebaseAuthReady();
  const db = getFirebaseDb();
  await updateDoc(doc(db, DRONES, droneId), {
    activeOperatorId: null,
    activeOperatorUntil: null,
    activeOperatorSetAt: '',
    activeOperatorSetBy: '',
    activeOperatorReason: '',
    updatedAt: new Date().toISOString(),
  });
  const fresh = await getDrone(droneId);
  if (fresh) await syncDronePublicSnapshot(fresh);
}

/** Admin-only: list every drone across users (newest first). */
export async function listAllDrones(): Promise<Drone[]> {
  if (DEMO_MODE) return demo.listAllDrones();
  await awaitFirebaseAuthReady({ refresh: true });
  const db = getFirebaseDb();
  const snap = await getDocs(collection(db, DRONES));
  const drones = snap.docs.map((d) =>
    droneFromRaw(d.id, d.data() as Record<string, unknown>),
  );
  return drones.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
}
