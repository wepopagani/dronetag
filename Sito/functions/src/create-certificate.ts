/**
 * createCertificate — owner-only callable. verificationStatus is
 * forced to 'unverified' (V-003); admins flip it via the admin queue.
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';
import {
  cleanString,
  enforceQuota,
  nowIso,
  requireAppCheck,
  requireAuth,
  sanitizeAllowedUrl,
} from './util';

const KINDS = new Set(['A1_A3', 'A2', 'STS_THEORETICAL', 'STS_01', 'STS_02', 'custom']);

interface Input {
  kind?: string;
  label?: string;
  issuedBy?: string;
  issuedAt?: string;
  expiresAt?: string;
  fileUrl?: string;
  notes?: string;
}

export const createCertificate = onCall<Input>(async (request) => {
  requireAppCheck(request, 'createCertificate');
  const ctx = requireAuth(request);

  const kind = cleanString(request.data.kind, 32);
  if (!KINDS.has(kind)) {
    throw new HttpsError('invalid-argument', 'Invalid certificate kind.');
  }
  const label = cleanString(request.data.label, 200);
  if (kind === 'custom' && !label) {
    throw new HttpsError('invalid-argument', 'Custom certificate requires a label.');
  }

  const issuedAt = cleanString(request.data.issuedAt, 32);
  const expiresAt = cleanString(request.data.expiresAt, 32);
  if (issuedAt && expiresAt && expiresAt < issuedAt) {
    throw new HttpsError('invalid-argument', 'expiresAt must be on or after issuedAt.');
  }

  await enforceQuota(ctx.uid, 'certificate');

  // V-019: only Firebase Storage / configured trusted hosts.
  const fileUrl = sanitizeAllowedUrl(request.data.fileUrl, 'fileUrl');

  const ref = await getFirestore().collection('certificates').add({
    userId: ctx.uid,
    kind,
    label,
    issuedBy: cleanString(request.data.issuedBy, 200),
    issuedAt,
    expiresAt,
    fileUrl,
    verificationStatus: 'unverified',
    notes: cleanString(request.data.notes, 4000),
    createdAt: nowIso(),
    updatedAt: nowIso(),
  });

  return { id: ref.id };
});
