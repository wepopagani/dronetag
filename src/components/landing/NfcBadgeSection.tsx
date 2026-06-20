'use client';

import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';
import { LandingIcons } from '@/components/landing/landingIcons';
import { VerificationBadge } from '@/components/ui/StatusBadge';

const BENEFIT_KEYS = [
  'home.nfc.benefit1',
  'home.nfc.benefit2',
  'home.nfc.benefit3',
] as const;

export function NfcBadgeSection() {
  const { t } = useLanguage();

  return (
    <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
      <div className="min-w-0">
        <h2 className="text-xl font-bold tracking-tight text-[var(--color-navy)] sm:text-2xl lg:text-[1.75rem]">
          {t('home.nfc.title')}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-secondary)] sm:text-base">
          {t('home.nfc.subtitle')}
        </p>
        <ul className="mt-5 space-y-2.5">
          {BENEFIT_KEYS.map((key) => (
            <li key={key} className="flex items-start gap-2.5 text-sm text-[var(--color-text)]">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <LandingIcons.check className="h-3 w-3" />
              </span>
              {t(key)}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex min-w-0 items-center justify-center gap-3 sm:gap-5">
        {/* Badge mockup */}
        <div className="flex shrink-0 flex-col items-center gap-2">
          <div className="relative flex h-24 w-24 items-center justify-center rounded-2xl border-2 border-[var(--color-border)] bg-white shadow-[var(--shadow-card)] sm:h-28 sm:w-28">
            <Image src="/logo.png?v=3" alt="" width={64} height={64} className="h-12 w-12 sm:h-14 sm:w-14" unoptimized aria-hidden />
            <span className="absolute -bottom-2 rounded-full bg-[var(--color-navy)] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
              NFC
            </span>
          </div>
          <span className="text-[10px] font-medium text-[var(--color-text-secondary)]">DroneTag</span>
        </div>

        <div className="flex shrink-0 flex-col items-center gap-1 text-[var(--color-text-secondary)]">
          <LandingIcons.nfc className="h-6 w-6 text-[var(--color-action)]" />
          <LandingIcons.arrowRight className="h-5 w-5" />
        </div>

        {/* Mini phone */}
        <div className="w-[9.5rem] shrink-0 rounded-[1.25rem] border-4 border-[var(--color-navy)] bg-[var(--color-navy)] p-0.5 shadow-[var(--shadow-card)] sm:w-[10.5rem]">
          <div className="overflow-hidden rounded-[0.875rem] bg-[var(--color-app-bg)] p-2.5">
            <div className="rounded-xl border border-[var(--color-border)] bg-white p-2.5">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-navy)] text-[10px] font-bold text-white">
                  MB
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-semibold">{t('home.preview.operatorName')}</p>
                  <VerificationBadge status="verified" />
                </div>
              </div>
              <div className="mt-2 flex items-center justify-center rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-app-bg)] p-2">
                <LandingIcons.qr className="h-8 w-8 text-[var(--color-text-secondary)]" />
              </div>
              <p className="mt-1.5 text-center text-[9px] text-[var(--color-text-secondary)]">{t('home.nfc.scanHint')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
