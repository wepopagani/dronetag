/**
 * Public projection layer.
 *
 * Converts admin-level data into the strictly minimised shape allowed on
 * the public profile / drone page. Two boundaries live here:
 *
 *   • toPublicProfile() — legacy single-Profile model. Kept intact while
 *     the dashboard and public route still serve `profiles/*` documents.
 *
 *   • toPublicDroneCard() — new multi-entity model. Joins a Drone with its
 *     effective Operator + linked Pilot + Insurance and emits ONLY the
 *     fields the PRD allows the public to see (no phone numbers, no
 *     addresses, no VAT, no DOB, no full policy number).
 *
 * Rationale — data minimisation:
 *   • Personal data (birthDate, emergencyContact, phone) is never exposed.
 *   • Admin metadata (internalNotes, lastEditedBy, documents) is stripped.
 *   • Organisation address and VAT/registration are omitted.
 *   • The insurance policy number is masked by default; only first / last
 *     few characters are visible.
 *   • The PDF link is opt-in via `exposePdfUrl`.
 */

import type { Profile, PublicProfile, PublicProjectionOptions } from '@/lib/types';
import type {
  Drone,
  DroneClass,
  Insurance,
  Operator,
  Pilot,
} from '@/lib/types/entities';
import type { VerificationStatus } from '@/lib/types';
import {
  effectiveOperatorId,
  operatorDisplayName,
  pilotDisplayName,
} from '@/lib/utils/entities';
import { computePolicyStatus } from '@/lib/utils';
import type { PolicyStatus } from '@/lib/types';

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
    maskPolicyNumber: doMask = false,
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

// ─── New multi-entity public drone card ────────────────────────────────────

/**
 * Strict public-facing shape for `/u/[slug]` in the new model.
 *
 * The PRD §1 lists the ONLY data that may be exposed:
 *   - pilot or operator/company display name
 *   - insurance status + valid-until date
 *   - drone basic data (manufacturer, model, class)
 *   - public badge / verification status indicator
 *
 * Anything else (phone, address, full policy number, DOB, VAT id, internal
 * notes, document URLs other than the insurance PDF) is intentionally
 * absent from this type. The projection function below must NOT add fields
 * that don't exist on this interface; the type is the contract.
 */
export interface PublicDroneCard {
  /** Public URL slug (the QR/NFC pointer). */
  slug: string;

  /** Verification badge status for the drone profile. */
  verificationStatus: VerificationStatus;
  /** Last time the data was verified (display-only). */
  lastVerifiedAt: string;
  /** When this drone was first published. */
  publishedAt: string;

  /** Holder block. Either a person or a company; only one is meaningful. */
  holder: {
    /** 'pilot' = displays a pilot's name; 'operator' = a company / private operator. */
    kind: 'pilot' | 'operator-company' | 'operator-private';
    /** Name to render (already chosen between pilot vs operator depending on context). */
    displayName: string;
  };

  drone: {
    manufacturer: string;
    model: string;
    classMarking: DroneClass;
    /**
     * Optional registration / serial. The PRD allows "drone basic data"; we
     * include the publicly registered identifier (often laser-engraved on
     * the drone itself) so a finder can cross-check, but redact the
     * controller serial which is not a public identifier.
     */
    droneSerialNumber: string;
  };

  insurance: {
    /** Computed status for the badge. */
    status: PolicyStatus;
    /** Insurer brand name. */
    provider: string;
    /** ISO date or empty string. */
    validUntil: string;
    /** Masked: only first/last few chars visible. */
    maskedPolicyNumber: string;
    /** Optional PDF link, gated by projection options. */
    pdfUrl: string;
  };
}

export interface PublicDroneCardOptions {
  /** Include the insurance PDF URL. Default: true. */
  exposePdfUrl?: boolean;
  /** Mask the middle digits of the policy number. Default: true. */
  maskPolicyNumber?: boolean;
}

/**
 * Build a PublicDroneCard from the underlying entities.
 *
 * Caller responsibilities:
 *   • Pick the EFFECTIVE operator using `effectiveOperatorId(drone)` from
 *     `@/lib/utils/entities` BEFORE calling this function — we accept the
 *     resolved operator directly so the lazy 24h TTL stays in one place.
 *   • Pass null for any entity the projection should treat as missing.
 *
 * This function MUST be the single boundary between the data layer and the
 * public renderer. If a new public field is needed, add it to the
 * PublicDroneCard interface above first; that way TypeScript will refuse
 * to compile any caller that tries to consume an undeclared field.
 */
export function toPublicDroneCard(
  drone: Drone,
  effectiveOperator: Operator | null,
  linkedPilot: Pilot | null,
  insurance: Insurance | null,
  options: PublicDroneCardOptions = {},
): PublicDroneCard {
  const { exposePdfUrl = true, maskPolicyNumber: doMask = true } = options;

  // Holder display name: prefer the effective operator name (per PRD §1
  // "pilot name OR operator/company name"). Fall back to the linked pilot
  // when no operator is available; final fallback to em-dash.
  let holderKind: PublicDroneCard['holder']['kind'] = 'pilot';
  let holderName = '—';
  if (effectiveOperator) {
    holderKind = effectiveOperator.kind === 'company'
      ? 'operator-company'
      : 'operator-private';
    holderName = operatorDisplayName(effectiveOperator);
  } else if (linkedPilot) {
    holderKind = 'pilot';
    holderName = pilotDisplayName(linkedPilot);
  }

  const insuranceStatus: PolicyStatus = insurance
    ? computePolicyStatus(insurance)
    : 'missing';

  return {
    slug: drone.slug,
    verificationStatus: drone.verificationStatus,
    lastVerifiedAt: drone.lastVerifiedAt,
    publishedAt: drone.publishedAt,

    holder: {
      kind: holderKind,
      displayName: holderName,
    },

    drone: {
      manufacturer: drone.manufacturer,
      model: drone.model,
      classMarking: drone.classMarking,
      droneSerialNumber: drone.droneSerialNumber,
      // adminOnlyFields: controllerSerialNumber, linkedPilotId, defaultOperatorId,
      // activeOperatorId, activeOperatorUntil, insuranceId, userId, status,
      // visibility — never exposed publicly.
    },

    insurance: {
      status: insuranceStatus,
      provider: insurance?.provider ?? '',
      validUntil: insurance?.expiryDate ?? '',
      maskedPolicyNumber: insurance
        ? (doMask ? maskPolicyNumber(insurance.policyNumber) : insurance.policyNumber)
        : '',
      pdfUrl: exposePdfUrl ? (insurance?.pdfUrl ?? '') : '',
      // adminOnlyFields: notes, link, droneId, operatorId, userId, issueDate
    },
  };
}

/**
 * Convenience: resolve the effective operator from a drone given a list of
 * the user's operators, and return the public card. Useful when the caller
 * already has all the operators in memory (e.g. owner dashboard preview).
 */
export function toPublicDroneCardFromList(
  drone: Drone,
  operators: Operator[],
  linkedPilot: Pilot | null,
  insurance: Insurance | null,
  options: PublicDroneCardOptions = {},
): PublicDroneCard {
  const effId = effectiveOperatorId(drone);
  const effective = operators.find((o) => o.id === effId) ?? null;
  return toPublicDroneCard(drone, effective, linkedPilot, insurance, options);
}
