'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/Button';
import { LandingIcons } from '@/components/landing/landingIcons';
import { PlatformPreview } from '@/components/landing/PlatformPreview';
import { useLandingAuth } from '@/components/landing/landingAuth';

const TRUST_ITEMS = [
  { icon: LandingIcons.nfc, labelKey: 'home.hero.trustNfc' as const },
  { icon: LandingIcons.shield, labelKey: 'home.hero.trustDocs' as const },
  { icon: LandingIcons.calendar, labelKey: 'home.hero.trustExpiry' as const },
];

export function LandingHero() {
  const { t } = useLanguage();
  const { user, dashboardHref } = useLandingAuth();

  return (
    <section className="overflow-x-safe border-b border-[var(--color-border)] bg-white pt-6 pb-10 sm:pt-8 sm:pb-14 lg:pb-16">
      <div className="mx-auto grid max-w-[72rem] items-center gap-8 px-4 sm:px-5 lg:grid-cols-2 lg:gap-10 lg:px-6">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-action)]">
            {t('home.hero.eyebrow')}
          </p>
          <h1 className="mt-3 max-w-xl text-[1.75rem] font-bold leading-[1.15] tracking-tight text-[var(--color-navy)] sm:text-4xl lg:text-[2.625rem]">
            {t('home.hero.title')}
          </h1>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-[var(--color-text-secondary)] sm:text-base">
            {t('home.hero.subtitle')}
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button href={user ? dashboardHref : '/login'} size="lg" fullWidth className="min-h-[2.75rem] sm:w-auto sm:min-w-[12rem]">
              {user ? t('home.hero.ctaDashboard') : t('home.hero.ctaPrimary')}
            </Button>
            {!user ? (
              <Button href="#come-funziona" variant="secondary" size="lg" fullWidth className="min-h-[2.75rem] sm:w-auto">
                {t('home.hero.ctaSecondary')}
              </Button>
            ) : null}
          </div>

          <ul className="mt-6 flex flex-col gap-2.5 sm:mt-8 sm:flex-row sm:flex-wrap sm:gap-x-5 sm:gap-y-2">
            {TRUST_ITEMS.map(({ icon: Icon, labelKey }) => (
              <li key={labelKey} className="flex items-center gap-2 text-xs font-medium text-[var(--color-text-secondary)] sm:text-sm">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-action-light)] text-[var(--color-action)]">
                  <Icon className="h-4 w-4" />
                </span>
                {t(labelKey)}
              </li>
            ))}
          </ul>
        </div>

        <div className="min-w-0 lg:justify-self-end">
          <PlatformPreview />
        </div>
      </div>
    </section>
  );
}
