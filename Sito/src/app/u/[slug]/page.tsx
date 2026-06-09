'use client';

/**
 * Public profile page — `/u/[slug]` (PR-SEC-1).
 *
 * Hardened resolution model:
 *
 *   • The page reads ONLY from the `dronesPublic` collection. Raw
 *     `drones/*` documents are private to the owner and admins under
 *     the new firestore.rules; this page never fetches them.
 *
 *   • The legacy `profiles` fallback was removed because anonymous
 *     reads on `profiles` are now denied by the rules. Old QR codes
 *     resolve via `dronesPublic` once the migration script (M1) +
 *     backfill (PR-SEC-1) populate the public snapshot.
 *
 * Privacy properties:
 *
 *   • Network response carries ONLY `DronePublicSnapshot` fields. No
 *     phone, address, DOB, VAT, full policy number, controller serial,
 *     internal IDs, audit metadata, defaultOperatorId, etc.
 *
 *   • PR-SEC-4 V-017 closure: the snapshot no longer carries
 *     `ownerUserId`. The `submitReport` Cloud Function (PR-SEC-2)
 *     looks the drone up server-side and derives the owner from
 *     `drones/{droneId}.userId`, so the public response leaks zero
 *     internal user IDs.
 */

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { PublicDroneCard } from '@/components/profile/PublicDroneCard';
import { getDronePublicBySlug } from '@/lib/firebase/dronesPublic';
import type { DronePublicSnapshot } from '@/lib/types/entities';

// ─── State machine ──────────────────────────────────────────────────────────

type Resolved = {
  slug: string;
  value:
    | { kind: 'notFound' }
    | { kind: 'error' }
    | { kind: 'snapshot'; snapshot: DronePublicSnapshot };
};

// ─── UI helpers ─────────────────────────────────────────────────────────────

function PageSpinner({ label }: { label: string }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 px-4 py-8 sm:min-h-[50vh]" role="status">
      <div className="relative h-10 w-10">
        <div className="absolute inset-0 rounded-full border-2 border-gray-200" />
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-slate-600" />
      </div>
      <p className="text-sm text-gray-400">{label}</p>
    </div>
  );
}

function UnavailableState({ title, description }: { title: string; description: string }) {
  return (
    <div className="mx-auto max-w-md px-4 py-6 sm:px-0">
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col items-center px-8 pb-10 pt-12 text-center">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <svg
              className="h-8 w-8 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286z"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-500">{description}</p>
        </div>
        <div className="border-t border-gray-100 bg-gray-50/80 px-8 py-4 text-center">
          <p className="text-[10px] font-medium tracking-wide text-gray-300">
            Powered by DroneTag
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function PublicProfilePage() {
  const params = useParams();
  const rawSlug = params?.slug;
  const slug = typeof rawSlug === 'string'
    ? rawSlug
    : Array.isArray(rawSlug)
    ? rawSlug[0]
    : '';

  const { t, language } = useLanguage();
  const { loading: authLoading } = useAuth();

  const [result, setResult] = useState<Resolved | null>(null);

  useEffect(() => {
    if (!slug || authLoading) return;
    let cancelled = false;

    (async () => {
      try {
        const snapshot = await getDronePublicBySlug(slug);
        if (cancelled) return;
        if (!snapshot) {
          setResult({ slug, value: { kind: 'notFound' } });
          return;
        }
        setResult({ slug, value: { kind: 'snapshot', snapshot } });
      } catch (err) {
        const code = typeof err === 'object' && err !== null && 'code' in err
          ? String((err as { code: unknown }).code) : '';
        const message = typeof err === 'object' && err !== null && 'message' in err
          ? String((err as { message: unknown }).message) : String(err);
        console.error('[publicDrone] load failed', { slug, code, message, err });
        if (!cancelled) setResult({ slug, value: { kind: 'error' } });
      }
    })();

    return () => { cancelled = true; };
  }, [slug, authLoading]);

  const fresh = result !== null && result.slug === slug;
  const isLoading = !slug || authLoading || !fresh;
  const value = fresh ? result.value : null;

  return (
    <>
      {/* Content */}
      <div className="mx-auto max-w-2xl px-0 py-0 sm:px-4 sm:py-6 lg:px-6 lg:py-8">
        {isLoading || !value ? (
          <PageSpinner label={t('common.loading')} />
        ) : value.kind === 'error' ? (
          <UnavailableState
            title={t('publicDrone.errorTitle')}
            description={t('publicDrone.errorBody')}
          />
        ) : value.kind === 'notFound' ? (
          <UnavailableState
            title={t('profile.notFound')}
            description={t('profile.notFoundDesc')}
          />
        ) : (
          <PublicDroneCard
            snapshot={value.snapshot}
            language={language}
          />
        )}
      </div>
    </>
  );
}
