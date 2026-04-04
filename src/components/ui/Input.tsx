'use client';

import { type ChangeEvent, type InputHTMLAttributes } from 'react';
import { classNames } from '@/lib/utils';

export type InputType = 'text' | 'email' | 'password' | 'number' | 'date' | 'datetime-local';

export type InputProps = {
  label: string;
  name: string;
  type?: InputType;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  className?: string;
} & Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'value' | 'onChange' | 'name' | 'className'
>;

const inputBase =
  'w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20';

export function Input({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  required,
  error,
  disabled,
  className,
  id,
  ...rest
}: InputProps) {
  const inputId = id ?? name;

  return (
    <div className={classNames('w-full', className)}>
      <label
        htmlFor={inputId}
        className="mb-1.5 block text-sm font-medium text-gray-700"
      >
        {label}
        {required ? (
          <span className="ml-0.5 text-red-500" aria-hidden>
            *
          </span>
        ) : null}
      </label>
      <input
        id={inputId}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className={classNames(
          inputBase,
          error
            ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
            : 'border-gray-300',
          disabled && 'cursor-not-allowed bg-gray-50 opacity-70'
        )}
        {...rest}
      />
      {error ? (
        <p id={`${inputId}-error`} className="mt-1.5 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
