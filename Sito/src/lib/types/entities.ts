/**
 * Multi-entity DroneTag domain types.
 *
 * Lives next to the legacy Profile types in `index.ts` but is intentionally
 * NOT re-exported from there: the new model uses its own collections and
 * imports must be explicit (`@/lib/types/entities`). This avoids name
 * collisions with the legacy `Insurance` / `DocumentType` aliases used by
 * the old single-profile flow, which keeps working until M3.
 */

import type { VerificationStatus } from './index';
import type { Address } from './account';

// ─── Account type ───────────────────────────────────────────────────────────

export type AccountType = 'private' | 'company';

// ─── Pilot (one per user, doc id = userId) ──────────────────────────────────

export interface Pilot {
  userId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationality: string;
  email: string;
  phone: string;
  address: Address;
  operatorCode: string;
  operatorLicense: string;
  emergencyContact: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Operator (up to 3 per user, addressed by random doc id) ────────────────

export type OperatorKind = 'private' | 'company';

export interface OperatorPrivateDetails {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email: string;
  phone: string;
  address: Address;
}

export interface OperatorCompanyDetails {
  companyName: string;
  contactPerson: string;
  vatNumber: string;
  uniqueCompanyNumber: string;
  email: string;
  address: Address;
}

export interface Operator {
  id: string;
  userId: string;
  kind: OperatorKind;
  label: string;
  isDefault: boolean;
  // Both shapes are persisted; only the one matching `kind` is meaningful.
  // Unused fields stay empty so the document shape is always stable.
  private: OperatorPrivateDetails;
  company: OperatorCompanyDetails;
  createdAt: string;
  updatedAt: string;
}

// ─── Drone (the unit of public addressing — slug per drone) ─────────────────

export type DroneClass = 'C0' | 'C1' | 'C2' | 'C3' | 'C4' | 'unknown';
export type DroneStatus = 'draft' | 'active' | 'suspended' | 'archived';
export type DroneVisibility = 'private' | 'public';

export interface Drone {
  id: string;
  userId: string;
  slug: string;

  status: DroneStatus;
  visibility: DroneVisibility;
  verificationStatus: VerificationStatus;

  manufacturer: string;
  model: string;
  classMarking: DroneClass;
  droneSerialNumber: string;
  controllerSerialNumber: string;

  linkedPilotId: string;
  defaultOperatorId: string;
  /** When set with a future `activeOperatorUntil`, takes precedence over `defaultOperatorId`. */
  activeOperatorId: string | null;
  /** ISO. When in the past, the active switch is considered expired. */
  activeOperatorUntil: string | null;

  /**
   * Audit trail for the active-operator switch (PRD §5).
   * Empty strings when no override is active. Kept as required strings
   * (not optional) so the document shape stays stable and admin queries
   * can filter on `activeOperatorSetBy != ''` without missing-field guards.
   */
  activeOperatorSetAt: string;
  activeOperatorSetBy: string;
  activeOperatorReason: string;

  insuranceId: string | null;

  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  lastVerifiedAt: string;
}

// ─── Insurance ──────────────────────────────────────────────────────────────

export type InsuranceLink = 'drone' | 'operator';

export interface Insurance {
  id: string;
  userId: string;
  link: InsuranceLink;
  droneId: string | null;
  operatorId: string | null;

  // Legacy-compatible shape — `computePolicyStatus()` from
  // src/lib/utils/index.ts works on this directly.
  provider: string;
  policyNumber: string;
  issueDate: string;
  expiryDate: string;
  notes: string;
  pdfUrl: string;

  /**
   * Admin verification state. Defaults to 'unverified' on creation; the
   * admin verification queue (M5) flips this to 'verified' / 'rejected'.
   */
  verificationStatus: VerificationStatus;

  createdAt: string;
  updatedAt: string;
}

// ─── Certificate ────────────────────────────────────────────────────────────

export type CertificateKind =
  | 'A1_A3'
  | 'A2'
  | 'STS_THEORETICAL'
  | 'STS_01'
  | 'STS_02'
  | 'custom';

export interface Certificate {
  id: string;
  userId: string;
  kind: CertificateKind;
  /** Free text. Display label for custom; descriptive label otherwise. */
  label: string;
  issuedBy: string;
  issuedAt: string;
  expiresAt: string;
  fileUrl: string;
  verificationStatus: VerificationStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Document (additional uploaded PDFs / files) ───────────────────────────

export type DocumentKind =
  | 'insurance_policy'
  | 'operator_license'
  | 'drone_registration'
  | 'training_certificate'
  | 'identity'
  | 'other';

export interface DocumentRef {
  id: string;
  userId: string;
  kind: DocumentKind;
  label: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  verificationStatus: VerificationStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Slots (per-user purchasable / grantable counts) ───────────────────────

export type SlotKind =
  | 'certificate'
  | 'drone'
  | 'operator'
  | 'pdf'
  | 'nfc_badge'
  | 'personalization';

export interface Slots {
  userId: string;
  certificate: number;
  drone: number;
  operator: number;
  pdf: number;
  nfc_badge: number;
  personalization: number;
  createdAt: string;
  updatedAt: string;
}

/** Base plan caps included with every account (see PRD §4). */
export const BASE_SLOTS: Pick<
  Slots,
  'certificate' | 'drone' | 'operator' | 'pdf' | 'nfc_badge' | 'personalization'
> = {
  certificate: 1,
  drone: 1,
  operator: 1,
  pdf: 1,
  nfc_badge: 0,
  personalization: 0,
};

/** Hard cap on operators per user, regardless of granted slots (PRD §5). */
export const MAX_OPERATORS = 3;

// ─── Plan / pricing (admin-managed, listed by SlotKind) ────────────────────

export interface Plan {
  id: string;
  slotKind: SlotKind;
  /** Unit price in minor units (e.g. cents for CHF). */
  priceCents: number;
  currency: string;
  active: boolean;
  label: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Report (public "Report found drone") ─────────────────────────────────

export interface ReportLocation {
  lat: number;
  lng: number;
  /** GPS reported accuracy in meters; 0 if unknown. */
  accuracy: number;
}

export interface Report {
  id: string;
  droneId: string;
  droneSlug: string;
  ownerUserId: string;
  /** Optional finder name. Empty string when not provided. */
  finderName: string;
  message: string;
  location: ReportLocation | null;
  /** Optional human-readable approximate location (e.g. "Parco Sempione, Milano"). */
  locationText: string;
  /** Optional reporter contact. NEVER displayed publicly elsewhere. */
  contactEmail: string;
  read: boolean;
  /**
   * Notification fan-out fields. Reserved for later (email + push); the
   * shape is committed now so reports created in M3 don't need a follow-up
   * migration once the channels are wired in M5.
   */
  emailNotified: boolean;
  pushNotified: boolean;
  createdAt: string;
}

// ─── Public drone snapshot (PR-SEC-1) ──────────────────────────────────────

/**
 * Sanitised public projection of a drone, stored at `dronesPublic/{slug}`.
 *
 * This collection is the ONLY one anonymous users can read. Raw `drones/*`
 * documents are private to the owner and admins. The snapshot is written
 * by the owner's client (or by the admin / backfill script) every time the
 * underlying drone, its effective operator, linked pilot, or insurance
 * changes. When a drone leaves the public-active state, the snapshot is
 * deleted so anonymous reads return "not found".
 *
 * Fields are intentionally minimal (compare with PublicDroneCardData in
 * src/lib/utils/publicProjection.ts):
 *   • Personal data (DOB, phone, address, full policy number, controller
 *     serial, owner email) is NEVER stored here.
 *   • PR-SEC-4 V-017 closure: `ownerUserId` is GONE. The `submitReport`
 *     Cloud Function (PR-SEC-2) looks up the drone server-side and
 *     derives the owner uid from it; the public client never needs to
 *     know it.
 */
export interface DronePublicSnapshot {
  /** Document id = drone slug. Public URL key. */
  slug: string;
  /** For rules cross-check only: rules verify the writer owns this drone. */
  droneId: string;

  // ─── Card fields ─────────────────────────────────────────────────
  verificationStatus: VerificationStatus;
  lastVerifiedAt: string;
  publishedAt: string;

  /** Holder block — see PublicDroneCardData. */
  holderKind: 'pilot' | 'operator-private' | 'operator-company';
  holderDisplayName: string;

  manufacturer: string;
  model: string;
  classMarking: DroneClass;
  /** Engraved serial; safe to expose for verifier cross-checking. */
  droneSerialNumber: string;

  /** Insurance status badge (computed from dates). */
  insuranceStatus: 'valid' | 'expiring' | 'expired' | 'missing';
  insuranceProvider: string;
  insuranceValidUntil: string;
  insuranceMaskedPolicyNumber: string;
  insurancePdfUrl: string;

  /** Cache-buster for clients. */
  updatedAt: string;
}

// ─── Empty defaults ────────────────────────────────────────────────────────

export const EMPTY_OPERATOR_PRIVATE: OperatorPrivateDetails = {
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  email: '',
  phone: '',
  address: { line1: '', line2: '', city: '', postalCode: '', country: '' },
};

export const EMPTY_OPERATOR_COMPANY: OperatorCompanyDetails = {
  companyName: '',
  contactPerson: '',
  vatNumber: '',
  uniqueCompanyNumber: '',
  email: '',
  address: { line1: '', line2: '', city: '', postalCode: '', country: '' },
};

// ─── Select options (i18n keys) ────────────────────────────────────────────

export const DRONE_CLASSES: { value: DroneClass; labelKey: string }[] = [
  { value: 'C0', labelKey: 'drone.class.c0' },
  { value: 'C1', labelKey: 'drone.class.c1' },
  { value: 'C2', labelKey: 'drone.class.c2' },
  { value: 'C3', labelKey: 'drone.class.c3' },
  { value: 'C4', labelKey: 'drone.class.c4' },
  { value: 'unknown', labelKey: 'drone.class.unknown' },
];

export const CERTIFICATE_KINDS: { value: CertificateKind; labelKey: string }[] = [
  { value: 'A1_A3', labelKey: 'cert.kind.a1a3' },
  { value: 'A2', labelKey: 'cert.kind.a2' },
  { value: 'STS_THEORETICAL', labelKey: 'cert.kind.stsTheoretical' },
  { value: 'STS_01', labelKey: 'cert.kind.sts01' },
  { value: 'STS_02', labelKey: 'cert.kind.sts02' },
  { value: 'custom', labelKey: 'cert.kind.custom' },
];

export const SLOT_KINDS: SlotKind[] = [
  'certificate', 'drone', 'operator', 'pdf', 'nfc_badge', 'personalization',
];
