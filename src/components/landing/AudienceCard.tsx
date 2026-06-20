'use client';

import Link from 'next/link';
import { type ReactNode } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { classNames } from '@/lib/utils';
import { LandingIcons } from '@/components/landing/landingIcons';

type AudienceCardProps = {
  titleKey: 'home.audience.operator.title' | 'home.audience.admin.title' | 'home.audience.verifier.title';
  descKey: 'home.audience.operator.desc' | 'home.audience.admin.desc' | 'home.audience.verifier.desc';
  ctaKey: 'home.audience.operator.cta' | 'home.audience.admin.cta' | 'home.audience.verifier.cta';
  href: string;
  icon: ReactNode;
  accent?: 'blue' | 'navy' | 'green';
};

const accentClasses = {
  blue: 'bg-[var(--color-action-light)] text-[var(--color-action)]',
  navy: 'bg-[var(--color-navy)]/10 text-[var(--color-navy)]',
  green: 'bg-emerald-50 text-emerald-700',
};

export function AudienceCard({ titleKey, descKey, ctaKey, href, icon, accent = 'blue' }: AudienceCardProps) {
  const { t } = useLanguage();

  return (
    <Link
      href={href}
      className="group tap-44 flex min-h-[8.5rem] flex-col rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-[var(--shadow-card)] transition hover:border-[var(--color-action)]/30 hover:shadow-md sm:min-h-[9.5rem] sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <span className={classNames('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', accentClasses[accent])}>
          {icon}
        </span>
        <LandingIcons.chevronRight className="mt-1 shrink-0 text-[var(--color-text-secondary)] transition group-hover:translate-x-0.5 group-hover:text-[var(--color-action)]" />
      </div>
      <h3 className="mt-3 text-sm font-semibold text-[var(--color-text)] sm:text-base">{t(titleKey)}</h3>
      <p className="mt-1 flex-1 text-xs leading-relaxed text-[var(--color-text-secondary)] sm:text-sm">{t(descKey)}</p>
      <span className="mt-3 text-xs font-semibold text-[var(--color-action)] sm:text-sm">{t(ctaKey)}</span>
    </Link>
  );
}

import { useLandingAuth } from '@/components/landing/landingAuth';

export function AudienceCards() {
  const { accountHref, adminHref } = useLandingAuth();

  return (
    <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
      <AudienceCard
        titleKey="home.audience.operator.title"
        descKey="home.audience.operator.desc"
        ctaKey="home.audience.operator.cta"
        href={accountHref}
        icon={<LandingIcons.user className="h-5 w-5" />}
        accent="blue"
      />
      <AudienceCard
        titleKey="home.audience.admin.title"
        descKey="home.audience.admin.desc"
        ctaKey="home.audience.admin.cta"
        href={adminHref}
        icon={<LandingIcons.admin className="h-5 w-5" />}
        accent="navy"
      />
      <AudienceCard
        titleKey="home.audience.verifier.title"
        descKey="home.audience.verifier.desc"
        ctaKey="home.audience.verifier.cta"
        href="#verifica"
        icon={<LandingIcons.search className="h-5 w-5" />}
        accent="green"
      />
    </div>
  );
}
