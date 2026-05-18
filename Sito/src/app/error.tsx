'use client';

/**
 * Default app-router error boundary (STAGING-OPS-1).
 *
 * Catches render / data errors thrown anywhere under `/` that aren't
 * already handled by a more-specific boundary (account, admin, /u).
 * `global-error.tsx` is the last-resort handler when the root layout
 * itself crashes; everything else lands here.
 */

import { ErrorPanel } from '@/components/system/ErrorPanel';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[60dvh] bg-gray-50 py-12">
      <ErrorPanel error={error} reset={reset} context="global" />
    </div>
  );
}
