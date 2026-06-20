'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { VerificationBadge } from '@/components/ui/StatusBadge';
import { LandingIcons } from '@/components/landing/landingIcons';

function CheckRow({ label, value, status }: { label: string; value: string; status?: 'valid' | 'active' }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] py-2.5 last:border-0">
      <span className="text-xs text-[var(--color-text-secondary)]">{label}</span>
      <span className="flex items-center gap-2 text-right text-xs font-medium text-[var(--color-text)]">
        {value}
        {status === 'valid' ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
            OK
          </span>
        ) : null}
        {status === 'active' ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
            2
          </span>
        ) : null}
      </span>
    </div>
  );
}

export function VerificationPreview() {
  const { t } = useLanguage();

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[1fr_1.1fr] lg:gap-10">
      <div className="min-w-0 lg:sticky lg:top-[calc(var(--header-height)+1.5rem)]">
        <h2 className="text-xl font-bold tracking-tight text-[var(--color-navy)] sm:text-2xl lg:text-[1.75rem]">
          {t('home.verify.title')}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-secondary)] sm:text-base">
          {t('home.verify.subtitle')}
        </p>
        <ul className="mt-5 space-y-2">
          {(['home.verify.point1', 'home.verify.point2', 'home.verify.point3'] as const).map((key) => (
            <li key={key} className="flex items-start gap-2 text-sm text-[var(--color-text)]">
              <LandingIcons.check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              {t(key)}
            </li>
          ))}
        </ul>
      </div>

      <div className="min-w-0 rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-[var(--shadow-card)] sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-navy)] text-sm font-bold text-white">
              MB
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--color-text)]">{t('home.preview.operatorName')}</p>
              <p className="text-xs text-[var(--color-text-secondary)]">{t('home.verify.operatorId')}</p>
            </div>
          </div>
          <VerificationBadge status="verified" />
        </div>

        <div className="mt-4 rounded-xl bg-[var(--color-app-bg)] px-3 py-1">
          <CheckRow label={t('home.verify.rowInsurance')} value={t('home.preview.valid')} status="valid" />
          <CheckRow label={t('home.verify.rowCertificates')} value={t('home.verify.certificatesValue')} status="active" />
        </div>
      </div>
    </div>
  );
}
