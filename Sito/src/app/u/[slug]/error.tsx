'use client';

import { ErrorPanel } from '@/components/system/ErrorPanel';

export default function PublicProfileError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[60dvh] bg-gray-100/70 py-12">
      <ErrorPanel error={error} reset={reset} context="public" />
    </div>
  );
}
