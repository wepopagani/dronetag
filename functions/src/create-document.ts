/**
 * createDocument — owner-only callable for arbitrary uploaded PDFs/files.
 * verificationStatus is forced to 'unverified' (V-003).
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

const KINDS = new Set([
  'insurance_policy',
  'operator_license',
  'drone_registration',
  'training_certificate',
  'identity',
  'other',
]);

const ALLOWED_MIME = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
]);

interface Input {
  kind?: string;
  label?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  notes?: string;
}

export const createDocument = onCall<Input>(async (request) => {
  requireAppCheck(request, 'createDocument');
  const ctx = requireAuth(request);

  const kind = cleanString(request.data.kind, 32);
  if (!KINDS.has(kind)) {
    throw new HttpsError('invalid-argument', 'Invalid document kind.');
  }

  // V-019: required + allowlisted host (sanitizeAllowedUrl throws on a
  // disallowed value with the host list embedded in the message).
  const fileUrl = sanitizeAllowedUrl(request.data.fileUrl, 'fileUrl');
  if (!fileUrl) {
    throw new HttpsError('invalid-argument', 'fileUrl is required.');
  }

  const mimeType = cleanString(request.data.mimeType, 64);
  if (mimeType && !ALLOWED_MIME.has(mimeType)) {
    throw new HttpsError('invalid-argument', 'mimeType not allowed.');
  }

  const fileSizeRaw = Number(request.data.fileSize);
  const fileSize = Number.isFinite(fileSizeRaw) && fileSizeRaw >= 0
    ? Math.min(fileSizeRaw, 50 * 1024 * 1024)
    : 0;

  await enforceQuota(ctx.uid, 'pdf');

  const ref = await getFirestore().collection('documents').add({
    userId: ctx.uid,
    kind,
    label: cleanString(request.data.label, 200),
    fileUrl,
    fileName: cleanString(request.data.fileName, 255),
    fileSize,
    mimeType,
    verificationStatus: 'unverified',
    notes: cleanString(request.data.notes, 4000),
    createdAt: nowIso(),
    updatedAt: nowIso(),
  });

  return { id: ref.id };
});
