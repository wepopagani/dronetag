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
import { classNames } from '@/lib/utils';
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
  const hasFab = Boolean(newLabel && onNew);

  return (
    <div className={classNames('space-y-3 sm:space-y-4', hasFab && 'pb-bottom-nav-fab sm:pb-0')}>
      <header className="flex flex-wrap items-start justify-between gap-2 sm:gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-bold tracking-tight text-[var(--color-text)] sm:text-xl">{title}</h2>
          {subtitle ? (
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{subtitle}</p>
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
            <Button onClick={onNew} disabled={newDisabled} className="hidden sm:inline-flex">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              {newLabel}
            </Button>
          ) : null}
        </div>
      </header>

      {children}

      {newLabel && onNew ? (
        <div className="fixed right-4 z-30 sm:hidden" style={{ bottom: 'calc(var(--bottom-nav-height) + var(--safe-bottom) + 0.5rem)' }}>
          <button
            type="button"
            className="tap-44 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-action)] text-white shadow-lg transition hover:bg-blue-700 disabled:opacity-50"
            aria-label={newLabel}
            disabled={newDisabled}
            onClick={onNew}
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
        </div>
      ) : null}
    </div>
  );
}
