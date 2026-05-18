'use client';

import { type ReactNode, useEffect, useId, useRef } from 'react';
import { classNames } from '@/lib/utils';

export type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
};

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const titleId = useId();
  const backdropRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const id = requestAnimationFrame(() => {
      backdropRef.current?.classList.remove('opacity-0');
      backdropRef.current?.classList.add('opacity-100');
      panelRef.current?.classList.remove('translate-y-2', 'scale-[0.98]', 'opacity-0');
      panelRef.current?.classList.add('translate-y-0', 'scale-100', 'opacity-100');
    });

    return () => {
      cancelAnimationFrame(id);
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prev;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  /*
   * Mobile-first layout decisions (STAGING-OPS-1):
   *
   *   • The outer container uses `items-end sm:items-center` so on phones the
   *     panel sits as a near-bottom-sheet — easier to reach with a thumb and,
   *     critically, the on-screen keyboard doesn't push the submit CTA off
   *     screen because the panel is anchored from the bottom.
   *   • Height uses `dvh` (dynamic viewport height) so iOS Safari's URL bar
   *     collapse doesn't cause layout jumps.
   *   • Bottom safe-area padding via .safe-pb so the iPhone home indicator
   *     never sits over the panel content.
   *   • `overscroll-contain` on the scroll body prevents pull-to-refresh from
   *     accidentally closing the page on Android Chrome.
   */
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-2 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        ref={backdropRef}
        type="button"
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm opacity-0 transition-opacity duration-200"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        className={classNames(
          'relative z-10 flex w-full max-w-lg flex-col rounded-t-2xl border border-gray-100 bg-white shadow-xl sm:rounded-xl',
          'max-h-[calc(100dvh-1rem)] sm:max-h-[min(85dvh,40rem)]',
          'translate-y-2 scale-[0.98] opacity-0 transition-all duration-200 ease-out',
        )}
      >
        {/* Drag-affordance for mobile sheet feel — visual only, non-interactive. */}
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-gray-200 sm:hidden" aria-hidden />

        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6">
          <h2 id={titleId} className="text-lg font-semibold text-gray-900">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="tap-44 -mr-2 inline-flex items-center justify-center rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="safe-pb min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 sm:px-6">
          {children}
        </div>
      </div>
    </div>
  );
}
