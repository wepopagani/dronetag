'use client';

import { type ReactNode, useState } from 'react';
import { classNames } from '@/lib/utils';

export type AccordionProps = {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
};

export function Accordion({ title, defaultOpen = false, children }: AccordionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-200 py-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 py-3 text-left transition hover:opacity-90"
        aria-expanded={open}
      >
        <span className="font-medium text-gray-900">{title}</span>
        <svg
          className={classNames(
            'h-5 w-5 shrink-0 text-gray-500 transition-transform duration-200 ease-out',
            open && 'rotate-180'
          )}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        className={classNames(
          'grid transition-[grid-template-rows] duration-200 ease-out',
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        )}
      >
        <div className="overflow-hidden">
          <div className="pb-4 pt-0 text-sm text-gray-600">{children}</div>
        </div>
      </div>
    </div>
  );
}
