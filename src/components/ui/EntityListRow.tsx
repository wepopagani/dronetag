'use client';

import { type ReactNode } from 'react';

/** Stacks entity info above actions on mobile; side-by-side from sm+. */
export function EntityListRow({
  children,
  actions,
}: {
  children: ReactNode;
  actions: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 flex-1">{children}</div>
      {actions ? (
        <div className="min-w-0 border-t border-[var(--color-border)] pt-3 sm:w-auto sm:shrink-0 sm:border-0 sm:pt-0">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
