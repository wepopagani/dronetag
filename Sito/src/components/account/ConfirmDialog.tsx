'use client';

/**
 * Confirm dialog used by the account dashboard for destructive actions.
 *
 * Wraps the existing `Modal` and forces an explicit, non-default-focused
 * "continue" button so the user must consciously confirm. When `danger` is
 * set, the confirm button is red and the modal carries a clear warning.
 *
 * `extraWarning` is rendered above the standard danger line and is meant
 * for context-specific messages (e.g. "this operator is the default for
 * 2 public drones — they will lose their default operator").
 */

import { type ReactNode } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

export type ConfirmDialogProps = {
  isOpen: boolean;
  title: string;
  /** Free-form message body. Plain string accepted; React nodes welcome. */
  message?: ReactNode;
  /** Extra warning shown above the generic "cannot be undone" line. */
  extraWarning?: ReactNode;
  /** Defaults to "Continue". */
  confirmLabel?: string;
  /** Defaults to "Cancel". */
  cancelLabel?: string;
  /** When true, the confirm button is danger-styled. Default: true. */
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export function ConfirmDialog({
  isOpen,
  title,
  message,
  extraWarning,
  confirmLabel,
  cancelLabel,
  danger = true,
  loading = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const { t } = useLanguage();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4">
        {extraWarning ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-800">
            {extraWarning}
          </div>
        ) : null}

        {message ? (
          <p className="text-sm leading-relaxed text-gray-700">{message}</p>
        ) : null}

        {danger ? (
          <p className="text-xs font-medium text-red-700">
            {t('confirm.dangerWarning')}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            {cancelLabel ?? t('common.cancel')}
          </Button>
          <Button
            variant={danger ? 'danger' : 'primary'}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel ?? t('confirm.continue')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
