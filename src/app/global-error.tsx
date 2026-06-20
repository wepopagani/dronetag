'use client';

/**
 * Root-layout error boundary (STAGING-OPS-1).
 *
 * Required by Next.js to render a fallback when the root `layout.tsx`
 * itself throws — at that point the providers haven't mounted, so we
 * deliberately render the bare minimum: HTML + body + a static panel.
 * No i18n provider, no theming, no PWA — just enough to ask the user
 * to retry without confusing them with a blank screen.
 */

import { Button } from '@/components/ui/Button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 antialiased">
        <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col items-center justify-center px-6 text-center">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
            <svg
              className="h-7 w-7"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.6}
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
              />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-gray-900">
            Something went wrong loading DroneTag.
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            The page failed to render. Please try again, or go back to the home page.
          </p>
          {error.digest ? (
            <p className="mt-3 font-mono text-[11px] text-gray-400">
              digest: {error.digest}
            </p>
          ) : null}
          <div className="mt-6 flex flex-col items-stretch gap-2 sm:flex-row sm:justify-center">
            <Button onClick={reset} className="tap-44">Try again</Button>
            <Button href="/" variant="secondary" className="tap-44">
              Go to home page
            </Button>
          </div>
        </div>
      </body>
    </html>
  );
}
