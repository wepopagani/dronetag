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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby={titleId}>
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
          'relative z-10 w-full max-w-lg rounded-xl border border-gray-100 bg-white shadow-xl',
          'translate-y-2 scale-[0.98] opacity-0 transition-all duration-200 ease-out'
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-4">
          <h2 id={titleId} className="text-lg font-semibold text-gray-900">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="max-h-[min(70vh,32rem)] overflow-y-auto px-6 py-4">{children}</div>
      </div>
    </div>
  );
}
