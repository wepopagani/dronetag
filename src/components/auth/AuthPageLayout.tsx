'use client';

import Image from 'next/image';
import Link from 'next/link';
import { type ReactNode } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

type AuthPageLayoutProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthPageLayout({ title, subtitle, children, footer }: AuthPageLayoutProps) {
  const { t } = useLanguage();

  return (
    <div className="flex min-h-[calc(100dvh-var(--header-height)-var(--safe-top))] items-center justify-center bg-[var(--color-app-bg)] px-4 py-8 sm:py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="mx-auto mb-4 inline-flex items-center gap-2">
            <span className="inline-flex overflow-hidden rounded-xl">
              <Image src="/logo.png?v=3" alt="DroneTag" width={512} height={512} className="h-11 w-11" unoptimized />
            </span>
          </Link>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-action)]">
            {t('auth.consumerEyebrow')}
          </p>
          <h1 className="mt-2 text-xl font-bold tracking-tight text-[var(--color-navy)] sm:text-2xl">{title}</h1>
          {subtitle ? (
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">{subtitle}</p>
          ) : null}
        </div>

        <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-card)] sm:p-6">
          {children}
        </div>

        {footer ? <div className="mt-5 space-y-2 text-center">{footer}</div> : null}
      </div>
    </div>
  );
}
