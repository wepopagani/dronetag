'use client';

import { type ChangeEvent, type TextareaHTMLAttributes } from 'react';
import { classNames } from '@/lib/utils';

export type TextareaProps = {
  label: string;
  name: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  rows?: number;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  className?: string;
} & Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  'name' | 'value' | 'onChange' | 'rows' | 'className'
>;

const fieldBase =
  'w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-y min-h-[2.75rem]';

export function Textarea({
  label,
  name,
  value,
  onChange,
  placeholder,
  rows = 3,
  required,
  error,
  disabled,
  className,
  id,
  ...rest
}: TextareaProps) {
  const textareaId = id ?? name;

  return (
    <div className={classNames('w-full', className)}>
      <label
        htmlFor={textareaId}
        className="mb-1.5 block text-sm font-medium text-gray-700"
      >
        {label}
        {required ? (
          <span className="ml-0.5 text-red-500" aria-hidden>
            *
          </span>
        ) : null}
      </label>
      <textarea
        id={textareaId}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        required={required}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${textareaId}-error` : undefined}
        className={classNames(
          fieldBase,
          error
            ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
            : 'border-gray-300',
          disabled && 'cursor-not-allowed bg-gray-50 opacity-70'
        )}
        {...rest}
      />
      {error ? (
        <p
          id={`${textareaId}-error`}
          className="mt-1.5 text-sm text-red-600"
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
