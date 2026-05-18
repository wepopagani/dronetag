/**
 * Public drone snapshot collection — `dronesPublic/{slug}`.
 *
 * Closes V-001 / V-002 / V-015 / V-016: anonymous users can ONLY read
 * this collection. Raw `drones/*` is private to owner+admin via the
 * Firestore rules introduced in PR-SEC-1.
 *
 * The snapshot is denormalised at WRITE time (not read time) so that:
 *   1. Firestore rules can stay simple — anonymous reads on a single
 *      doc-by-id path with no joins.
 *   2. The public response carries ONLY the projected card payload; raw
 *      drone fields (controllerSerial, audit metadata, defaultOperatorId,
 *      etc.) never reach the network.
 *   3. Reads are cheap — no fan-out across pilots/operators/insurances on
 *      every QR scan.
 *
 * `syncDronePublicSnapshot` is the single source of truth for the
 * snapshot's contents. Every mutation that affects the projection
 * (drone update, active-operator switch, pilot/operator/insurance
 * change) must call this helper or `resyncUserPublicDrones` so the
 * snapshot stays current.
 */

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
} from 'firebase/firestore';

import { awaitFirebaseAuthReady } from '@/lib/firebase/auth';
import { DEMO_MODE, getFirebaseDb } from '@/lib/firebase/config';
import * as demo from '@/lib/demo/entitiesStore';
import { getInsurance } from '@/lib/firebase/insurances';
import { getOperator } from '@/lib/firebase/operators';
import { getPilot } from '@/lib/firebase/pilots';
import { listDronesByUser } from '@/lib/firebase/drones';
import type {
  Drone,
  DronePublicSnapshot,
  Insurance,
  Operator,
  Pilot,
} from '@/lib/types/entities';
import type { PolicyStatus, VerificationStatus } from '@/lib/types';
import {
  effectiveOperatorId,
  operatorDisplayName,
  pilotDisplayName,
} from '@/lib/utils/entities';
import { computePolicyStatus } from '@/lib/utils';
import { maskPolicyNumber } from '@/lib/utils/publicProjection';

const DRONES_PUBLIC = 'dronesPublic';

// ─── Raw → typed conversion ────────────────────────────────────────────────

function snapshotFromRaw(slug: string, raw: Record<string, unknown>): DronePublicSnapshot {
  const str = (k: string) => (typeof raw[k] === 'string' ? (raw[k] as string) : '');
  return {
    slug,
    droneId: str('droneId'),
    verificationStatus: (str('verificationStatus') || 'unverified') as VerificationStatus,
    lastVerifiedAt: str('lastVerifiedAt'),
    publishedAt: str('publishedAt'),
    holderKind: ((['pilot', 'operator-private', 'operator-company'] as const).includes(
      str('holderKind') as 'pilot' | 'operator-private' | 'operator-company',
    )
      ? (str('holderKind') as DronePublicSnapshot['holderKind'])
      : 'pilot') as DronePublicSnapshot['holderKind'],
    holderDisplayName: str('holderDisplayName'),
    manufacturer: str('manufacturer'),
    model: str('model'),
    classMarking: (str('classMarking') || 'unknown') as DronePublicSnapshot['classMarking'],
    droneSerialNumber: str('droneSerialNumber'),
    insuranceStatus: ((['valid', 'expiring', 'expired', 'missing'] as const).includes(
      str('insuranceStatus') as PolicyStatus,
    )
      ? (str('insuranceStatus') as DronePublicSnapshot['insuranceStatus'])
      : 'missing') as DronePublicSnapshot['insuranceStatus'],
    insuranceProvider: str('insuranceProvider'),
    insuranceValidUntil: str('insuranceValidUntil'),
    insuranceMaskedPolicyNumber: str('insuranceMaskedPolicyNumber'),
    insurancePdfUrl: str('insurancePdfUrl'),
    updatedAt: str('updatedAt'),
  };
}

// ─── Reads ─────────────────────────────────────────────────────────────────

/**
 * Anonymous-friendly read — does NOT call `awaitFirebaseAuthReady` so
 * a public visitor doesn't pay for an auth round-trip on a QR scan.
 */
export async function getDronePublicBySlug(slug: string): Promise<DronePublicSnapshot | null> {
  if (DEMO_MODE) return demo.getDronePublicBySlug(slug);
  if (!slug) return null;
  const db = getFirebaseDb();
  const snap = await getDoc(doc(db, DRONES_PUBLIC, slug));
  if (!snap.exists()) return null;
  return snapshotFromRaw(slug, snap.data() as Record<string, unknown>);
}

/** Admin-only: enumerate every public snapshot (used by backfill diagnostics). */
export async function listAllDronesPublic(): Promise<DronePublicSnapshot[]> {
  if (DEMO_MODE) return demo.listAllDronesPublic();
  await awaitFirebaseAuthReady();
  const db = getFirebaseDb();
  const snap = await getDocs(collection(db, DRONES_PUBLIC));
  return snap.docs.map((d) => snapshotFromRaw(d.id, d.data() as Record<string, unknown>));
}

// ─── Writes (owner / admin only) ───────────────────────────────────────────

async function setSnapshot(snapshot: DronePublicSnapshot): Promise<void> {
  if (DEMO_MODE) return demo.setDronePublic(snapshot);
  await awaitFirebaseAuthReady();
  const db = getFirebaseDb();
  await setDoc(doc(db, DRONES_PUBLIC, snapshot.slug), snapshot);
}

async function deleteSnapshot(slug: string): Promise<void> {
  if (DEMO_MODE) return demo.deleteDronePublicBySlug(slug);
  await awaitFirebaseAuthReady();
  const db = getFirebaseDb();
  try {
    await deleteDoc(doc(db, DRONES_PUBLIC, slug));
  } catch (err: unknown) {
    const code = typeof err === 'object' && err !== null && 'code' in err
      ? String((err as { code: unknown }).code) : '';
    if (code === 'not-found' || code === 'permission-denied') return;
    throw err;
  }
}

// ─── Projection helper ─────────────────────────────────────────────────────

/**
 * Build the public snapshot for a drone by joining its effective operator
 * (lazy 24h TTL), linked pilot, and optional insurance. Pure function:
 * the caller decides whether to write or delete based on the drone's
 * status / visibility.
 */
export function projectSnapshot(
  drone: Drone,
  effectiveOperator: Operator | null,
  pilot: Pilot | null,
  insurance: Insurance | null,
): DronePublicSnapshot {
  let holderKind: DronePublicSnapshot['holderKind'] = 'pilot';
  let holderDisplayName = '—';
  if (effectiveOperator) {
    holderKind = effectiveOperator.kind === 'company' ? 'operator-company' : 'operator-private';
    holderDisplayName = operatorDisplayName(effectiveOperator);
  } else if (pilot) {
    holderKind = 'pilot';
    holderDisplayName = pilotDisplayName(pilot);
  }

  const insuranceStatus: PolicyStatus = insurance ? computePolicyStatus(insurance) : 'missing';

  return {
    slug: drone.slug,
    droneId: drone.id,
    verificationStatus: drone.verificationStatus,
    lastVerifiedAt: drone.lastVerifiedAt,
    publishedAt: drone.publishedAt,
    holderKind,
    holderDisplayName,
    manufacturer: drone.manufacturer,
    model: drone.model,
    classMarking: drone.classMarking,
    droneSerialNumber: drone.droneSerialNumber,
    insuranceStatus,
    insuranceProvider: insurance?.provider ?? '',
    insuranceValidUntil: insurance?.expiryDate ?? '',
    insuranceMaskedPolicyNumber: insurance?.policyNumber
      ? maskPolicyNumber(insurance.policyNumber)
      : '',
    insurancePdfUrl: insurance?.pdfUrl ?? '',
    updatedAt: new Date().toISOString(),
  };
}

// ─── Sync API ──────────────────────────────────────────────────────────────

/**
 * Bring `dronesPublic/{slug}` in line with the current state of `drone`.
 *
 * - If the drone is `status === 'active' && visibility === 'public'`, fetch
 *   the linked entities, project, and upsert the snapshot.
 * - Otherwise, delete the snapshot (no-op if absent).
 *
 * Failures are swallowed and logged — a sync error must NEVER block the
 * primary write that triggered it; the worst case is a stale snapshot
 * which the next backfill or owner save can correct.
 */
export async function syncDronePublicSnapshot(drone: Drone): Promise<void> {
  try {
    if (drone.status !== 'active' || drone.visibility !== 'public') {
      await deleteSnapshot(drone.slug);
      return;
    }
    const effId = effectiveOperatorId(drone);
    const [op, pilot, insurance] = await Promise.all([
      effId ? getOperator(effId) : Promise.resolve<Operator | null>(null),
      drone.linkedPilotId ? getPilot(drone.linkedPilotId) : Promise.resolve<Pilot | null>(null),
      drone.insuranceId ? getInsurance(drone.insuranceId) : Promise.resolve<Insurance | null>(null),
    ]);
    const snapshot = projectSnapshot(drone, op, pilot, insurance);
    await setSnapshot(snapshot);
  } catch (err) {
    console.warn('[dronesPublic] sync failed', { slug: drone.slug, droneId: drone.id, err });
  }
}

/**
 * Re-sync every public-active drone owned by `uid`. Called from the
 * owner-side update paths for pilot, operators and insurances so a
 * change in those entities propagates to all of the user's public
 * drone cards without each callsite knowing which drones to touch.
 *
 * Cost: O(public drones owned by user) Firestore reads + writes per
 * invocation. Acceptable for a per-user dashboard with single-digit drones.
 */
export async function resyncUserPublicDrones(uid: string): Promise<void> {
  if (!uid) return;
  try {
    const drones = await listDronesByUser(uid);
    await Promise.all(
      drones
        .filter((d) => d.status === 'active' && d.visibility === 'public')
        .map((d) => syncDronePublicSnapshot(d)),
    );
  } catch (err) {
    console.warn('[dronesPublic] resyncUserPublicDrones failed', { uid, err });
  }
}

/**
 * Public delete — exposed so the data-layer's deleteDrone path can drop
 * the snapshot atomically with the underlying drone removal.
 */
export async function deleteDronePublicBySlug(slug: string): Promise<void> {
  await deleteSnapshot(slug);
}
