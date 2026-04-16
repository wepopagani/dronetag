'use client';

import { type ReactNode } from 'react';
import { classNames } from '@/lib/utils';

export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

const paddingClasses: Record<CardPadding, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
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
        'rounded-xl border border-gray-100 bg-white shadow-sm',
        paddingClasses[padding],
        className
      )}
    >
      {children}
    </div>
  );
}
