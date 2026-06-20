'use client';

import { type ReactNode, useEffect, useId, useRef, useState } from 'react';
import { classNames } from '@/lib/utils';

export type RowAction = {
  key: string;
  label: string;
  onClick: () => void;
  danger?: boolean;
  hidden?: boolean;
};

export function RowActionMenu({ actions, extra }: { actions: RowAction[]; extra?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const visible = actions.filter((a) => !a.hidden);

  useEffect(() => {
    if (!open) return;
    function onPointer(e: MouseEvent | TouchEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('touchstart', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('touchstart', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (visible.length === 0 && !extra) return null;

  return (
    <div ref={rootRef} className="relative min-w-0">
      {/* Desktop: inline buttons */}
      <div className="hidden flex-wrap items-center justify-end gap-1.5 sm:flex">
        {extra}
        {visible.map((a) => (
          <button
            key={a.key}
            type="button"
            onClick={a.onClick}
            className={classNames(
              'tap-44 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              a.danger
                ? 'text-red-600 hover:bg-red-50'
                : 'text-[var(--color-text-secondary)] hover:bg-gray-100 hover:text-[var(--color-text)]',
            )}
          >
            {a.label}
          </button>
        ))}
      </div>

      {/* Mobile: overflow menu */}
      <div className="flex items-center gap-2 sm:hidden">
        {extra}
        {visible.length > 0 ? (
          <>
            <button
              type="button"
              className="tap-44 ml-auto inline-flex items-center justify-center rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm font-medium text-[var(--color-text)]"
              aria-expanded={open}
              aria-haspopup="menu"
              aria-controls={menuId}
              onClick={() => setOpen((o) => !o)}
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                <circle cx="12" cy="5" r="1.75" />
                <circle cx="12" cy="12" r="1.75" />
                <circle cx="12" cy="19" r="1.75" />
              </svg>
              <span className="sr-only">Actions</span>
            </button>
            {open ? (
              <div
                id={menuId}
                role="menu"
                className="absolute right-0 bottom-full z-20 mb-2 min-w-[11rem] overflow-hidden rounded-xl border border-[var(--color-border)] bg-white py-1 shadow-lg"
              >
                {visible.map((a) => (
                  <button
                    key={a.key}
                    type="button"
                    role="menuitem"
                    className={classNames(
                      'tap-44 flex w-full items-center px-4 py-3 text-left text-sm font-medium',
                      a.danger ? 'text-red-600 hover:bg-red-50' : 'text-[var(--color-text)] hover:bg-gray-50',
                    )}
                    onClick={() => {
                      setOpen(false);
                      a.onClick();
                    }}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
