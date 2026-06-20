'use client';

/**
 * Tiny "X of Y used" chip with optional at-cap state.
 *
 * Used at the top of every entity list page in the account dashboard so
 * the user can see at a glance how many slots remain. When `atCap`, the
 * chip turns amber and the consumer is expected to disable the "New" CTA.
 */

import { useLanguage } from '@/contexts/LanguageContext';
import { classNames } from '@/lib/utils';

export type SlotIndicatorProps = {
  used: number;
  max: number;
  className?: string;
};

export function SlotIndicator({ used, max, className }: SlotIndicatorProps) {
  const { t } = useLanguage();
  const atCap = used >= max;
  return (
    <span
      className={classNames(
        'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset',
        atCap
          ? 'bg-amber-50 text-amber-800 ring-amber-600/20'
          : 'bg-gray-50 text-gray-700 ring-gray-500/20',
        className,
      )}
    >
      <span className="font-mono tabular-nums">
        {t('slot.usage', { used, max })}
      </span>
      {atCap ? (
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-700">
          {t('slot.atCap')}
        </span>
      ) : null}
    </span>
  );
}
