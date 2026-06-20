'use client';

/** Label + value display for locked entity fields. */
export function ReadOnlyField({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-xs font-medium uppercase tracking-wider text-gray-500">{label}</p>
      <p className="mt-0.5 text-sm text-gray-900">{value || '-'}</p>
    </div>
  );
}
