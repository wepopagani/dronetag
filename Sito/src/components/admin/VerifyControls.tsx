'use client';

/**
 * Three-button verification toggle used across all admin verification UIs
 * (per-user editor + cross-user queue). Renders the current state with a
 * blue ring on the active button so admins always see what's set.
 */

import { useLanguage } from '@/contexts/LanguageContext';
import type { VerificationStatus } from '@/lib/types';
import { classNames } from '@/lib/utils';

export type VerifyControlsProps = {
  current: VerificationStatus;
  busy: boolean;
  onSet: (s: VerificationStatus) => void | Promise<void>;
};

export function VerifyControls({ current, busy, onSet }: VerifyControlsProps) {
  const { t } = useLanguage();

  function ringFor(s: VerificationStatus) {
    return current === s ? 'ring-2 ring-offset-1 ring-blue-500' : '';
  }

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        disabled={busy}
        onClick={() => onSet('verified')}
        className={classNames(
          'rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50',
          ringFor('verified'),
        )}
      >
        {t('admin.verify.markVerified')}
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => onSet('pending')}
        className={classNames(
          'rounded-md bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-700 transition hover:bg-amber-100 disabled:opacity-50',
          ringFor('pending'),
        )}
      >
        {t('admin.verify.markPending')}
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => onSet('rejected')}
        className={classNames(
          'rounded-md bg-red-50 px-2 py-1 text-[11px] font-medium text-red-700 transition hover:bg-red-100 disabled:opacity-50',
          ringFor('rejected'),
        )}
      >
        {t('admin.verify.markRejected')}
      </button>
    </div>
  );
}
