// ─── Language (re-exported from i18n — single source of truth) ───────────────

import type { Language } from '@/lib/i18n';
export type { Language };
export { LANGUAGES } from '@/lib/i18n';

// ─── Enums ───────────────────────────────────────────────────────────────────

export type ProfileStatus = 'draft' | 'active' | 'suspended' | 'archived';
export type Visibility = 'private' | 'public';
export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';
export type PolicyStatus = 'valid' | 'expiring' | 'expired' | 'missing';
export type DocumentType =
  | 'insurance_policy'
  | 'operator_license'
  | 'drone_registration'
  | 'training_certificate'
  | 'other';

// ─── Person ──────────────────────────────────────────────────────────────────

export interface Person {
  firstName: string;
  lastName: string;
  birthDate: string;
  nationality: string;
  operatorCode: string;
  operatorLicense: string;
  emergencyContact: string;
}

// ─── Organization ────────────────────────────────────────────────────────────

export interface Organization {
  companyName: string;
  companyDetails: string;
  companyAddress: string;
  companyVatOrRegistration: string;
}

// ─── Drone ───────────────────────────────────────────────────────────────────

export interface Drone {
  droneName: string;
  droneModel: string;
  droneSerialNumber: string;
  droneRegistrationCode: string;
}

// ─── Insurance ───────────────────────────────────────────────────────────────

export interface Insurance {
  provider: string;
  policyNumber: string;
  issueDate: string;
  expiryDate: string;
  notes: string;
  pdfUrl: string;
}

// ─── Assets (media + NFC/QR) ─────────────────────────────────────────────────

export interface Assets {
  profilePhotoUrl: string;
  logoUrl: string;
  bannerUrl: string;
  qrCodeUrl: string;
  nfcReference: string;
}

// ─── Admin ───────────────────────────────────────────────────────────────────

export interface AdminMeta {
  internalNotes: string;
  lastEditedBy: string;
}

// ─── Additional documents ────────────────────────────────────────────────────

export interface ProfileDocument {
  id: string;
  type: DocumentType;
  label: string;
  fileUrl: string;
  issuedAt: string;
  expiresAt: string;
  notes: string;
}

// ─── Profile (main Firestore document) ───────────────────────────────────────

export interface Profile {
  id: string;
  slug: string;
  language: Language;

  status: ProfileStatus;
  visibility: Visibility;
  verificationStatus: VerificationStatus;

  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  lastVerifiedAt: string;

  person: Person;
  organization: Organization;
  drone: Drone;
  insurance: Insurance;
  assets: Assets;
  documents: ProfileDocument[];
  admin: AdminMeta;
}

// ─── Public profile (data-minimised projection for verifiers) ────────────────
//
// These types define the ONLY data that leaves the admin boundary.
// The toPublicProfile() helper in utils/publicProjection.ts converts a full
// Profile into a PublicProfile, stripping internal metadata, sensitive PII,
// and optionally masking identifiers.

export interface PublicPerson {
  firstName: string;
  lastName: string;
  operatorCode: string;
  operatorLicense: string;
  nationality: string;
  // EXCLUDED: birthDate, emergencyContact — not needed for verification
}

export interface PublicOrganization {
  companyName: string;
  companyDetails: string;
  // EXCLUDED: companyAddress, companyVatOrRegistration — sensitive internal data
}

export interface PublicDrone {
  droneName: string;
  droneModel: string;
  droneSerialNumber: string;
  droneRegistrationCode: string;
}

export interface PublicInsurance {
  provider: string;
  maskedPolicyNumber: string;
  issueDate: string;
  expiryDate: string;
  pdfUrl: string;
  // EXCLUDED: notes — internal admin commentary
}

export interface PublicAssets {
  profilePhotoUrl: string;
  logoUrl: string;
  bannerUrl: string;
  qrCodeUrl: string;
  // EXCLUDED: nfcReference — internal hardware identifier
}

export interface PublicProfile {
  slug: string;
  language: Language;
  verificationStatus: VerificationStatus;
  lastVerifiedAt: string;
  publishedAt: string;

  person: PublicPerson;
  organization: PublicOrganization;
  drone: PublicDrone;
  insurance: PublicInsurance;
  assets: PublicAssets;
  // EXCLUDED: id, status, visibility, createdAt, updatedAt, documents, admin
}

/** Controls how the projection sanitises data before public display. */
export interface PublicProjectionOptions {
  /** Include the insurance PDF URL. Default: true. */
  exposePdfUrl?: boolean;
  /** Mask the middle digits of the policy number. Default: true. */
  maskPolicyNumber?: boolean;
}

// ─── Form helpers ────────────────────────────────────────────────────────────

export type ProfileFormData = Omit<Profile, 'id' | 'createdAt' | 'updatedAt'>;

export const EMPTY_PERSON: Person = {
  firstName: '',
  lastName: '',
  birthDate: '',
  nationality: '',
  operatorCode: '',
  operatorLicense: '',
  emergencyContact: '',
};

export const EMPTY_ORGANIZATION: Organization = {
  companyName: '',
  companyDetails: '',
  companyAddress: '',
  companyVatOrRegistration: '',
};

export const EMPTY_DRONE: Drone = {
  droneName: '',
  droneModel: '',
  droneSerialNumber: '',
  droneRegistrationCode: '',
};

export const EMPTY_INSURANCE: Insurance = {
  provider: '',
  policyNumber: '',
  issueDate: '',
  expiryDate: '',
  notes: '',
  pdfUrl: '',
};

export const EMPTY_ASSETS: Assets = {
  profilePhotoUrl: '',
  logoUrl: '',
  bannerUrl: '',
  qrCodeUrl: '',
  nfcReference: '',
};

export const EMPTY_ADMIN: AdminMeta = {
  internalNotes: '',
  lastEditedBy: '',
};

export const DEFAULT_PROFILE: ProfileFormData = {
  slug: '',
  language: 'en',
  status: 'draft',
  visibility: 'private',
  verificationStatus: 'unverified',
  publishedAt: '',
  lastVerifiedAt: '',
  person: { ...EMPTY_PERSON },
  organization: { ...EMPTY_ORGANIZATION },
  drone: { ...EMPTY_DRONE },
  insurance: { ...EMPTY_INSURANCE },
  assets: { ...EMPTY_ASSETS },
  documents: [],
  admin: { ...EMPTY_ADMIN },
};

// ─── Select options ──────────────────────────────────────────────────────────

export const PROFILE_STATUSES: { value: ProfileStatus; labelKey: string }[] = [
  { value: 'draft', labelKey: 'status.draft' },
  { value: 'active', labelKey: 'status.active' },
  { value: 'suspended', labelKey: 'status.suspended' },
  { value: 'archived', labelKey: 'status.archived' },
];

export const VISIBILITY_OPTIONS: { value: Visibility; labelKey: string }[] = [
  { value: 'private', labelKey: 'visibility.private' },
  { value: 'public', labelKey: 'visibility.public' },
];

export const VERIFICATION_STATUSES: { value: VerificationStatus; labelKey: string }[] = [
  { value: 'unverified', labelKey: 'verification.unverified' },
  { value: 'pending', labelKey: 'verification.pending' },
  { value: 'verified', labelKey: 'verification.verified' },
  { value: 'rejected', labelKey: 'verification.rejected' },
];

export const DOCUMENT_TYPES: { value: DocumentType; labelKey: string }[] = [
  { value: 'insurance_policy', labelKey: 'docType.insurancePolicy' },
  { value: 'operator_license', labelKey: 'docType.operatorLicense' },
  { value: 'drone_registration', labelKey: 'docType.droneRegistration' },
  { value: 'training_certificate', labelKey: 'docType.trainingCertificate' },
  { value: 'other', labelKey: 'docType.other' },
];
