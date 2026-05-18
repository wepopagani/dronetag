/**
 * DroneTag Cloud Functions entry point (PR-SEC-2).
 *
 * Exposes callable functions that own the create paths for the
 * privileged collections. Clients can no longer call `addDoc()` for
 * drones/operators/certificates/documents/insurances/reports — Firestore
 * rules deny direct creates and force the client through these functions.
 *
 * Each function:
 *   • Verifies the App Check token (monitor mode in dev).
 *   • Validates auth state and required claims.
 *   • Enforces server-side ownership + quota + rate limits.
 *   • Sanitises payloads; never trusts client-supplied audit fields.
 */

import { initializeApp, getApps } from 'firebase-admin/app';
import { setGlobalOptions } from 'firebase-functions/v2';

import { submitReport } from './submit-report';
import { createDrone } from './create-drone';
import { createOperator } from './create-operator';
import { createCertificate } from './create-certificate';
import { createDocument } from './create-document';
import { createInsurance } from './create-insurance';
import { bootstrapSlots } from './bootstrap-slots';

if (getApps().length === 0) initializeApp();

setGlobalOptions({
  region: 'us-central1',
  maxInstances: 20,
  timeoutSeconds: 30,
});

export {
  submitReport,
  createDrone,
  createOperator,
  createCertificate,
  createDocument,
  createInsurance,
  bootstrapSlots,
};
