'use client';

/**
 * Public drone card — renders ONLY the M1 PublicDroneCard projection.
 *
 * This component never accepts the underlying Drone / Operator / Pilot /
 * Insurance entities directly. The page wrapper (/u/[slug]/page.tsx)
 * resolves them, runs them through `toPublicDroneCard()`, and hands us
 * the strict `PublicDroneCardData` view. By design the props type does
 * not contain phone, address, DOB, VAT, full policy number, controller
 * serial, internal IDs, or document URLs other than the (optional)
 * insurance PDF — TypeScript will refuse to forward anything else.
 */

import { type ReactNode, useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { LANGUAGES } from '@/lib/types';
import type { PolicyStatus, VerificationStatus } from '@/lib/types';
import type { DroneClass, DronePublicSnapshot } from '@/lib/types/entities';
import { classNames, formatDate, formatDateTime } from '@/lib/utils';
import { trackEvent } from '@/lib/analytics';
import { Button } from '@/components/ui/Button';
import { ReportFoundDroneForm } from './ReportFoundDroneForm';

// ─── Visual config ─────────────────────────────────────────────────────────

const policyConfig: Record<PolicyStatus, { ring: string; text: string; dot: string; bg: string }> = {
  valid: {
    ring: 'ring-emerald-600/20',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
    bg: 'bg-emerald-50',
  },
  expiring: {
    ring: 'ring-amber-600/20',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
    bg: 'bg-amber-50',
  },
  expired: {
    ring: 'ring-red-600/20',
    text: 'text-red-700',
    dot: 'bg-red-500',
    bg: 'bg-red-50',
  },
  missing: {
    ring: 'ring-gray-500/20',
    text: 'text-gray-600',
    dot: 'bg-gray-400',
    bg: 'bg-gray-100',
  },
};

const verificationConfig: Record<VerificationStatus, { bg: string; text: string; dot: string }> = {
  verified: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  pending: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  unverified: { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' },
  rejected: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
};

const droneClassLabelKey: Record<DroneClass, string> = {
  C0: 'drone.class.c0',
  C1: 'drone.class.c1',
  C2: 'drone.class.c2',
  C3: 'drone.class.c3',
  C4: 'drone.class.c4',
  unknown: 'drone.class.unknown',
};

// ─── Helpers ───────────────────────────────────────────────────────────────

function holderRoleKey(kind: DronePublicSnapshot['holderKind']): string {
  switch (kind) {
    case 'operator-company':
      return 'publicDrone.holderOperatorCompany';
    case 'operator-private':
      return 'publicDrone.holderOperatorPrivate';
    default:
      return 'publicDrone.holderPilot';
  }
}

function holderInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
}

function hasUrl(value: string | undefined): value is string {
  return Boolean(value?.trim());
}

function insuranceBannerKey(status: PolicyStatus): string {
  switch (status) {
    case 'valid':
      return 'publicDrone.insuranceActive';
    case 'expiring':
      return 'publicDrone.insuranceExpiring';
    case 'expired':
      return 'publicDrone.insuranceExpired';
    default:
      return 'publicDrone.insuranceUnknown';
  }
}

function certificateBadgeKey(status: VerificationStatus): string {
  switch (status) {
    case 'verified':
      return 'publicDrone.certificatesVerified';
    case 'pending':
      return 'publicDrone.certificatesPending';
    case 'rejected':
      return 'publicDrone.certificatesRejected';
    default:
      return 'publicDrone.certificatesUnverified';
  }
}

// ─── Page-level helpers exported for the wrapper ──────────────────────────

export type PublicDroneCardProps = {
  /**
   * The sanitised public snapshot read from `dronesPublic/{slug}`. The
   * card never receives raw drone / pilot / operator / insurance docs;
   * everything renderable came from the projection at write time.
   */
  snapshot: DronePublicSnapshot;
  /** Visitor language code; passed in to keep the card a pure renderer. */
  language: string;
};

export function PublicDroneCard({ snapshot, language }: PublicDroneCardProps) {
  const { t } = useLanguage();
  const [reportOpen, setReportOpen] = useState(false);

  // PR-SEC-4 analytics: one event per QR/NFC page open. Slug is already
  // public; never log uid / contact details (sanitised by trackEvent).
  useEffect(() => {
    trackEvent('qr_page_opened', { slug: snapshot.slug });
  }, [snapshot.slug]);

  const policy = policyConfig[snapshot.insuranceStatus as PolicyStatus];
  const verification = verificationConfig[snapshot.verificationStatus];
  const langLabel =
    LANGUAGES.find((l) => l.value === language)?.label ?? language.toUpperCase();

  return (
    <div className="overflow-hidden rounded-none border-y border-gray-200 bg-white shadow-none sm:rounded-xl sm:border sm:shadow-lg">
      {/* ── Banner + identity ─────────────────────────────────────────── */}
      <div className="relative">
        <div className="relative h-32 w-full overflow-hidden sm:h-36">
          {hasUrl(snapshot.bannerUrl) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={snapshot.bannerUrl}
              alt=""
              referrerPolicy="no-referrer"
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-slate-800 via-slate-900 to-gray-950" aria-hidden />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" aria-hidden />

          {hasUrl(snapshot.logoUrl) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={snapshot.logoUrl}
              alt=""
              referrerPolicy="no-referrer"
              loading="lazy"
              className="absolute right-3 top-3 h-9 w-9 rounded-lg border border-white/20 bg-white object-contain p-0.5 shadow-lg sm:right-4 sm:top-4 sm:h-11 sm:w-11"
            />
          ) : null}
        </div>

        <div className="border-b border-gray-100 bg-white px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            {hasUrl(snapshot.profilePhotoUrl) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={snapshot.profilePhotoUrl}
                alt=""
                referrerPolicy="no-referrer"
                loading="lazy"
                className="h-[5.5rem] w-[5.5rem] shrink-0 rounded-2xl border-[3px] border-white bg-gray-50 object-cover shadow-md sm:h-24 sm:w-24"
              />
            ) : (
              <div
                className="flex h-[5.5rem] w-[5.5rem] shrink-0 items-center justify-center rounded-2xl border-[3px] border-white bg-slate-800 text-2xl font-bold tracking-wide text-white shadow-md sm:h-24 sm:w-24"
                aria-hidden
              >
                {holderInitials(snapshot.holderDisplayName)}
              </div>
            )}

            <div className="min-w-0 flex-1 sm:pb-0.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                {t('publicDrone.eyebrow')}
              </p>
              <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-sky-700">
                {t(holderRoleKey(snapshot.holderKind))}
              </p>
              <h1 className="mt-0.5 text-[1.35rem] font-bold leading-tight tracking-tight text-gray-900 sm:text-2xl">
                {snapshot.holderDisplayName}
              </h1>
              <p className="mt-1 text-sm font-medium text-gray-600 sm:text-base">
                {[snapshot.manufacturer, snapshot.model].filter(Boolean).join(' ').trim() ||
                  t('common.notAvailable')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Status row ─ outdoors-readable badges ─────────────────────── */}
      <div className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:px-6">
        <span className="inline-flex w-full items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20 sm:w-auto sm:py-1.5 sm:text-sm">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
          {t('publicDrone.userVerified')}
        </span>
        <span
          className={classNames(
            'inline-flex w-full items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold ring-1 ring-inset sm:w-auto sm:py-1.5 sm:text-sm',
            verification.bg,
            verification.text,
          )}
        >
          <span className={classNames('h-2.5 w-2.5 shrink-0 rounded-full', verification.dot)} aria-hidden />
          {t(certificateBadgeKey(snapshot.verificationStatus))}
        </span>
        <span
          className={classNames(
            'inline-flex w-full items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold ring-1 ring-inset sm:w-auto sm:py-1.5 sm:text-sm',
            policy.bg,
            policy.text,
            policy.ring,
          )}
        >
          <span className={classNames('h-2.5 w-2.5 shrink-0 rounded-full', policy.dot)} aria-hidden />
          {t(insuranceBannerKey(snapshot.insuranceStatus as PolicyStatus))}
        </span>
      </div>

      {/* ── Sections ──────────────────────────────────────────────────── */}
      <Section title={t('publicDrone.holderSection')} icon={<IconUser />}>
        <DataRow label={t(holderRoleKey(snapshot.holderKind))} value={snapshot.holderDisplayName} />
      </Section>

      <Section title={t('public.droneInformation')} icon={<IconDrone />}>
        <DataRow label={t('drone.field.manufacturer')} value={snapshot.manufacturer} />
        <DataRow label={t('drone.field.model')} value={snapshot.model} />
        <DataRow
          label={t('publicDrone.classification')}
          value={t(droneClassLabelKey[snapshot.classMarking as DroneClass])}
        />
        <DataRow
          label={t('publicDrone.identifier')}
          value={snapshot.droneSerialNumber}
          mono
        />
      </Section>

      <Section title={t('public.insuranceCoverage')} icon={<IconShield />}>
        <DataRow label={t('profile.provider')} value={snapshot.insuranceProvider} />
        <DataRow
          label={t('publicDrone.policyNumberMasked')}
          value={snapshot.insuranceMaskedPolicyNumber}
          mono
        />
        <DataRow
          label={t('publicDrone.validUntil')}
          value={snapshot.insuranceValidUntil ? formatDate(snapshot.insuranceValidUntil) : ''}
        />
        {snapshot.insurancePdfUrl ? (
          <div className="mt-3">
            <a
              href={snapshot.insurancePdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="tap-44 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm transition active:bg-gray-50 sm:w-auto sm:justify-start sm:px-3 sm:py-2 sm:text-xs"
            >
              <IconExternal />
              {t('publicDrone.viewPolicyPdf')}
            </a>
          </div>
        ) : null}
      </Section>

      <Section title={t('public.verificationRecord')} icon={<IconClipboard />}>
        <DataRow
          label={t('verification.status')}
          value={t(certificateBadgeKey(snapshot.verificationStatus))}
        />
        {snapshot.lastVerifiedAt ? (
          <DataRow
            label={t('publicDrone.lastVerified')}
            value={formatDateTime(snapshot.lastVerifiedAt)}
          />
        ) : null}
        {snapshot.publishedAt ? (
          <DataRow
            label={t('publicDrone.publishedOn')}
            value={formatDateTime(snapshot.publishedAt)}
          />
        ) : null}
        <DataRow label={t('field.language')} value={langLabel} />
      </Section>

      {/* ── CTA stack — primary "Report" gets a full-width tall tap target
          on its own row so police / finders can hit it outdoors with gloves
          or one-thumb. (STAGING-OPS-1) ────────────────────────────────── */}
      <div className="safe-pb border-t border-gray-200 bg-white px-4 py-4 sm:px-6 sm:py-5">
        <Button onClick={() => setReportOpen(true)} fullWidth size="lg" className="tap-44">
          <IconLifebuoy />
          {t('publicDrone.reportFound')}
        </Button>
        <div className="mt-2.5">
          <Button href="/login" variant="secondary" fullWidth size="lg" className="tap-44">
            <IconLogin />
            {t('publicDrone.openApp')}
          </Button>
        </div>
      </div>

      {/* ── Footer / disclaimer ───────────────────────────────────────── */}
      <footer className="border-t border-gray-200 bg-gray-50/80 px-4 py-4 text-xs leading-relaxed text-gray-500 sm:px-6 sm:py-5">
        <p className="text-[11px] font-semibold text-gray-700">{t('legal.notOfficial')}</p>
        <p className="mt-1.5">{t('legal.platformDisclaimer')}</p>
        <p className="mt-3 flex items-center justify-between">
          <span className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
            {t('public.poweredBy')}
          </span>
          <span className="font-mono text-[10px] text-gray-400">{snapshot.slug}</span>
        </p>
      </footer>

      <ReportFoundDroneForm
        droneId={snapshot.droneId}
        droneSlug={snapshot.slug}
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
      />
    </div>
  );
}

// ─── Layout primitives ────────────────────────────────────────────────────

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="border-t border-gray-200">
      <div className="flex items-center gap-2.5 px-4 pt-4 sm:px-6 sm:pt-5">
        <span
          className="flex h-5 w-5 shrink-0 items-center justify-center text-gray-400"
          aria-hidden
        >
          {icon}
        </span>
        <h2 className="text-[11px] font-bold uppercase tracking-[0.08em] text-gray-400">{title}</h2>
      </div>
      <dl className="px-4 pb-4 pt-2 sm:px-6 sm:pb-5 sm:pt-3">{children}</dl>
    </section>
  );
}

function DataRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  if (!value) return null;
  return (
    <div className="border-b border-gray-100 py-3 last:border-b-0 sm:flex sm:items-baseline sm:justify-between sm:gap-4 sm:py-2.5">
      <dt className="text-xs font-medium uppercase tracking-wide text-gray-400 sm:shrink-0 sm:text-[13px] sm:normal-case sm:tracking-normal sm:text-gray-500">
        {label}
      </dt>
      <dd
        className={classNames(
          'mt-1 text-[15px] font-medium leading-snug text-gray-900 sm:mt-0 sm:text-right sm:text-[13px]',
          mono && 'font-mono tracking-tight break-all sm:break-normal',
        )}
      >
        {value}
      </dd>
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────

function IconDrone() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-[14px] w-[14px]" aria-hidden>
      <path d="M15.98 1.804a1 1 0 00-1.96 0l-.24 1.192a1 1 0 01-.784.785l-1.192.238a1 1 0 000 1.962l1.192.238a1 1 0 01.785.785l.238 1.192a1 1 0 001.962 0l.238-1.192a1 1 0 01.785-.785l1.192-.238a1 1 0 000-1.962l-1.192-.238a1 1 0 01-.785-.785l-.238-1.192zM6.95 5.684a1 1 0 00-1.9 0l-.683 2.051a1 1 0 01-.633.633l-2.052.683a1 1 0 000 1.898l2.052.683a1 1 0 01.633.633l.683 2.051a1 1 0 001.898 0l.683-2.051a1 1 0 01.633-.633l2.052-.683a1 1 0 000-1.898l-2.052-.683a1 1 0 01-.633-.633L6.95 5.684z" />
    </svg>
  );
}

function IconUser() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-[14px] w-[14px]" aria-hidden>
      <path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z" />
    </svg>
  );
}

function IconShield() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-[14px] w-[14px]" aria-hidden>
      <path
        fillRule="evenodd"
        d="M9.661 2.237a.531.531 0 01.678 0 11.947 11.947 0 007.078 2.749.5.5 0 01.479.425c.069.52.104 1.05.104 1.59 0 5.162-3.26 9.563-7.834 11.256a.48.48 0 01-.332 0C5.26 16.564 2 12.163 2 7c0-.538.035-1.069.104-1.589a.5.5 0 01.48-.425 11.947 11.947 0 007.077-2.75z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function IconClipboard() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-[14px] w-[14px]" aria-hidden>
      <path d="M15.988 3.012A2.25 2.25 0 0118 5.25v6.5A2.25 2.25 0 0115.75 14H13.5V7A2.5 2.5 0 0011 4.5H8.128a2.252 2.252 0 011.884-1.488A2.25 2.25 0 0112.25 1h1.5a2.25 2.25 0 012.238 2.012zM11.5 3.25a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5a.75.75 0 01-.75-.75z" />
      <path d="M2 7a1 1 0 011-1h8a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V7z" />
    </svg>
  );
}

function IconExternal() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5" aria-hidden>
      <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
      <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
    </svg>
  );
}

function IconLifebuoy() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden>
      <path
        fillRule="evenodd"
        d="M10 1a9 9 0 100 18 9 9 0 000-18zm0 4a5 5 0 100 10 5 5 0 000-10zm0 2a3 3 0 110 6 3 3 0 010-6z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function IconLogin() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden>
      <path
        fillRule="evenodd"
        d="M3 4.25A2.25 2.25 0 015.25 2h5a2.25 2.25 0 012.25 2.25v2a.75.75 0 01-1.5 0v-2a.75.75 0 00-.75-.75h-5a.75.75 0 00-.75.75v11.5c0 .414.336.75.75.75h5a.75.75 0 00.75-.75v-2a.75.75 0 011.5 0v2a2.25 2.25 0 01-2.25 2.25h-5A2.25 2.25 0 013 15.75V4.25z"
        clipRule="evenodd"
      />
      <path
        fillRule="evenodd"
        d="M19 10a.75.75 0 00-.22-.53l-3.25-3.25a.75.75 0 10-1.06 1.06l1.97 1.97H8.75a.75.75 0 000 1.5h7.69l-1.97 1.97a.75.75 0 101.06 1.06l3.25-3.25A.75.75 0 0019 10z"
        clipRule="evenodd"
      />
    </svg>
  );
}
