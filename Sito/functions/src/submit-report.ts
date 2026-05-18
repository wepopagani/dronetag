/**
 * submitReport — anonymous-friendly callable for the public
 * "Report found drone" form.
 *
 * Closes V-005 (drone/owner cross-check) more strictly than
 * firestore.rules can on its own, V-006 (rate limit per IP+slug),
 * and prepares the V-016 path for push/email notification fan-out.
 *
 * Security checks:
 *   • App Check (monitor mode in dev).
 *   • The supplied droneId/droneSlug are looked up against the live
 *     drone; ownerUserId and visibility are derived from the lookup,
 *     never from the client payload.
 *   • Rate limit: 3 reports / 10 minutes / (slug + caller IP).
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import {
  applyRateLimit,
  asEmail,
  cleanString,
  requireAppCheck,
  nowIso,
} from './util';

interface SubmitReportInput {
  droneId?: string;
  droneSlug?: string;
  finderName?: string;
  message?: string;
  locationText?: string;
  contactEmail?: string;
  location?: { lat?: number; lng?: number; accuracy?: number } | null;
}

export const submitReport = onCall<SubmitReportInput>(
  {
    cors: true,
    enforceAppCheck: false, // App Check is gated by util.requireAppCheck
  },
  async (request) => {
    requireAppCheck(request, 'submitReport');

    const data = request.data ?? {};
    const droneId = cleanString(data.droneId, 128);
    const droneSlug = cleanString(data.droneSlug, 128);
    if (!droneId || !droneSlug) {
      throw new HttpsError('invalid-argument', 'droneId and droneSlug are required.');
    }

    // Per-(slug + ip) rate limit. Anonymous calls have no auth uid.
    const ip = (request.rawRequest?.ip ?? '0.0.0.0').slice(0, 64);
    await applyRateLimit(`${droneSlug}:${ip}`, {
      bucket: 'submitReport',
      max: 3,
      windowMs: 10 * 60 * 1000,
    });

    const db = getFirestore();
    const droneSnap = await db.collection('drones').doc(droneId).get();
    if (!droneSnap.exists) {
      throw new HttpsError('not-found', 'Unknown drone.');
    }
    const drone = droneSnap.data() as Record<string, unknown>;
    if (
      drone.slug !== droneSlug ||
      drone.visibility !== 'public' ||
      drone.status !== 'active'
    ) {
      throw new HttpsError('failed-precondition', 'Drone is not publicly available.');
    }
    const ownerUserId = typeof drone.userId === 'string' ? drone.userId : '';
    if (!ownerUserId) {
      throw new HttpsError('internal', 'Drone owner not resolvable.');
    }

    // Honeypot already trapped client-side; here we just sanitise.
    const finderName = cleanString(data.finderName, 200);
    const message = cleanString(data.message, 4000);
    const locationText = cleanString(data.locationText, 500);
    const contactEmail = asEmail(data.contactEmail);

    let location: { lat: number; lng: number; accuracy: number } | null = null;
    if (data.location && typeof data.location === 'object') {
      const lat = Number(data.location.lat);
      const lng = Number(data.location.lng);
      const accuracy = Number(data.location.accuracy);
      if (
        Number.isFinite(lat) && lat >= -90 && lat <= 90 &&
        Number.isFinite(lng) && lng >= -180 && lng <= 180
      ) {
        location = {
          lat,
          lng,
          accuracy: Number.isFinite(accuracy) ? Math.max(0, accuracy) : 0,
        };
      }
    }

    const ref = db.collection('reports').doc();
    await ref.set({
      droneId,
      droneSlug,
      ownerUserId,
      finderName,
      message,
      locationText,
      contactEmail,
      location,
      read: false,
      // V-006/V-035 forward-look: the fan-out worker (push/email) reads
      // these flags. Never client-writeable.
      emailNotified: false,
      pushNotified: false,
      createdAt: nowIso(),
      _serverTs: FieldValue.serverTimestamp(),
      _origin: { ip },
    });

    // TODO V-006/V-035: enqueue push + email fanout. For now just log.
    logger.info('[submitReport] accepted', { droneSlug, ownerUserId, reportId: ref.id });

    return { id: ref.id };
  },
);
