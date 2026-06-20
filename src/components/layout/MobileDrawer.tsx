'use client';

import { type ReactNode, useEffect } from 'react';
import { classNames } from '@/lib/utils';

type MobileDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  side?: 'left' | 'right';
};

export function MobileDrawer({
  isOpen,
  onClose,
  title,
  children,
  side = 'left',
}: MobileDrawerProps) {
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label={title}>
      <button
        type="button"
        className="absolute inset-0 bg-[var(--color-navy)]/50 backdrop-blur-[2px]"
        aria-label="Close menu"
        onClick={onClose}
      />
      <div
        className={classNames(
          'absolute top-0 flex h-full w-[min(20rem,88vw)] flex-col border-[var(--color-border)] bg-white shadow-2xl',
          side === 'left' ? 'left-0 border-r safe-pt safe-pb' : 'right-0 border-l safe-pt safe-pb',
        )}
        style={{ paddingBottom: 'var(--safe-bottom)' }}
      >
        {title ? (
          <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
            <span className="text-sm font-semibold text-[var(--color-text)]">{title}</span>
            <button type="button" className="tap-44 rounded-lg p-2 text-gray-500 hover:bg-gray-100" onClick={onClose} aria-label="Close">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : null}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
