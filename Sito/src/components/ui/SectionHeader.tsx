'use client';

import { classNames } from '@/lib/utils';

export type SectionHeaderProps = {
  title: string;
  description?: string;
};

export function SectionHeader({ title, description }: SectionHeaderProps) {
  return (
    <header className={classNames(description ? 'mb-6' : 'mb-4')}>
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      {description ? (
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      ) : null}
    </header>
  );
}
