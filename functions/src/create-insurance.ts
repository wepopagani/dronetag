/**
 * createInsurance — owner-only callable. Cross-checks the linked
 * drone or operator belongs to the caller. verificationStatus forced
 * to 'unverified' (V-003).
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';
import {
  cleanString,
  nowIso,
  requireAppCheck,
  requireAuth,
  sanitizeAllowedUrl,
} from './util';

interface Input {
  link?: string;
  droneId?: string | null;
  operatorId?: string | null;
  provider?: string;
  policyNumber?: string;
  issueDate?: string;
  expiryDate?: string;
  notes?: string;
  pdfUrl?: string;
}

export const createInsurance = onCall<Input>(async (request) => {
  requireAppCheck(request, 'createInsurance');
  const ctx = requireAuth(request);

  const link = cleanString(request.data.link, 16);
  if (link !== 'drone' && link !== 'operator') {
    throw new HttpsError('invalid-argument', 'link must be "drone" or "operator".');
  }

  const provider = cleanString(request.data.provider, 200);
  const policyNumber = cleanString(request.data.policyNumber, 128);
  if (!provider || !policyNumber) {
    throw new HttpsError('invalid-argument', 'provider and policyNumber are required.');
  }

  const issueDate = cleanString(request.data.issueDate, 32);
  const expiryDate = cleanString(request.data.expiryDate, 32);
  if (issueDate && expiryDate && expiryDate < issueDate) {
    throw new HttpsError('invalid-argument', 'expiryDate must be on or after issueDate.');
  }

  const droneId = link === 'drone' && typeof request.data.droneId === 'string' ? request.data.droneId : null;
  const operatorId = link === 'operator' && typeof request.data.operatorId === 'string' ? request.data.operatorId : null;

  const db = getFirestore();
  if (droneId) {
    const ds = await db.collection('drones').doc(droneId).get();
    if (!ds.exists || (ds.data() as { userId?: string }).userId !== ctx.uid) {
      throw new HttpsError('failed-precondition', 'Linked drone does not belong to caller.');
    }
  }
  if (operatorId) {
    const os = await db.collection('operators').doc(operatorId).get();
    if (!os.exists || (os.data() as { userId?: string }).userId !== ctx.uid) {
      throw new HttpsError('failed-precondition', 'Linked operator does not belong to caller.');
    }
  }

  // No quota: insurance is a sub-resource of operators/drones; their
  // quotas already cap how many insurances a user can effectively use.

  // V-019: PDF URL must point at Firebase Storage (or a configured
  // trusted host); otherwise reject with a clear list of allowed hosts.
  const pdfUrl = sanitizeAllowedUrl(request.data.pdfUrl, 'pdfUrl');

  const ref = await db.collection('insurances').add({
    userId: ctx.uid,
    link,
    droneId,
    operatorId,
    provider,
    policyNumber,
    issueDate,
    expiryDate,
    notes: cleanString(request.data.notes, 4000),
    pdfUrl,
    verificationStatus: 'unverified',
    createdAt: nowIso(),
    updatedAt: nowIso(),
  });

  return { id: ref.id };
});
