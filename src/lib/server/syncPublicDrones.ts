/**
 * Server-side public drone snapshot sync (Firebase Admin SDK).
 *
 * Used when an admin verifies certificates/insurances so `dronesPublic/{slug}`
 * is updated even if the client-side resync fails or the snapshot is stale.
 */

import { projectSnapshot } from '@/lib/firebase/dronesPublic';
import { computePolicyStatus } from '@/lib/utils';
import { effectiveOperatorId } from '@/lib/utils/entities';
import { adminFirestore } from '@/lib/server/firebaseAdmin';
import type {
  Certificate,
  CertificateKind,
  Drone,
  DroneClass,
  DroneStatus,
  DroneVisibility,
  Insurance,
  Operator,
  Pilot,
} from '@/lib/types/entities';
import type { VerificationStatus } from '@/lib/types';

function str(raw: Record<string, unknown>, k: string): string {
  return typeof raw[k] === 'string' ? (raw[k] as string) : '';
}

function optStr(raw: Record<string, unknown>, k: string): string | null {
  return typeof raw[k] === 'string' && raw[k] ? (raw[k] as string) : null;
}

function droneFromRaw(id: string, raw: Record<string, unknown>): Drone {
  return {
    id,
    userId: str(raw, 'userId'),
    slug: str(raw, 'slug'),
    status: (str(raw, 'status') || 'draft') as DroneStatus,
    visibility: (str(raw, 'visibility') || 'private') as DroneVisibility,
    verificationStatus: (str(raw, 'verificationStatus') || 'unverified') as VerificationStatus,
    manufacturer: str(raw, 'manufacturer'),
    model: str(raw, 'model'),
    classMarking: (str(raw, 'classMarking') || 'unknown') as DroneClass,
    droneSerialNumber: str(raw, 'droneSerialNumber'),
    controllerSerialNumber: str(raw, 'controllerSerialNumber'),
    linkedPilotId: str(raw, 'linkedPilotId'),
    defaultOperatorId: str(raw, 'defaultOperatorId'),
    activeOperatorId: optStr(raw, 'activeOperatorId'),
    activeOperatorUntil: optStr(raw, 'activeOperatorUntil'),
    activeOperatorSetAt: str(raw, 'activeOperatorSetAt'),
    activeOperatorSetBy: str(raw, 'activeOperatorSetBy'),
    activeOperatorReason: str(raw, 'activeOperatorReason'),
    insuranceId: optStr(raw, 'insuranceId'),
    createdAt: str(raw, 'createdAt'),
    updatedAt: str(raw, 'updatedAt'),
    publishedAt: str(raw, 'publishedAt'),
    lastVerifiedAt: str(raw, 'lastVerifiedAt'),
    dataLockedAt: str(raw, 'dataLockedAt'),
  };
}

function operatorFromRaw(id: string, raw: Record<string, unknown>): Operator {
  const priv = (raw['private'] ?? {}) as Record<string, unknown>;
  const comp = (raw['company'] ?? {}) as Record<string, unknown>;
  const addrFrom = (a: Record<string, unknown>) => ({
    line1: str(a, 'line1'),
    line2: str(a, 'line2'),
    city: str(a, 'city'),
    postalCode: str(a, 'postalCode'),
    country: str(a, 'country'),
  });
  return {
    id,
    userId: str(raw, 'userId'),
    kind: (str(raw, 'kind') || 'private') as Operator['kind'],
    label: str(raw, 'label'),
    isDefault: raw['isDefault'] === true,
    private: {
      firstName: str(priv, 'firstName'),
      lastName: str(priv, 'lastName'),
      dateOfBirth: str(priv, 'dateOfBirth'),
      email: str(priv, 'email'),
      phone: str(priv, 'phone'),
      address: addrFrom((priv['address'] ?? {}) as Record<string, unknown>),
    },
    company: {
      companyName: str(comp, 'companyName'),
      contactPerson: str(comp, 'contactPerson'),
      vatNumber: str(comp, 'vatNumber'),
      uniqueCompanyNumber: str(comp, 'uniqueCompanyNumber'),
      email: str(comp, 'email'),
      address: addrFrom((comp['address'] ?? {}) as Record<string, unknown>),
    },
    createdAt: str(raw, 'createdAt'),
    updatedAt: str(raw, 'updatedAt'),
  };
}

function pilotFromRaw(uid: string, raw: Record<string, unknown>): Pilot {
  const addr = (raw['address'] ?? {}) as Record<string, unknown>;
  return {
    userId: uid,
    firstName: str(raw, 'firstName'),
    lastName: str(raw, 'lastName'),
    dateOfBirth: str(raw, 'dateOfBirth'),
    nationality: str(raw, 'nationality'),
    email: str(raw, 'email'),
    phone: str(raw, 'phone'),
    address: {
      line1: str(addr, 'line1'),
      line2: str(addr, 'line2'),
      city: str(addr, 'city'),
      postalCode: str(addr, 'postalCode'),
      country: str(addr, 'country'),
    },
    operatorCode: str(raw, 'operatorCode'),
    operatorLicense: str(raw, 'operatorLicense'),
    emergencyContact: str(raw, 'emergencyContact'),
    createdAt: str(raw, 'createdAt'),
    updatedAt: str(raw, 'updatedAt'),
  };
}

function insuranceFromRaw(id: string, raw: Record<string, unknown>): Insurance {
  return {
    id,
    userId: str(raw, 'userId'),
    link: (str(raw, 'link') || 'drone') as Insurance['link'],
    droneId: optStr(raw, 'droneId'),
    operatorId: optStr(raw, 'operatorId'),
    provider: str(raw, 'provider'),
    policyNumber: str(raw, 'policyNumber'),
    holderName: str(raw, 'holderName'),
    issueDate: str(raw, 'issueDate'),
    expiryDate: str(raw, 'expiryDate'),
    notes: str(raw, 'notes'),
    pdfUrl: str(raw, 'pdfUrl'),
    verificationStatus: (str(raw, 'verificationStatus') || 'unverified') as VerificationStatus,
    createdAt: str(raw, 'createdAt'),
    updatedAt: str(raw, 'updatedAt'),
    dataLockedAt: str(raw, 'dataLockedAt'),
  };
}

function certificateFromRaw(id: string, raw: Record<string, unknown>): Certificate {
  return {
    id,
    userId: str(raw, 'userId'),
    kind: (str(raw, 'kind') || 'custom') as CertificateKind,
    label: str(raw, 'label'),
    registrationNumber: str(raw, 'registrationNumber'),
    issuedBy: str(raw, 'issuedBy'),
    issuedAt: str(raw, 'issuedAt'),
    expiresAt: str(raw, 'expiresAt'),
    fileUrl: str(raw, 'fileUrl'),
    verificationStatus: (str(raw, 'verificationStatus') || 'unverified') as VerificationStatus,
    notes: str(raw, 'notes'),
    createdAt: str(raw, 'createdAt'),
    updatedAt: str(raw, 'updatedAt'),
    dataLockedAt: str(raw, 'dataLockedAt'),
  };
}

/** Re-sync every public-active drone for `uid`. Returns slug count written. */
export async function resyncUserPublicDronesAdmin(uid: string): Promise<number> {
  if (!uid) return 0;

  const db = adminFirestore();
  const droneSnap = await db.collection('drones').where('userId', '==', uid).get();
  const publicDrones = droneSnap.docs
    .map((d) => droneFromRaw(d.id, d.data() as Record<string, unknown>))
    .filter((d) => d.status === 'active' && d.visibility === 'public' && d.slug);

  if (publicDrones.length === 0) return 0;

  const [certSnap, userSnap] = await Promise.all([
    db.collection('certificates').where('userId', '==', uid).get(),
    db.doc(`users/${uid}`).get(),
  ]);

  const certificates = certSnap.docs.map((d) =>
    certificateFromRaw(d.id, d.data() as Record<string, unknown>),
  );
  const userRaw = userSnap.exists ? (userSnap.data() as Record<string, unknown>) : null;
  const branding = {
    profilePhotoUrl: userRaw ? str(userRaw, 'profilePhotoUrl') : '',
    logoUrl: userRaw ? str(userRaw, 'logoUrl') : '',
    bannerUrl: userRaw ? str(userRaw, 'bannerUrl') : '',
  };

  let written = 0;
  for (const drone of publicDrones) {
    const effId = effectiveOperatorId(drone);
    const [opDoc, pilotDoc, insDoc] = await Promise.all([
      effId ? db.doc(`operators/${effId}`).get() : Promise.resolve(null),
      drone.linkedPilotId ? db.doc(`pilots/${drone.linkedPilotId}`).get() : Promise.resolve(null),
      drone.insuranceId ? db.doc(`insurances/${drone.insuranceId}`).get() : Promise.resolve(null),
    ]);

    const op =
      opDoc?.exists
        ? operatorFromRaw(opDoc.id, opDoc.data() as Record<string, unknown>)
        : null;
    const pilot =
      pilotDoc?.exists
        ? pilotFromRaw(pilotDoc.id, pilotDoc.data() as Record<string, unknown>)
        : null;
    const insurance =
      insDoc?.exists
        ? insuranceFromRaw(insDoc.id, insDoc.data() as Record<string, unknown>)
        : null;

    // Sanity-check insurance dates (same as client projection).
    if (insurance) computePolicyStatus(insurance);

    const snapshot = projectSnapshot(drone, op, pilot, insurance, branding, certificates);
    await db.doc(`dronesPublic/${snapshot.slug}`).set(snapshot);
    written += 1;
  }

  return written;
}
