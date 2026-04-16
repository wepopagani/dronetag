'use client';

import type { ReactNode } from 'react';

export function MetadataRow({
  label,
  value,
  icon,
  muted,
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  muted?: boolean;
}) {
  if (!value) return null;

  return (
    <div className="flex items-start justify-between gap-4 border-b border-gray-100 py-3 text-sm last:border-b-0">
      <span className="flex shrink-0 items-center gap-2 text-gray-500">
        {icon && (
          <span className="flex h-7 w-7 shrink-0 items-center justify-center text-gray-400" aria-hidden>
            {icon}
          </span>
        )}
        {label}
      </span>
      <span className={`max-w-[55%] break-words text-right font-medium ${muted ? 'text-gray-500' : 'text-gray-900'}`}>
        {value}
      </span>
    </div>
  );
}
