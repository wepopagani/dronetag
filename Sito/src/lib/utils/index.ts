import type { Insurance, PolicyStatus, Profile } from '@/lib/types';

export { toPublicProfile, maskPolicyNumber } from './publicProjection';

/**
 * Derives the full public URL for a profile from its slug.
 * Uses window.location.origin on the client, or falls back to the path only.
 */
export function getPublicProfileUrl(slug: string): string {
  if (!slug) return '';
  const path = `/u/${slug}`;
  if (typeof window !== 'undefined') return `${window.location.origin}${path}`;
  return path;
}

export function generateSlug(firstName: string, lastName: string, operatorCode: string): string {
  return [firstName, lastName, operatorCode]
    .map((s) => s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'))
    .filter(Boolean)
    .join('-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function formatDate(iso: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatDateTime(iso: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export function classNames(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

// ─── Policy status computation ──────────────────────────────────────────────

const EXPIRING_THRESHOLD_DAYS = 30;

/**
 * Determines the policy status from raw insurance data.
 *
 * Rules (evaluated in order):
 *  1. missing  — no provider AND no policy number, OR no expiry date
 *  2. expired  — expiry date is in the past
 *  3. expiring — expiry date is within 30 days from now
 *  4. valid    — expiry date is more than 30 days away
 */
export function computePolicyStatus(ins: Insurance): PolicyStatus {
  if (!ins.policyNumber && !ins.provider) return 'missing';
  if (!ins.expiryDate) return 'missing';

  const now = new Date();
  const expiry = new Date(ins.expiryDate);
  if (expiry < now) return 'expired';

  const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (daysLeft <= EXPIRING_THRESHOLD_DAYS) return 'expiring';
  return 'valid';
}

export function daysUntilExpiry(dateIso: string): number | null {
  if (!dateIso) return null;
  const now = new Date();
  const target = new Date(dateIso);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

// ─── Rich policy summary ────────────────────────────────────────────────────

/**
 * Priority weight for each status — lower = more urgent.
 * Used by document-priority sorting so that expired profiles surface first.
 */
const STATUS_PRIORITY: Record<PolicyStatus, number> = {
  expired: 0,
  expiring: 1,
  missing: 2,
  valid: 3,
};

/**
 * Computed summary of an insurance policy. Contains everything the UI
 * needs to render badge + descriptive text, without repeating logic.
 */
export interface PolicySummary {
  status: PolicyStatus;
  days: number | null;
  expiryDate: string;
  formattedExpiry: string;
  /** Lower = more urgent (expired 0, expiring 1, missing 2, valid 3) */
  priority: number;
  /** i18n key for the one-line descriptive text */
  descriptionKey: string;
  /** Interpolation params for the description key */
  descriptionParams: Record<string, string | number>;
}

/**
 * Single source of truth for policy status + descriptive text.
 *
 * Returned description keys (with params):
 *   valid    → 'policy.desc.validUntil'    { date }
 *   expiring → 'policy.desc.expiringOn'    { date, days }
 *   expired  → 'policy.desc.expiredOn'     { date, days }
 *   missing  → 'policy.desc.noPolicyOnFile' (no params)
 */
export function describePolicyStatus(ins: Insurance): PolicySummary {
  const status = computePolicyStatus(ins);
  const days = daysUntilExpiry(ins.expiryDate);
  const formatted = formatDate(ins.expiryDate);

  let descriptionKey: string;
  let descriptionParams: Record<string, string | number> = {};

  switch (status) {
    case 'valid':
      descriptionKey = 'policy.desc.validUntil';
      descriptionParams = { date: formatted };
      break;
    case 'expiring':
      descriptionKey = 'policy.desc.expiringOn';
      descriptionParams = { date: formatted, days: days ?? 0 };
      break;
    case 'expired':
      descriptionKey = 'policy.desc.expiredOn';
      descriptionParams = { date: formatted, days: days !== null ? Math.abs(days) : 0 };
      break;
    default:
      descriptionKey = 'policy.desc.noPolicyOnFile';
      break;
  }

  return {
    status,
    days,
    expiryDate: ins.expiryDate,
    formattedExpiry: formatted,
    priority: STATUS_PRIORITY[status],
    descriptionKey,
    descriptionParams,
  };
}

/**
 * Compare function for sorting profiles by document urgency.
 * Expired comes first, then expiring, then missing, then valid.
 * Within the same priority, earlier expiry dates come first.
 */
export function compareByPolicyPriority(a: Profile, b: Profile): number {
  const sa = describePolicyStatus(a.insurance);
  const sb = describePolicyStatus(b.insurance);
  if (sa.priority !== sb.priority) return sa.priority - sb.priority;
  return (a.insurance.expiryDate || '9999').localeCompare(b.insurance.expiryDate || '9999');
}

// ─── Profile completeness ───────────────────────────────────────────────────

interface FieldCheck { key: string; value: string }

function requiredFields(p: Profile): FieldCheck[] {
  return [
    { key: 'person.firstName', value: p.person.firstName },
    { key: 'person.lastName', value: p.person.lastName },
    { key: 'person.operatorCode', value: p.person.operatorCode },
    { key: 'organization.companyName', value: p.organization.companyName },
    { key: 'insurance.provider', value: p.insurance.provider },
    { key: 'insurance.policyNumber', value: p.insurance.policyNumber },
    { key: 'insurance.expiryDate', value: p.insurance.expiryDate },
    { key: 'insurance.pdfUrl', value: p.insurance.pdfUrl },
    { key: 'assets.profilePhotoUrl', value: p.assets.profilePhotoUrl },
    { key: 'assets.logoUrl', value: p.assets.logoUrl },
    { key: 'assets.qrCodeUrl', value: p.assets.qrCodeUrl },
  ];
}

export function profileCompleteness(p: Profile): { filled: number; total: number; percent: number; missingFields: string[] } {
  const checks = requiredFields(p);
  const missing = checks.filter((c) => !c.value.trim()).map((c) => c.key);
  const filled = checks.length - missing.length;
  return { filled, total: checks.length, percent: Math.round((filled / checks.length) * 100), missingFields: missing };
}

export function isProfileComplete(p: Profile): boolean {
  return profileCompleteness(p).missingFields.length === 0;
}

// ─── Display helpers ────────────────────────────────────────────────────────

export function getDisplayName(p: Profile): string {
  const parts = [p.person.firstName, p.person.lastName].filter(Boolean);
  return parts.join(' ') || '—';
}

export function isPubliclyVisible(p: Profile): boolean {
  return p.visibility === 'public' && p.status === 'active';
}
