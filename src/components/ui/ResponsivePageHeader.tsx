'use client';

import { type ReactNode } from 'react';
import { classNames } from '@/lib/utils';

export function ResponsivePageHeader({
  title,
  subtitle,
  eyebrow,
  actions,
  className,
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header className={classNames('mb-4 flex flex-wrap items-start justify-between gap-2 sm:mb-5 sm:gap-3', className)}>
      <div className="min-w-0 flex-1">
        {eyebrow ? (
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-secondary)] sm:text-[11px]">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-lg font-bold leading-snug tracking-tight text-[var(--color-text)] sm:text-2xl">{title}</h1>
        {subtitle ? (
          <p className="mt-0.5 text-xs leading-relaxed text-[var(--color-text-secondary)] sm:mt-1 sm:text-sm">{subtitle}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  );
}
