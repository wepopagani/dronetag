'use client';

import { type ChangeEvent, type SelectHTMLAttributes } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { classNames } from '@/lib/utils';

export type SelectOption = { value: string; label: string };

export type SelectProps = {
  label: string;
  name: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
  options: SelectOption[];
  required?: boolean;
  error?: string;
  disabled?: boolean;
  className?: string;
} & Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  'name' | 'value' | 'onChange' | 'className' | 'children'
>;

const fieldBase =
  'w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20';

export function Select({
  label,
  name,
  value,
  onChange,
  options,
  required,
  error,
  disabled,
  className,
  id,
  ...rest
}: SelectProps) {
  const { t } = useLanguage();
  const selectId = id ?? name;

  return (
    <div className={classNames('w-full', className)}>
      <label
        htmlFor={selectId}
        className="mb-1.5 block text-sm font-medium text-gray-700"
      >
        {label}
        {required ? (
          <span className="ml-0.5 text-red-500" aria-hidden>
            *
          </span>
        ) : null}
      </label>
      <select
        id={selectId}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${selectId}-error` : undefined}
        className={classNames(
          fieldBase,
          error
            ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
            : 'border-gray-300',
          disabled && 'cursor-not-allowed bg-gray-50 opacity-70'
        )}
        {...rest}
      >
        <option value="" disabled>
          {t('common.select')}
        </option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error ? (
        <p id={`${selectId}-error`} className="mt-1.5 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
