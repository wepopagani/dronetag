'use client';

import type { ReactNode } from 'react';

function DefaultIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
    </svg>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  hints,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  /**
   * Optional 2–3 next-step suggestions that make the empty page feel
   * actionable during demos. Rendered as a small numbered list under the
   * description. Keep each hint short (≤ 60 chars) and copy-driven.
   */
  hints?: string[];
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-[var(--radius-card)] border border-dashed border-[var(--color-border)] bg-white px-4 py-6 text-center sm:px-6 sm:py-8">
      <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--color-action-light)] text-[var(--color-action)] sm:mb-3 sm:h-11 sm:w-11">
        {icon ?? <DefaultIcon />}
      </div>
      <h3 className="text-sm font-semibold text-[var(--color-text)]">{title}</h3>
      {description ? (
        <p className="mt-1 max-w-sm text-xs leading-relaxed text-[var(--color-text-secondary)] sm:text-sm">{description}</p>
      ) : null}
      {hints && hints.length > 0 ? (
        <ol className="mt-2 grid w-full max-w-sm gap-1 text-left sm:mt-3">
          {hints.map((h, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-[var(--color-text-secondary)]">
              <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[10px] font-semibold text-gray-600">
                {i + 1}
              </span>
              <span className="leading-snug">{h}</span>
            </li>
          ))}
        </ol>
      ) : null}
      {action ? <div className="mt-4 w-full max-w-xs">{action}</div> : null}
    </div>
  );
}
