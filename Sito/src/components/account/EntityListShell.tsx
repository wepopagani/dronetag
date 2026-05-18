'use client';

/**
 * Shared layout for the M2 entity list pages:
 *   header (title + subtitle + slot indicator) → primary "new" CTA →
 *   children area (the list itself, or an EmptyState).
 *
 * Keeps every list page visually consistent and removes a lot of
 * boilerplate.
 */

import { type ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { SlotIndicator } from './SlotIndicator';

export type EntityListShellProps = {
  title: string;
  subtitle?: string;
  used?: number;
  max?: number;
  newLabel?: string;
  onNew?: () => void;
  newDisabled?: boolean;
  children: ReactNode;
  rightActions?: ReactNode;
};

export function EntityListShell({
  title,
  subtitle,
  used,
  max,
  newLabel,
  onNew,
  newDisabled,
  children,
  rightActions,
}: EntityListShellProps) {
  const showSlots = typeof used === 'number' && typeof max === 'number';
  return (
    <div className="mt-6 space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          {subtitle ? (
            <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
          ) : null}
          {showSlots ? (
            <div className="mt-2">
              <SlotIndicator used={used} max={max} />
            </div>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {rightActions}
          {newLabel && onNew ? (
            <Button onClick={onNew} disabled={newDisabled}>
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              {newLabel}
            </Button>
          ) : null}
        </div>
      </header>

      {children}
    </div>
  );
}
