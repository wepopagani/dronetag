'use client';

/**
 * Small banner shown at the top of a form when validation has failed or
 * a save call returned an error. Acts as the aggregate "something is
 * wrong" indicator complementing inline field errors.
 */

import { useLanguage } from '@/contexts/LanguageContext';
import { classNames } from '@/lib/utils';

export type FormErrorBannerProps = {
  /** When false, renders nothing. */
  show: boolean;
  /** Optional override message; defaults to the generic "fix the fields" copy. */
  message?: string;
  className?: string;
};

export function FormErrorBanner({ show, message, className }: FormErrorBannerProps) {
  const { t } = useLanguage();
  if (!show) return null;
  return (
    <div
      role="alert"
      className={classNames(
        'flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800',
        className,
      )}
    >
      <svg
        className="mt-0.5 h-4 w-4 shrink-0"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden
      >
        <path
          fillRule="evenodd"
          d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
          clipRule="evenodd"
        />
      </svg>
      <span>{message ?? t('form.errors.title')}</span>
    </div>
  );
}
