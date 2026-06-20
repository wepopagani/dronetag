'use client';

import { type ReactNode } from 'react';
import { classNames } from '@/lib/utils';

export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

const paddingClasses: Record<CardPadding, string> = {
  none: '',
  sm: 'p-3 sm:p-4',
  md: 'p-4 sm:p-6',
  lg: 'p-5 sm:p-8',
};

export type CardProps = {
  children: ReactNode;
  className?: string;
  padding?: CardPadding;
};

export function Card({ children, className, padding = 'md' }: CardProps) {
  return (
    <div
      className={classNames(
        'rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-card)] shadow-[var(--shadow-card)]',
        paddingClasses[padding],
        className,
      )}
    >
      {children}
    </div>
  );
}
