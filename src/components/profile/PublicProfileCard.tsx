'use client';

/**
 * Public profile card — renders ONLY PublicProfile data.
 *
 * This component accepts a PublicProfile (the data-minimised projection),
 * NOT the full admin Profile. This guarantees at the type level that
 * internal metadata (admin notes, emergency contacts, addresses, full
 * policy numbers, etc.) can never leak to the public page.
 *
 * The projection is performed in the page wrapper (/u/[slug]/page.tsx)
 * via toPublicProfile() before this component ever receives the data.
 */

import type { ReactNode } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import type { PolicyStatus, PublicProfile, VerificationStatus } from '@/lib/types';
import { LANGUAGES } from '@/lib/types';
import { classNames, describePolicyStatus, formatDate, formatDateTime } from '@/lib/utils';
import type { PolicySummary } from '@/lib/utils';
import { QRPreview } from '@/components/ui/QRPreview';

export type PublicProfileCardProps = { profile: PublicProfile };

// ─── Helpers ─────────────────────────────────────────────────────────────────

function initials(first: string, last: string): string {
  return `${first.trim().charAt(0)}${last.trim().charAt(0)}`.toUpperCase() || '?';
}

function val(s: string | undefined | null): string {
  return s?.trim() || '';
}

function langLabel(code: string): string {
  return LANGUAGES.find((l) => l.value === code)?.label || code;
}

/**
 * Adapts PublicInsurance to the Insurance shape expected by describePolicyStatus.
 * The public projection uses `maskedPolicyNumber` rather than `policyNumber`,
 * but the status computation only checks whether a policy number exists — the
 * masked value is sufficient.
 */
function insuranceForStatus(ins: PublicProfile['insurance']) {
  return {
    provider: ins.provider,
    policyNumber: ins.maskedPolicyNumber,
    issueDate: ins.issueDate,
    expiryDate: ins.expiryDate,
    notes: '',
    pdfUrl: ins.pdfUrl,
  };
}

// ─── Verification badge ─────────────────────────────────────────────────────

const verificationConfig: Record<VerificationStatus, { bg: string; dot: string; ring: string }> = {
  verified: { bg: 'bg-emerald-50', dot: 'bg-emerald-500', ring: 'ring-emerald-600/20 text-emerald-700' },
  pending: { bg: 'bg-amber-50', dot: 'bg-amber-500', ring: 'ring-amber-600/20 text-amber-700' },
  unverified: { bg: 'bg-gray-100', dot: 'bg-gray-400', ring: 'ring-gray-500/20 text-gray-600' },
  rejected: { bg: 'bg-red-50', dot: 'bg-red-500', ring: 'ring-red-600/20 text-red-700' },
};

function VerificationChip({ status, label }: { status: VerificationStatus; label: string }) {
  const c = verificationConfig[status];
  return (
    <span className={classNames('inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset', c.bg, c.ring)}>
      <span className={classNames('h-2 w-2 rounded-full', c.dot)} aria-hidden />
      {label}
    </span>
  );
}

// ─── Insurance status chip ──────────────────────────────────────────────────

const policyConfig: Record<PolicyStatus, { bg: string; text: string; ring: string }> = {
  valid: { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-600/20' },
  expiring: { bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-600/20' },
  expired: { bg: 'bg-red-50', text: 'text-red-700', ring: 'ring-red-600/20' },
  missing: { bg: 'bg-gray-100', text: 'text-gray-600', ring: 'ring-gray-500/20' },
};

function PolicyChip({ status, label }: { status: PolicyStatus; label: string }) {
  const c = policyConfig[status];
  return (
    <span className={classNames('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset', c.bg, c.text, c.ring)}>
      {label}
    </span>
  );
}

// ─── Section layout primitives ──────────────────────────────────────────────

function Section({ id, title, icon, children }: { id?: string; title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <section id={id} className="border-t border-gray-200">
      <div className="flex items-center gap-2.5 px-6 pb-1 pt-5">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center text-gray-400" aria-hidden>{icon}</span>
        <h2 className="text-[11px] font-bold uppercase tracking-[0.08em] text-gray-400">{title}</h2>
      </div>
      <div className="px-6 pb-6 pt-3">{children}</div>
    </section>
  );
}

function DataRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  if (!value) return null;
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-gray-100 py-2.5 last:border-b-0">
      <dt className="shrink-0 text-[13px] text-gray-500">{label}</dt>
      <dd className={classNames('text-right text-[13px] font-medium text-gray-900', mono && 'font-mono tracking-tight')}>{value}</dd>
    </div>
  );
}

// ─── SVG Icons ──────────────────────────────────────────────────────────────

const ico = {
  user: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-[14px] w-[14px]">
      <path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z" />
    </svg>
  ),
  building: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-[14px] w-[14px]">
      <path fillRule="evenodd" d="M4 16.5v-13h-.25a.75.75 0 010-1.5h12.5a.75.75 0 010 1.5H16v13h.25a.75.75 0 010 1.5h-3.5a.75.75 0 01-.75-.75v-2.5a.75.75 0 00-.75-.75h-2.5a.75.75 0 00-.75.75v2.5a.75.75 0 01-.75.75h-3.5a.75.75 0 010-1.5H4zm3-11a.5.5 0 01.5-.5h1a.5.5 0 01.5.5v1a.5.5 0 01-.5.5h-1a.5.5 0 01-.5-.5v-1zM7.5 9a.5.5 0 00-.5.5v1a.5.5 0 00.5.5h1a.5.5 0 00.5-.5v-1a.5.5 0 00-.5-.5h-1zM11 5.5a.5.5 0 01.5-.5h1a.5.5 0 01.5.5v1a.5.5 0 01-.5.5h-1a.5.5 0 01-.5-.5v-1zm.5 3.5a.5.5 0 00-.5.5v1a.5.5 0 00.5.5h1a.5.5 0 00.5-.5v-1a.5.5 0 00-.5-.5h-1z" clipRule="evenodd" />
    </svg>
  ),
  drone: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-[14px] w-[14px]">
      <path d="M15.98 1.804a1 1 0 00-1.96 0l-.24 1.192a1 1 0 01-.784.785l-1.192.238a1 1 0 000 1.962l1.192.238a1 1 0 01.785.785l.238 1.192a1 1 0 001.962 0l.238-1.192a1 1 0 01.785-.785l1.192-.238a1 1 0 000-1.962l-1.192-.238a1 1 0 01-.785-.785l-.238-1.192zM6.949 5.684a1 1 0 00-1.898 0l-.683 2.051a1 1 0 01-.633.633l-2.052.683a1 1 0 000 1.898l2.052.683a1 1 0 01.633.633l.683 2.051a1 1 0 001.898 0l.683-2.051a1 1 0 01.633-.633l2.052-.683a1 1 0 000-1.898l-2.052-.683a1 1 0 01-.633-.633L6.95 5.684zM13.949 13.684a1 1 0 00-1.898 0l-.184.551a1 1 0 01-.632.633l-.551.183a1 1 0 000 1.898l.551.184a1 1 0 01.633.632l.183.551a1 1 0 001.898 0l.184-.551a1 1 0 01.632-.632l.551-.184a1 1 0 000-1.898l-.551-.183a1 1 0 01-.633-.633l-.183-.551z" />
    </svg>
  ),
  shield: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-[14px] w-[14px]">
      <path fillRule="evenodd" d="M9.661 2.237a.531.531 0 01.678 0 11.947 11.947 0 007.078 2.749.5.5 0 01.479.425c.069.52.104 1.05.104 1.59 0 5.162-3.26 9.563-7.834 11.256a.48.48 0 01-.332 0C5.26 16.564 2 12.163 2 7c0-.538.035-1.069.104-1.589a.5.5 0 01.48-.425 11.947 11.947 0 007.077-2.75z" clipRule="evenodd" />
    </svg>
  ),
  qr: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-[14px] w-[14px]">
      <path fillRule="evenodd" d="M3.75 2A1.75 1.75 0 002 3.75v3.5C2 8.216 2.784 9 3.75 9h3.5C8.216 9 9 8.216 9 7.25v-3.5C9 2.784 8.216 2 7.25 2h-3.5zm0 9A1.75 1.75 0 002 12.75v3.5c0 .966.784 1.75 1.75 1.75h3.5C8.216 18 9 17.216 9 16.25v-3.5C9 11.784 8.216 11 7.25 11h-3.5zm9-9A1.75 1.75 0 0011 3.75v3.5c0 .966.784 1.75 1.75 1.75h3.5C17.216 9 18 8.216 18 7.25v-3.5C18 2.784 17.216 2 16.25 2h-3.5zm-1 9a1 1 0 011-1h.01a1 1 0 110 2H12.75a1 1 0 01-1-1zm3.5 0a1 1 0 011-1h.01a1 1 0 110 2h-.01a1 1 0 01-1-1zm-3.5 3.5a1 1 0 011-1h.01a1 1 0 110 2h-.01a1 1 0 01-1-1zm3.5 0a1 1 0 011-1h.01a1 1 0 110 2h-.01a1 1 0 01-1-1z" clipRule="evenodd" />
    </svg>
  ),
  clipboard: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-[14px] w-[14px]">
      <path fillRule="evenodd" d="M15.988 3.012A2.25 2.25 0 0118 5.25v6.5A2.25 2.25 0 0115.75 14H13.5V7A2.5 2.5 0 0011 4.5H8.128a2.252 2.252 0 011.884-1.488A2.25 2.25 0 0112.25 1h1.5a2.25 2.25 0 012.238 2.012zM11.5 3.25a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5a.75.75 0 01-.75-.75z" clipRule="evenodd" />
      <path fillRule="evenodd" d="M2 7a1 1 0 011-1h8a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V7zm2 3.25a.75.75 0 01.75-.75h4.5a.75.75 0 010 1.5h-4.5a.75.75 0 01-.75-.75zm0 3.5a.75.75 0 01.75-.75h4.5a.75.75 0 010 1.5h-4.5a.75.75 0 01-.75-.75z" clipRule="evenodd" />
    </svg>
  ),
  exclamation: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 shrink-0">
      <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
    </svg>
  ),
  check: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 shrink-0">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
    </svg>
  ),
};

// ─── Insurance status banner ────────────────────────────────────────────────

function InsuranceBanner({ status, message }: { status: PolicyStatus; message: string }) {
  const styles: Record<PolicyStatus, string> = {
    valid: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    expiring: 'border-amber-200 bg-amber-50 text-amber-800',
    expired: 'border-red-200 bg-red-50 text-red-800',
    missing: 'border-gray-200 bg-gray-50 text-gray-600',
  };
  const iconMap: Record<PolicyStatus, ReactNode> = {
    valid: ico.check,
    expiring: ico.exclamation,
    expired: ico.exclamation,
    missing: ico.exclamation,
  };
  return (
    <div className={classNames('flex items-start gap-3 rounded-lg border p-3.5 text-sm leading-snug', styles[status])} role={status === 'expired' ? 'alert' : 'status'}>
      <span className="mt-0.5">{iconMap[status]}</span>
      <p className="font-medium">{message}</p>
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────

export function PublicProfileCard({ profile }: PublicProfileCardProps) {
  const { t } = useLanguage();

  // All data comes from the PublicProfile projection — no admin fields available
  const p = profile.person;
  const org = profile.organization;
  const ins = profile.insurance;
  const drone = profile.drone;
  const assets = profile.assets;

  const insForStatus = insuranceForStatus(ins);
  const policySummary: PolicySummary = describePolicyStatus(insForStatus);
  const policyStatus = policySummary.status;

  const fullName = [p.firstName, p.lastName].filter(Boolean).join(' ').trim() || '—';
  const hasOrg = Boolean(val(org.companyName));
  const hasPdf = Boolean(val(ins.pdfUrl));
  const hasDrone = Boolean(val(drone.droneName)) || Boolean(val(drone.droneModel)) ||
    Boolean(val(drone.droneSerialNumber)) || Boolean(val(drone.droneRegistrationCode));
  const hasQr = Boolean(val(assets.qrCodeUrl));
  const hasInsurance = Boolean(val(ins.provider)) || Boolean(val(ins.maskedPolicyNumber));
  const na = t('public.noInformation');

  function insuranceBannerMessage(): string {
    if (policyStatus === 'valid') return t('public.insuranceValid');
    if (policyStatus === 'expiring') return t('public.insuranceExpiring', { days: policySummary.days ?? '?' });
    if (policyStatus === 'expired') return t('public.insuranceExpired');
    return t('public.insuranceMissing');
  }

  const policyDescription = t(policySummary.descriptionKey, policySummary.descriptionParams);

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">

      {/* ═══════════════════════════════════════════════════════════════════
          1. HEADER — publicFields: name, operator code, photo, logo, banner
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="relative">
        <div className="relative h-36 w-full overflow-hidden sm:h-44">
          {val(assets.bannerUrl) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={assets.bannerUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-slate-800 via-slate-900 to-gray-950" aria-hidden />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" aria-hidden />

          {val(assets.logoUrl) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={assets.logoUrl} alt=""
              className="absolute right-4 top-4 h-10 w-10 rounded-lg border border-white/20 bg-white object-contain p-0.5 shadow-lg sm:h-12 sm:w-12" />
          ) : null}

          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 px-5 pb-4 sm:px-6">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/60">{t('public.operatorProfile')}</p>
              <h1 className="mt-0.5 text-xl font-bold tracking-tight text-white drop-shadow-sm sm:text-2xl">{fullName}</h1>
              {val(p.operatorCode) ? (
                <p className="mt-1 font-mono text-xs tracking-wide text-white/80">{p.operatorCode}</p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="absolute -bottom-10 left-5 z-10 sm:left-6">
          {val(assets.profilePhotoUrl) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={assets.profilePhotoUrl} alt=""
              className="h-20 w-20 rounded-xl border-[3px] border-white bg-white object-cover shadow-lg" />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-xl border-[3px] border-white bg-slate-800 text-lg font-bold tracking-wide text-white shadow-lg" aria-hidden>
              {initials(p.firstName, p.lastName)}
            </div>
          )}
        </div>
      </div>

      {/* Status badges */}
      <div className="flex flex-wrap items-center gap-2 px-5 pb-3 pl-28 pt-3 sm:px-6 sm:pl-[7.5rem]">
        <VerificationChip status={profile.verificationStatus} label={t(`verification.${profile.verificationStatus}`)} />
        <PolicyChip status={policyStatus} label={t(`policy.${policyStatus}`)} />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          2. IDENTITY — publicFields only (no birthDate, no emergencyContact)
          ═══════════════════════════════════════════════════════════════════ */}
      <Section title={t('public.identity')} icon={ico.user}>
        <dl>
          <DataRow label={t('field.firstName')} value={val(p.firstName)} />
          <DataRow label={t('field.lastName')} value={val(p.lastName)} />
          <DataRow label={t('public.operatorCode')} value={val(p.operatorCode)} mono />
          {val(p.operatorLicense) ? <DataRow label={t('public.licenseNumber')} value={p.operatorLicense} mono /> : null}
          {val(p.nationality) ? <DataRow label={t('field.nationality')} value={p.nationality} /> : null}
          <DataRow label={t('field.language')} value={langLabel(profile.language)} />
        </dl>
      </Section>

      {/* ═══════════════════════════════════════════════════════════════════
          3. ORGANIZATION — publicFields only (no address, no VAT)
          ═══════════════════════════════════════════════════════════════════ */}
      {hasOrg ? (
        <Section title={t('profile.organization')} icon={ico.building}>
          <dl>
            <DataRow label={t('field.companyName')} value={val(org.companyName)} />
            {val(org.companyDetails) ? <DataRow label={t('field.companyDetails')} value={org.companyDetails} /> : null}
          </dl>
        </Section>
      ) : null}

      {/* ═══════════════════════════════════════════════════════════════════
          4. DRONE — publicFields (registration identifiers for verification)
          ═══════════════════════════════════════════════════════════════════ */}
      {hasDrone ? (
        <Section title={t('public.droneInformation')} icon={ico.drone}>
          <dl>
            {val(drone.droneName) ? <DataRow label={t('field.droneName')} value={drone.droneName} /> : null}
            {val(drone.droneModel) ? <DataRow label={t('field.droneModel')} value={drone.droneModel} /> : null}
            {val(drone.droneSerialNumber) ? <DataRow label={t('field.serialNumber')} value={drone.droneSerialNumber} mono /> : null}
            {val(drone.droneRegistrationCode) ? <DataRow label={t('field.droneRegNumber')} value={drone.droneRegistrationCode} mono /> : null}
          </dl>
        </Section>
      ) : null}

      {/* ═══════════════════════════════════════════════════════════════════
          5. INSURANCE — publicFields: provider, masked policy #, dates
             adminOnlyFields stripped: notes
             pdfUrl: only present if projection allows it
          ═══════════════════════════════════════════════════════════════════ */}
      <Section title={t('public.insuranceCoverage')} icon={ico.shield}>
        <div className="space-y-4">
          <InsuranceBanner status={policyStatus} message={insuranceBannerMessage()} />
          <p className="text-xs font-medium text-gray-500">{policyDescription}</p>

          {hasInsurance ? (
            <div className="rounded-lg border border-gray-200 bg-gray-50/60">
              <div className="border-b border-gray-200 px-4 py-2.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400">{t('public.policyDetails')}</p>
              </div>
              <dl className="px-4 py-1">
                <DataRow label={t('profile.provider')} value={val(ins.provider) || na} />
                <DataRow label={t('profile.policyNumber')} value={val(ins.maskedPolicyNumber) || na} mono />
                <DataRow label={t('profile.validFrom')} value={ins.issueDate ? formatDate(ins.issueDate) : na} />
                <DataRow label={t('profile.validUntil')} value={ins.expiryDate ? formatDate(ins.expiryDate) : na} />
              </dl>
            </div>
          ) : null}

          {/* Policy document — only rendered if the projection included the URL */}
          <div className="rounded-lg border border-gray-200 bg-gray-50/60">
            <div className="border-b border-gray-200 px-4 py-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400">{t('public.policyDocument')}</p>
            </div>
            {hasPdf ? (
              <div className="p-4">
                <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
                  <iframe title={t('profile.viewPolicy')} src={ins.pdfUrl} className="h-[320px] w-full border-0" />
                </div>
                <a href={ins.pdfUrl} target="_blank" rel="noopener noreferrer"
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 active:bg-gray-950">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                    <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
                    <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
                  </svg>
                  {t('profile.viewPolicy')}
                </a>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 px-6 py-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-6 w-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-500">{t('public.policyNotAvailable')}</p>
                <p className="text-xs text-gray-400">{t('public.policyNotAvailableHint')}</p>
              </div>
            )}
          </div>
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════════════════════════
          6. QR — publicFields: QR image only (nfcReference excluded)
          ═══════════════════════════════════════════════════════════════════ */}
      {hasQr ? (
        <Section title={t('public.qrVerification')} icon={ico.qr}>
          <div className="flex flex-col items-center gap-3">
            <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
              <QRPreview url={assets.qrCodeUrl} size={180} />
            </div>
            <p className="text-xs text-gray-400">{t('public.scanToVerify')}</p>
          </div>
        </Section>
      ) : null}

      {/* ═══════════════════════════════════════════════════════════════════
          7. VERIFICATION METADATA — publicFields: status, dates, slug
             adminOnlyFields excluded: internal ID, updatedAt, createdAt
          ═══════════════════════════════════════════════════════════════════ */}
      <Section title={t('public.verificationRecord')} icon={ico.clipboard}>
        <dl>
          <DataRow label={t('verification.status')} value={t(`verification.${profile.verificationStatus}`)} />
          {val(profile.lastVerifiedAt) ? (
            <DataRow label={t('verification.lastVerified')} value={formatDateTime(profile.lastVerifiedAt)} />
          ) : null}
          {val(profile.publishedAt) ? (
            <DataRow label={t('field.publishedAt')} value={formatDateTime(profile.publishedAt)} />
          ) : null}
        </dl>
        <div className="mt-4 rounded-lg border border-gray-100 bg-gray-50/80 px-4 py-3">
          <dl className="space-y-1.5 text-[12px] text-gray-400">
            <div className="flex justify-between gap-4">
              <dt>{t('public.profileReference')}</dt>
              <dd className="font-mono text-gray-500">{profile.slug}</dd>
            </div>
          </dl>
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════════════════════════
          FOOTER
          ═══════════════════════════════════════════════════════════════════ */}
      <footer className="border-t border-gray-200 bg-gray-50/80 px-6 py-5">
        <p className="text-[11px] leading-relaxed text-gray-400">{t('profile.disclaimer')}</p>
        <p className="mt-2 text-[11px] text-gray-400">{t('public.latestRecord')}</p>
        <div className="mt-4 flex items-center justify-between">
          <p className="text-[10px] font-medium tracking-wide text-gray-300">{t('public.poweredBy')}</p>
          <p className="text-[10px] text-gray-300">DroneTag &copy; {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}
