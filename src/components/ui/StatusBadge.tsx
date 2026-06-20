'use client';

import { classNames } from '@/lib/utils';
import type { PolicySummary } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Insurance, PolicyStatus, ProfileStatus, VerificationStatus } from '@/lib/types';
import { describePolicyStatus } from '@/lib/utils';

type BadgeVariant = 'green' | 'yellow' | 'red' | 'gray' | 'blue' | 'orange';

const variantStyles: Record<BadgeVariant, string> = {
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  yellow: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  red: 'bg-red-50 text-red-700 ring-red-600/20',
  gray: 'bg-gray-50 text-gray-600 ring-gray-500/20',
  blue: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  orange: 'bg-orange-50 text-orange-700 ring-orange-600/20',
};

function Dot({ className }: { className?: string }) {
  return (
    <span className={classNames('inline-block h-1.5 w-1.5 rounded-full', className)} aria-hidden />
  );
}

// ─── Policy Status ───────────────────────────────────────────────────────────

const policyVariant: Record<PolicyStatus, BadgeVariant> = {
  valid: 'green',
  expiring: 'orange',
  expired: 'red',
  missing: 'gray',
};

const policyDotColor: Record<PolicyStatus, string> = {
  valid: 'bg-emerald-500',
  expiring: 'bg-orange-500',
  expired: 'bg-red-500',
  missing: 'bg-gray-400',
};

export function PolicyStatusBadge({ status }: { status: PolicyStatus }) {
  const { t } = useLanguage();
  const key = `policy.${status}`;
  return (
    <span
      className={classNames(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        variantStyles[policyVariant[status]]
      )}
    >
      <Dot className={policyDotColor[status]} />
      {t(key)}
    </span>
  );
}

// ─── Policy Status Detail (badge + descriptive text) ─────────────────────────

const descTextColor: Record<PolicyStatus, string> = {
  valid: 'text-emerald-600',
  expiring: 'text-orange-600',
  expired: 'text-red-600',
  missing: 'text-gray-400',
};

/**
 * Reusable component that renders the policy badge plus an explanatory
 * one-line description. Accepts either raw Insurance data (and computes
 * the summary internally) or a pre-computed PolicySummary.
 *
 * Used consistently in admin dashboard table, mobile cards, and anywhere
 * a concise policy status display is needed.
 */
export function PolicyStatusDetail({ insurance, summary: externalSummary }: {
  insurance?: Insurance;
  summary?: PolicySummary;
}) {
  const { t } = useLanguage();
  const summary = externalSummary ?? (insurance ? describePolicyStatus(insurance) : null);
  if (!summary) return null;

  return (
    <div className="flex flex-col gap-1">
      <PolicyStatusBadge status={summary.status} />
      <span className={classNames('text-[11px] leading-tight', descTextColor[summary.status])}>
        {t(summary.descriptionKey, summary.descriptionParams)}
      </span>
    </div>
  );
}

// ─── Verification Status ─────────────────────────────────────────────────────

const verificationVariant: Record<VerificationStatus, BadgeVariant> = {
  verified: 'green',
  pending: 'yellow',
  unverified: 'gray',
  rejected: 'red',
};

const verificationDotColor: Record<VerificationStatus, string> = {
  verified: 'bg-emerald-500',
  pending: 'bg-amber-500',
  unverified: 'bg-gray-400',
  rejected: 'bg-red-500',
};

export function VerificationBadge({ status }: { status: VerificationStatus }) {
  const { t } = useLanguage();
  const key = `verification.${status}`;
  return (
    <span
      className={classNames(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        variantStyles[verificationVariant[status]]
      )}
    >
      <Dot className={verificationDotColor[status]} />
      {t(key)}
    </span>
  );
}

// ─── Profile Status ──────────────────────────────────────────────────────────

const profileVariant: Record<ProfileStatus, BadgeVariant> = {
  draft: 'gray',
  active: 'green',
  suspended: 'orange',
  archived: 'gray',
};

export function ProfileStatusBadge({ status }: { status: ProfileStatus }) {
  const { t } = useLanguage();
  const key = `status.${status}`;
  return (
    <span
      className={classNames(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        variantStyles[profileVariant[status]]
      )}
    >
      {t(key)}
    </span>
  );
}

// ─── Publish badge ───────────────────────────────────────────────────────────

export function VisibilityBadge({ visibility }: { visibility: 'private' | 'public' }) {
  const { t } = useLanguage();
  const isPublic = visibility === 'public';
  return (
    <span
      className={classNames(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        isPublic ? variantStyles.blue : variantStyles.gray
      )}
    >
      {isPublic ? t('visibility.public') : t('visibility.private')}
    </span>
  );
}

// ─── Completeness ────────────────────────────────────────────────────────────

export function CompletenessBadge({ percent }: { percent: number }) {
  const variant: BadgeVariant = percent >= 80 ? 'green' : percent >= 50 ? 'yellow' : 'red';
  return (
    <span
      className={classNames(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        variantStyles[variant]
      )}
    >
      {percent}%
    </span>
  );
}
