/**
 * Public projection layer.
 *
 * Converts a full admin-level Profile into a PublicProfile that contains
 * only the fields safe for unauthenticated / verifier display.
 *
 * Rationale — data minimisation:
 *   • Personal data (birthDate, emergencyContact) is never exposed.
 *   • Admin metadata (internalNotes, lastEditedBy, documents) is stripped.
 *   • Organisation address and VAT/registration are omitted — not needed
 *     for a verifier to confirm operator identity.
 *   • The insurance policy number is masked by default so that only the
 *     first 3 and last 3 characters are visible.
 *   • The PDF link is included by default but can be suppressed via options
 *     for cases where document sharing is not authorised.
 */

import type { Profile, PublicProfile, PublicProjectionOptions } from '@/lib/types';

// ─── Policy number masking ──────────────────────────────────────────────────

/**
 * Masks the interior characters of a policy number, keeping the first and
 * last `visible` characters and replacing the middle with asterisks.
 *
 *   maskPolicyNumber('ABC-12345-XY', 3)  →  'ABC-*****-XY'
 *     (for very short strings it degrades gracefully)
 */
export function maskPolicyNumber(raw: string, visible = 3): string {
  const s = raw.trim();
  if (!s) return '';
  if (s.length <= visible * 2) return s;
  const head = s.slice(0, visible);
  const tail = s.slice(-visible);
  const masked = '*'.repeat(s.length - visible * 2);
  return `${head}${masked}${tail}`;
}

// ─── Projection ─────────────────────────────────────────────────────────────

/**
 * Strips a full Profile down to the minimal PublicProfile shape.
 *
 * This function is the single authoritative boundary between admin data
 * and publicly visible data. Every field that reaches the public page
 * MUST pass through here.
 */
export function toPublicProfile(
  profile: Profile,
  options: PublicProjectionOptions = {},
): PublicProfile {
  const {
    exposePdfUrl = true,
    maskPolicyNumber: doMask = true,
  } = options;

  return {
    slug: profile.slug,
    language: profile.language,
    verificationStatus: profile.verificationStatus,
    lastVerifiedAt: profile.lastVerifiedAt,
    publishedAt: profile.publishedAt,

    // publicFields: identity — only what a verifier needs
    person: {
      firstName: profile.person.firstName,
      lastName: profile.person.lastName,
      operatorCode: profile.person.operatorCode,
      operatorLicense: profile.person.operatorLicense,
      nationality: profile.person.nationality,
      // adminOnlyFields: birthDate, emergencyContact
    },

    // publicFields: organisation name and description only
    organization: {
      companyName: profile.organization.companyName,
      companyDetails: profile.organization.companyDetails,
      // adminOnlyFields: companyAddress, companyVatOrRegistration
    },

    // publicFields: drone identifiers (all are safe for verification)
    drone: {
      droneName: profile.drone.droneName,
      droneModel: profile.drone.droneModel,
      droneSerialNumber: profile.drone.droneSerialNumber,
      droneRegistrationCode: profile.drone.droneRegistrationCode,
    },

    // publicFields: insurance verification data
    insurance: {
      provider: profile.insurance.provider,
      maskedPolicyNumber: doMask
        ? maskPolicyNumber(profile.insurance.policyNumber)
        : profile.insurance.policyNumber,
      issueDate: profile.insurance.issueDate,
      expiryDate: profile.insurance.expiryDate,
      pdfUrl: exposePdfUrl ? profile.insurance.pdfUrl : '',
      // adminOnlyFields: notes
    },

    // publicFields: visual assets only (no nfcReference)
    assets: {
      profilePhotoUrl: profile.assets.profilePhotoUrl,
      logoUrl: profile.assets.logoUrl,
      bannerUrl: profile.assets.bannerUrl,
      qrCodeUrl: profile.assets.qrCodeUrl,
      // adminOnlyFields: nfcReference
    },
  };
}
