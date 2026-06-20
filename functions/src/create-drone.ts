/**
 * createDrone — owner-only callable that mints a drone with a unique
 * slug. Replaces the previous client `addDoc('drones', ...)` path.
 *
 * Closes V-004 (slot quota enforced server-side) and ensures audit
 * fields (`verificationStatus`, `lastVerifiedAt`, `migration`) are
 * never set from the client.
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';
import {
  cleanString,
  enforceQuota,
  nowIso,
  requireAppCheck,
  requireAuth,
} from './util';

const SLUG_ALPHABET = '0123456789abcdefghjkmnpqrstvwxyz';
const SLUG_RETRIES = 8;

function randomSlug(length = 8): string {
  const buf = new Uint8Array(length);
  // Node 18+ has globalThis.crypto.
  globalThis.crypto.getRandomValues(buf);
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += SLUG_ALPHABET[buf[i]! % SLUG_ALPHABET.length];
  }
  return out;
}

const DRONE_CLASSES = new Set(['C0', 'C1', 'C2', 'C3', 'C4', 'unknown']);
const STATUSES = new Set(['draft', 'active', 'suspended', 'archived']);
const VISIBILITIES = new Set(['private', 'public']);

interface Input {
  manufacturer?: string;
  model?: string;
  classMarking?: string;
  droneSerialNumber?: string;
  controllerSerialNumber?: string;
  defaultOperatorId?: string;
  insuranceId?: string | null;
  status?: string;
  visibility?: string;
}

export const createDrone = onCall<Input>(async (request) => {
  requireAppCheck(request, 'createDrone');
  const ctx = requireAuth(request);

  const manufacturer = cleanString(request.data.manufacturer, 200);
  const model = cleanString(request.data.model, 200);
  const classMarking = (cleanString(request.data.classMarking, 16) || 'unknown');
  const droneSerialNumber = cleanString(request.data.droneSerialNumber, 200);
  const controllerSerialNumber = cleanString(request.data.controllerSerialNumber, 200);
  const defaultOperatorId = cleanString(request.data.defaultOperatorId, 128);
  const insuranceIdRaw = request.data.insuranceId;
  const insuranceId = typeof insuranceIdRaw === 'string' && insuranceIdRaw ? insuranceIdRaw : null;
  const status = STATUSES.has(cleanString(request.data.status, 16)) ? cleanString(request.data.status, 16) : 'draft';
  const visibility = VISIBILITIES.has(cleanString(request.data.visibility, 16))
    ? cleanString(request.data.visibility, 16)
    : 'private';

  if (!manufacturer || !model) {
    throw new HttpsError('invalid-argument', 'manufacturer and model are required.');
  }
  if (!DRONE_CLASSES.has(classMarking)) {
    throw new HttpsError('invalid-argument', 'Invalid classMarking.');
  }
  if (!defaultOperatorId) {
    throw new HttpsError('invalid-argument', 'defaultOperatorId is required.');
  }

  const db = getFirestore();

  // Verify the operator belongs to the caller.
  const opSnap = await db.collection('operators').doc(defaultOperatorId).get();
  if (!opSnap.exists || (opSnap.data() as { userId?: string }).userId !== ctx.uid) {
    throw new HttpsError('failed-precondition', 'Operator does not belong to caller.');
  }

  // Verify the insurance (if any) belongs to the caller.
  if (insuranceId) {
    const insSnap = await db.collection('insurances').doc(insuranceId).get();
    if (!insSnap.exists || (insSnap.data() as { userId?: string }).userId !== ctx.uid) {
      throw new HttpsError('failed-precondition', 'Insurance does not belong to caller.');
    }
  }

  await enforceQuota(ctx.uid, 'drone');

  // Mint a unique slug.
  let slug = '';
  for (let i = 0; i < SLUG_RETRIES; i += 1) {
    const candidate = randomSlug();
    const collision = await db
      .collection('drones')
      .where('slug', '==', candidate)
      .limit(1)
      .get();
    if (collision.empty) {
      slug = candidate;
      break;
    }
  }
  if (!slug) throw new HttpsError('internal', 'Could not allocate a unique slug.');

  const ref = db.collection('drones').doc();
  const now = nowIso();
  await ref.set({
    userId: ctx.uid,
    slug,
    status,
    visibility,
    verificationStatus: 'unverified', // V-003: never client-supplied.
    manufacturer,
    model,
    classMarking,
    droneSerialNumber,
    controllerSerialNumber,
    linkedPilotId: ctx.uid,
    defaultOperatorId,
    activeOperatorId: null,
    activeOperatorUntil: null,
    activeOperatorSetAt: '',
    activeOperatorSetBy: '',
    activeOperatorReason: '',
    insuranceId,
    createdAt: now,
    updatedAt: now,
    publishedAt: '',
    lastVerifiedAt: '',
  });

  return { id: ref.id, slug };
});
