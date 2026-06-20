'use client';

import { type ReactNode } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

type FeatureCardProps = {
  titleKey: string;
  descKey: string;
  icon: ReactNode;
};

export function FeatureCard({ titleKey, descKey, icon }: FeatureCardProps) {
  const { t } = useLanguage();

  return (
    <div className="group rounded-2xl border border-[var(--color-border)] bg-white p-4 transition hover:border-[var(--color-action)]/25 hover:shadow-[var(--shadow-card)] sm:p-5">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-action-light)] text-[var(--color-action)] transition group-hover:bg-[var(--color-action)] group-hover:text-white">
        {icon}
      </span>
      <h3 className="mt-3 text-sm font-semibold text-[var(--color-text)]">{t(titleKey as never)}</h3>
      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[var(--color-text-secondary)] sm:text-sm">
        {t(descKey as never)}
      </p>
    </div>
  );
}

export function FeatureGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
      {children}
    </div>
  );
}
