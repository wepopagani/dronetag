'use client';

import Link from 'next/link';
import { type ButtonHTMLAttributes, type ReactNode } from 'react';
import { classNames } from '@/lib/utils';

const variantClasses = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white disabled:hover:bg-blue-600',
  secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-800 disabled:hover:bg-gray-100',
  danger: 'bg-red-600 hover:bg-red-700 text-white disabled:hover:bg-red-600',
  ghost:
    'bg-transparent hover:bg-gray-100 text-gray-600 disabled:hover:bg-transparent',
} as const;

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
} as const;

export type ButtonVariant = keyof typeof variantClasses;
export type ButtonSize = keyof typeof sizeClasses;

export type ButtonProps = {
  children: ReactNode;
  /** When set, renders a Next.js `Link` with the same styles as a button. */
  href?: string;
  onClick?: ButtonHTMLAttributes<HTMLButtonElement>['onClick'];
  type?: 'button' | 'submit';
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  fullWidth?: boolean;
};

function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={classNames('h-4 w-4 shrink-0 animate-spin', className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export function Button({
  children,
  href,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className,
  fullWidth,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const sharedClassName = classNames(
    'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition',
    variantClasses[variant],
    sizeClasses[size],
    fullWidth && 'w-full',
    isDisabled && 'cursor-not-allowed opacity-70',
    className
  );

  if (href) {
    return (
      <Link
        href={href}
        className={sharedClassName}
        aria-disabled={isDisabled || undefined}
      >
        {loading && <Spinner />}
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={sharedClassName}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}
