/**
 * Typed wrappers around the DroneTag Cloud Functions.
 *
 * The functions live under `functions/src/*` and are deployed via
 * `firebase deploy --only functions`. After PR-SEC-2, ALL privileged
 * creates (drones, operators, certificates, documents, insurances)
 * AND the anonymous "Report found drone" submission go through these
 * callables; clients no longer call `addDoc()` on those collections.
 *
 * In DEMO_MODE, the data-layer modules short-circuit to the in-memory
 * store and never reach this file.
 */

import { httpsCallable } from 'firebase/functions';
import { getFirebaseFunctions } from '@/lib/firebase/config';

function call<TIn, TOut>(name: string) {
  return async (data: TIn): Promise<TOut> => {
    const fn = httpsCallable<TIn, TOut>(getFirebaseFunctions(), name);
    const res = await fn(data);
    return res.data;
  };
}

export interface SubmitReportInput {
  droneId: string;
  droneSlug: string;
  finderName: string;
  message: string;
  locationText: string;
  contactEmail: string;
  location: { lat: number; lng: number; accuracy: number } | null;
}
export const callSubmitReport = call<SubmitReportInput, { id: string }>('submitReport');

export interface CreateDroneInput {
  manufacturer: string;
  model: string;
  classMarking: string;
  droneSerialNumber: string;
  controllerSerialNumber: string;
  defaultOperatorId: string;
  insuranceId: string | null;
  status: string;
  visibility: string;
}
export const callCreateDrone = call<CreateDroneInput, { id: string; slug: string }>('createDrone');

export interface CreateOperatorInput {
  kind: 'private' | 'company';
  label: string;
  isDefault: boolean;
  private: Record<string, unknown>;
  company: Record<string, unknown>;
}
export const callCreateOperator = call<CreateOperatorInput, { id: string }>('createOperator');

export interface CreateCertificateInput {
  kind: string;
  label: string;
  issuedBy: string;
  issuedAt: string;
  expiresAt: string;
  fileUrl: string;
  notes: string;
}
export const callCreateCertificate = call<CreateCertificateInput, { id: string }>('createCertificate');

export interface CreateDocumentInput {
  kind: string;
  label: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  notes: string;
}
export const callCreateDocument = call<CreateDocumentInput, { id: string }>('createDocument');

export interface CreateInsuranceInput {
  link: 'drone' | 'operator';
  droneId: string | null;
  operatorId: string | null;
  provider: string;
  policyNumber: string;
  issueDate: string;
  expiryDate: string;
  notes: string;
  pdfUrl: string;
}
export const callCreateInsurance = call<CreateInsuranceInput, { id: string }>('createInsurance');
