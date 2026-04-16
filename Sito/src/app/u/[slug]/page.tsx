'use client';

/**
 * Public profile page — /u/[slug]
 *
 * This is the data-minimisation boundary. The full Profile fetched from
 * Firestore is projected into a PublicProfile via toPublicProfile() before
 * reaching any rendering component. The PublicProfileCard never has access
 * to admin notes, emergency contacts, birth dates, full policy numbers,
 * internal IDs, or any other admin-only field.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { PublicProfileCard } from '@/components/profile/PublicProfileCard';
import { getProfileBySlug } from '@/lib/firebase/firestore';
import type { Profile, PublicProfile } from '@/lib/types';
import { LANGUAGES, type Language } from '@/lib/types';
import { toPublicProfile } from '@/lib/utils';

// ─── Loading spinner ────────────────────────────────────────────────────────

function PageSpinner({ label }: { label: string }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4" role="status">
      <div className="relative h-10 w-10">
        <div className="absolute inset-0 rounded-full border-2 border-gray-200" />
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-slate-600" />
      </div>
      <p className="text-sm text-gray-400">{label}</p>
    </div>
  );
}

// ─── Unavailable state ──────────────────────────────────────────────────────

function UnavailableState({ title, description }: { title: string; description: string }) {
  return (
    <div className="mx-auto max-w-md">
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col items-center px-8 pb-10 pt-12 text-center">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-500">{description}</p>
        </div>
        <div className="border-t border-gray-100 bg-gray-50/80 px-8 py-4 text-center">
          <p className="text-[10px] font-medium tracking-wide text-gray-300">Powered by DroneTag</p>
        </div>
      </div>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function PublicProfilePage() {
  const params = useParams();
  const rawSlug = params?.slug;
  const slug = typeof rawSlug === 'string' ? rawSlug : Array.isArray(rawSlug) ? rawSlug[0] : '';

  const { t, language, setLanguage } = useLanguage();

  type FetchResult = { slug: string; data: Profile | null | 'error' };
  const [result, setResult] = useState<FetchResult | null>(null);
  const fetchedSlugRef = useRef('');

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    fetchedSlugRef.current = slug;
    void getProfileBySlug(slug)
      .then((p) => { if (!cancelled) setResult({ slug, data: p }); })
      .catch(() => { if (!cancelled) setResult({ slug, data: 'error' }); });
    return () => { cancelled = true; };
  }, [slug]);

  const isFresh = result !== null && result.slug === slug;
  const isLoading = !slug || !isFresh;
  const isError = isFresh && result.data === 'error';
  const isNotFound = isFresh && result.data === null;

  const profile: Profile | null =
    isFresh && result.data && typeof result.data === 'object' ? result.data : null;

  const isUnavailable = profile !== null &&
    (profile.visibility !== 'public' || profile.status !== 'active');
  const isReady = profile !== null &&
    profile.visibility === 'public' && profile.status === 'active';

  const publicProfile: PublicProfile | null = useMemo(() => {
    if (!isReady || !profile) return null;
    return toPublicProfile(profile, {
      exposePdfUrl: true,
      maskPolicyNumber: true,
    });
  }, [isReady, profile]);

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-gray-100/70">
      {/* Top bar */}
      <div className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-2.5 sm:px-6">
          <span className="text-xs font-semibold tracking-wide text-gray-400">DRONETAG</span>
          <label className="sr-only" htmlFor="public-lang">{t('common.language')}</label>
          <select
            id="public-lang"
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            className="rounded-md border border-gray-200 bg-white px-2.5 py-1 text-xs text-gray-600 outline-none transition focus:border-gray-400 focus:ring-1 focus:ring-gray-400/20"
          >
            {LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
        {isLoading ? (
          <PageSpinner label={t('common.loading')} />
        ) : isError ? (
          <UnavailableState title={t('common.error')} description={t('common.tryAgain')} />
        ) : isNotFound ? (
          <UnavailableState title={t('profile.notFound')} description={t('profile.notFoundDesc')} />
        ) : isUnavailable ? (
          <UnavailableState title={t('profile.notPublished')} description={t('profile.notPublishedDesc')} />
        ) : publicProfile ? (
          <PublicProfileCard profile={publicProfile} />
        ) : null}
      </div>
    </div>
  );
}
