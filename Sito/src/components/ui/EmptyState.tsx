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
    <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white px-6 py-12 text-center shadow-sm sm:py-16">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
        {icon ?? <DefaultIcon />}
      </div>
      <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
      {description ? (
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-gray-500">{description}</p>
      ) : null}
      {hints && hints.length > 0 ? (
        <ol className="mt-4 grid w-full max-w-sm gap-1.5 text-left">
          {hints.map((h, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-gray-500">
              <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[10px] font-semibold text-gray-600">
                {i + 1}
              </span>
              <span className="leading-snug">{h}</span>
            </li>
          ))}
        </ol>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
