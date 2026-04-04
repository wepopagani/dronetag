'use client';

import { classNames } from '@/lib/utils';

type Variant = 'default' | 'success' | 'warning' | 'danger';

const styles: Record<Variant, { border: string; bg: string; text: string; accent: string }> = {
  default: { border: 'border-gray-200', bg: 'bg-white', text: 'text-gray-900', accent: 'text-gray-400' },
  success: { border: 'border-emerald-200', bg: 'bg-emerald-50/50', text: 'text-emerald-700', accent: 'text-emerald-500' },
  warning: { border: 'border-amber-200', bg: 'bg-amber-50/50', text: 'text-amber-700', accent: 'text-amber-500' },
  danger: { border: 'border-red-200', bg: 'bg-red-50/50', text: 'text-red-700', accent: 'text-red-500' },
};

const dotColor: Record<Variant, string> = {
  default: 'bg-gray-300',
  success: 'bg-emerald-400',
  warning: 'bg-amber-400',
  danger: 'bg-red-400',
};

export function StatsCard({
  label,
  value,
  variant = 'default',
}: {
  label: string;
  value: number | string;
  variant?: Variant;
}) {
  const s = styles[variant];
  const showDot = variant !== 'default' && Number(value) > 0;
  return (
    <div className={classNames('rounded-xl border px-4 py-3.5', s.border, s.bg)}>
      <div className="flex items-center gap-1.5">
        {showDot ? <span className={classNames('h-1.5 w-1.5 rounded-full', dotColor[variant])} aria-hidden /> : null}
        <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">{label}</p>
      </div>
      <p className={classNames('mt-1 text-2xl font-semibold tabular-nums', s.text)}>{value}</p>
    </div>
  );
}
