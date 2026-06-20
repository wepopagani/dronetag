'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/Button';
import { useLandingAuth } from '@/components/landing/landingAuth';

export function LandingCTA() {
  const { t } = useLanguage();
  const { user, dashboardHref } = useLandingAuth();

  return (
    <div className="rounded-2xl bg-[var(--color-navy)] px-5 py-8 text-center sm:px-8 sm:py-10 lg:px-12">
      <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl lg:text-[1.75rem]">
        {t('home.ctaFinal.title')}
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-white/75 sm:text-base">
        {t('home.ctaFinal.subtitle')}
      </p>
      <div className="mt-6 flex justify-center">
        <Button href={user ? dashboardHref : '/login'} size="lg" className="min-h-[2.75rem] sm:min-w-[14rem]">
          {user ? t('home.hero.ctaDashboard') : t('home.hero.ctaPrimary')}
        </Button>
      </div>
    </div>
  );
}
