/**
 * Slot bootstrap — closes V-008 (PR-SEC-4).
 *
 * Triggered by Firebase Auth on user creation. Writes
 * `slots/{uid}` with the base-plan caps so every newly-created
 * account starts with a deterministic quota document. The client
 * no longer attempts to seed this collection (Firestore rules
 * deny owner writes), which is what V-008 flagged: a client-side
 * `setDoc(slots/{uid})` would silently fail in production.
 *
 * Idempotency is enforced by `setDoc(..., { merge: false })` on a
 * `runTransaction` that aborts when the doc already exists. The
 * trigger is therefore safe to re-run / re-deploy.
 */

import { auth } from 'firebase-functions/v1';
import * as logger from 'firebase-functions/logger';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// Mirrors src/lib/types/entities.ts BASE_SLOTS. Kept inline so this
// function package compiles standalone without reaching into the
// Next.js src/ tree.
const BASE_SLOTS = {
  certificate: 1,
  drone: 1,
  operator: 1,
  pdf: 1,
  nfc_badge: 0,
  personalization: 0,
} as const;

export const bootstrapSlots = auth.user().onCreate(async (user) => {
  const uid = user.uid;
  if (!uid) return;
  const db = getFirestore();
  const ref = db.collection('slots').doc(uid);

  try {
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (snap.exists) {
        // Already provisioned — no-op.
        logger.info('[bootstrapSlots] already exists', { uid });
        return;
      }
      tx.set(ref, {
        userId: uid,
        ...BASE_SLOTS,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        // Audit field so we can tell automatic vs manual writes apart.
        provisionedBy: 'auth.user.onCreate',
      });
    });
    logger.info('[bootstrapSlots] provisioned', { uid });
  } catch (err) {
    // Never fail a user-create on slot bootstrap; an admin can
    // backfill manually if anything goes wrong.
    logger.error('[bootstrapSlots] failed', { uid, err });
  }
});
