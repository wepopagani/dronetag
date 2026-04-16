'use client';

import { type ChangeEvent } from 'react';
import { classNames } from '@/lib/utils';

export type ToggleProps = {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
};

export function Toggle({ label, checked, onChange, disabled }: ToggleProps) {
  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    onChange(e.target.checked);
  }

  return (
    <label
      className={classNames(
        'inline-flex cursor-pointer items-center gap-3 select-none',
        disabled && 'cursor-not-allowed opacity-60'
      )}
    >
      <span className="relative inline-flex shrink-0">
        <input
          type="checkbox"
          role="switch"
          aria-checked={checked}
          checked={checked}
          onChange={handleChange}
          disabled={disabled}
          className="peer sr-only"
        />
        <span
          className={classNames(
            'h-6 w-11 rounded-full transition-colors duration-200 ease-out',
            'peer-focus-visible:ring-2 peer-focus-visible:ring-blue-500/40 peer-focus-visible:ring-offset-2',
            checked ? 'bg-blue-600' : 'bg-gray-200',
            disabled && 'pointer-events-none'
          )}
        />
        <span
          className={classNames(
            'pointer-events-none absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ease-out',
            checked && 'translate-x-5'
          )}
        />
      </span>
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </label>
  );
}
