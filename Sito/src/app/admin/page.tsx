'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  deleteProfile, getAllProfiles, getFilteredProfiles, updateProfile,
} from '@/lib/firebase/firestore';
import type { PolicyFilter, SortField, VerificationFilter, VisibilityFilter } from '@/lib/firebase/firestore';
import type { Profile } from '@/lib/types';
import {
  formatDate, computePolicyStatus, profileCompleteness, getDisplayName,
  isProfileComplete, classNames,
} from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatsCard } from '@/components/ui/StatsCard';
import {
  PolicyStatusDetail, VerificationBadge, VisibilityBadge, CompletenessBadge, ProfileStatusBadge,
} from '@/components/ui/StatusBadge';

// ─── Filter option lists ─────────────────────────────────────────────────────

const POLICY_OPTS: { value: PolicyFilter; labelKey: string }[] = [
  { value: 'all', labelKey: 'common.all' },
  { value: 'valid', labelKey: 'policy.valid' },
  { value: 'expiring', labelKey: 'policy.expiring' },
  { value: 'expired', labelKey: 'policy.expired' },
  { value: 'missing', labelKey: 'policy.missing' },
];

const VERIFICATION_OPTS: { value: VerificationFilter; labelKey: string }[] = [
  { value: 'all', labelKey: 'common.all' },
  { value: 'verified', labelKey: 'verification.verified' },
  { value: 'pending', labelKey: 'verification.pending' },
  { value: 'unverified', labelKey: 'verification.unverified' },
  { value: 'rejected', labelKey: 'verification.rejected' },
];

const VISIBILITY_OPTS: { value: VisibilityFilter; labelKey: string }[] = [
  { value: 'all', labelKey: 'common.all' },
  { value: 'public', labelKey: 'visibility.public' },
  { value: 'private', labelKey: 'visibility.private' },
];

const SORT_OPTS: { value: SortField; labelKey: string }[] = [
  { value: 'updated', labelKey: 'dashboard.sortUpdated' },
  { value: 'name', labelKey: 'dashboard.sortName' },
  { value: 'priority', labelKey: 'dashboard.sortPriority' },
  { value: 'expiry', labelKey: 'dashboard.sortExpiry' },
];

const selCls =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20';

// ─── Component ───────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const { t } = useLanguage();

  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [policyFilter, setPolicyFilter] = useState<PolicyFilter>('all');
  const [verificationFilter, setVerificationFilter] = useState<VerificationFilter>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>('all');
  const [sortField, setSortField] = useState<SortField>('updated');

  const [deleteTarget, setDeleteTarget] = useState<Profile | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toggleId, setToggleId] = useState<string | null>(null);

  // Debounce search
  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedSearch(search), 300);
    return () => window.clearTimeout(id);
  }, [search]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const [all, filtered] = await Promise.all([
        getAllProfiles(),
        getFilteredProfiles({
          search: debouncedSearch,
          policyStatus: policyFilter,
          verificationStatus: verificationFilter,
          visibility: visibilityFilter,
          sort: sortField,
        }),
      ]);
      setAllProfiles(all);
      setProfiles(filtered);
    } catch (err: unknown) {
      setFetchError(err instanceof Error ? err.message : 'Failed to load profiles');
    } finally { setLoading(false); }
  }, [debouncedSearch, policyFilter, verificationFilter, visibilityFilter, sortField]);

  useEffect(() => { void loadData(); }, [loadData]);

  // ─── KPI stats ──────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    let published = 0;
    let verified = 0;
    let expiring = 0;
    let expired = 0;
    let incomplete = 0;
    for (const p of allProfiles) {
      if (p.visibility === 'public') published += 1;
      if (p.verificationStatus === 'verified') verified += 1;
      const ps = computePolicyStatus(p.insurance);
      if (ps === 'expiring') expiring += 1;
      if (ps === 'expired') expired += 1;
      if (!isProfileComplete(p)) incomplete += 1;
    }
    return { total: allProfiles.length, published, verified, expiring, expired, incomplete };
  }, [allProfiles]);

  // ─── Operational alerts ─────────────────────────────────────────────────

  const alerts = useMemo(() => {
    const items: { key: string; message: string; variant: 'warning' | 'danger' | 'info' }[] = [];
    let noPdf = 0;
    let expiringCount = 0;
    let completeNotPublished = 0;
    let publishedNotVerified = 0;

    for (const p of allProfiles) {
      if (!p.insurance.pdfUrl?.trim()) noPdf += 1;
      if (computePolicyStatus(p.insurance) === 'expiring') expiringCount += 1;
      if (isProfileComplete(p) && p.visibility === 'private') completeNotPublished += 1;
      if (p.visibility === 'public' && p.verificationStatus !== 'verified') publishedNotVerified += 1;
    }

    if (expiringCount > 0) items.push({ key: 'expiring', message: t('dashboard.alertExpiring', { count: expiringCount }), variant: 'warning' });
    if (publishedNotVerified > 0) items.push({ key: 'pubNotVer', message: t('dashboard.alertPublishedNotVerified', { count: publishedNotVerified }), variant: 'danger' });
    if (noPdf > 0) items.push({ key: 'noPdf', message: t('dashboard.alertNoPdf', { count: noPdf }), variant: 'warning' });
    if (completeNotPublished > 0) items.push({ key: 'complNotPub', message: t('dashboard.alertCompleteNotPublished', { count: completeNotPublished }), variant: 'info' });

    return items;
  }, [allProfiles, t]);

  // ─── Actions ────────────────────────────────────────────────────────────

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try { await deleteProfile(deleteTarget.id); setDeleteTarget(null); await loadData(); }
    finally { setDeleting(false); }
  }

  async function toggleVisibility(p: Profile) {
    setToggleId(p.id);
    try {
      const newVis = p.visibility === 'public' ? 'private' as const : 'public' as const;
      const publishedAt = newVis === 'public' && !p.publishedAt ? new Date().toISOString() : p.publishedAt;
      await updateProfile(p.id, { visibility: newVis, publishedAt });
      const patch = (x: Profile) => x.id === p.id ? { ...x, visibility: newVis, publishedAt } : x;
      setProfiles((prev) => prev.map(patch));
      setAllProfiles((prev) => prev.map(patch));
    } finally { setToggleId(null); }
  }

  const showNoResults = !loading && allProfiles.length > 0 && profiles.length === 0;
  const showEmpty = !loading && allProfiles.length === 0;
  const activeFilterCount = [policyFilter !== 'all', verificationFilter !== 'all', visibilityFilter !== 'all', search.trim() !== ''].filter(Boolean).length;

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">

      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <SectionHeader title={t('dashboard.title')} description={t('dashboard.subtitle')} />
          {!loading && allProfiles.length > 0 ? (
            <p className="-mt-3 text-sm tabular-nums text-gray-500">{profiles.length} / {allProfiles.length}</p>
          ) : null}
        </div>
        <Button href="/admin/profiles/new" variant="primary" size="md">{t('dashboard.createNew')}</Button>
      </div>

      {/* ── KPI Stats ─────────────────────────────────────────────────── */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        <StatsCard label={t('dashboard.stats.total')} value={stats.total} />
        <StatsCard label={t('dashboard.stats.published')} value={stats.published} />
        <StatsCard label={t('dashboard.stats.verified')} value={stats.verified} variant="success" />
        <StatsCard label={t('dashboard.stats.expiring')} value={stats.expiring} variant="warning" />
        <StatsCard label={t('dashboard.stats.expired')} value={stats.expired} variant="danger" />
        <StatsCard label={t('dashboard.stats.incomplete')} value={stats.incomplete} variant={stats.incomplete > 0 ? 'warning' : 'default'} />
      </div>

      {/* ── Operational Alerts ─────────────────────────────────────────── */}
      {!loading && alerts.length > 0 ? (
        <div className="mb-6 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{t('dashboard.alerts')}</p>
          {alerts.map((a) => (
            <div key={a.key} className={classNames(
              'flex items-center gap-3 rounded-lg border px-4 py-2.5 text-sm',
              a.variant === 'danger' ? 'border-red-200 bg-red-50 text-red-800' :
              a.variant === 'warning' ? 'border-amber-200 bg-amber-50 text-amber-800' :
              'border-blue-200 bg-blue-50 text-blue-800'
            )}>
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0 opacity-70">
                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">{a.message}</span>
            </div>
          ))}
        </div>
      ) : !loading && allProfiles.length > 0 ? (
        <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">
          <span className="font-medium">{t('dashboard.noAlerts')}</span>
        </div>
      ) : null}

      {/* ── Filters ───────────────────────────────────────────────────── */}
      <Card className="mb-6 border-gray-200/80 p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="sm:col-span-2 lg:col-span-1">
            <Input name="search" type="text" label={t('common.search')} value={search}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              placeholder={t('dashboard.searchPlaceholder')} />
          </div>
          <div>
            <label htmlFor="f-policy" className="mb-1.5 block text-sm font-medium text-gray-700">{t('dashboard.filterByPolicy')}</label>
            <select id="f-policy" className={selCls} value={policyFilter} onChange={(e) => setPolicyFilter(e.target.value as PolicyFilter)}>
              {POLICY_OPTS.map((o) => <option key={o.value} value={o.value}>{t(o.labelKey)}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="f-ver" className="mb-1.5 block text-sm font-medium text-gray-700">{t('dashboard.filterByVerification')}</label>
            <select id="f-ver" className={selCls} value={verificationFilter} onChange={(e) => setVerificationFilter(e.target.value as VerificationFilter)}>
              {VERIFICATION_OPTS.map((o) => <option key={o.value} value={o.value}>{t(o.labelKey)}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="f-vis" className="mb-1.5 block text-sm font-medium text-gray-700">{t('dashboard.filterByVisibility')}</label>
            <select id="f-vis" className={selCls} value={visibilityFilter} onChange={(e) => setVisibilityFilter(e.target.value as VisibilityFilter)}>
              {VISIBILITY_OPTS.map((o) => <option key={o.value} value={o.value}>{t(o.labelKey)}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="f-sort" className="mb-1.5 block text-sm font-medium text-gray-700">{t('common.sortBy')}</label>
            <select id="f-sort" className={selCls} value={sortField} onChange={(e) => setSortField(e.target.value as SortField)}>
              {SORT_OPTS.map((o) => <option key={o.value} value={o.value}>{t(o.labelKey)}</option>)}
            </select>
          </div>
        </div>
        {activeFilterCount > 0 ? (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-gray-500">{t('common.filtersActive', { count: activeFilterCount })}</span>
            <button type="button" className="text-xs font-medium text-gray-700 underline underline-offset-2 transition hover:text-gray-900" onClick={() => {
              setSearch(''); setPolicyFilter('all'); setVerificationFilter('all'); setVisibilityFilter('all');
            }}>{t('common.clearFilters')}</button>
          </div>
        ) : null}
      </Card>

      {/* ── Content ───────────────────────────────────────────────────── */}
      {fetchError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-10 text-center shadow-sm">
          <svg viewBox="0 0 20 20" fill="currentColor" className="mx-auto h-8 w-8 text-red-400">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
          <p className="mt-3 text-sm font-medium text-red-800">{t('common.error')}</p>
          <p className="mt-1 text-xs text-red-600">{fetchError}</p>
          <button type="button" onClick={() => void loadData()}
            className="mt-4 rounded-md bg-red-100 px-4 py-2 text-xs font-medium text-red-800 transition hover:bg-red-200">
            {t('common.retry')}
          </button>
        </div>
      ) : loading ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white py-20 shadow-sm" role="status">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-gray-200 border-t-gray-600" aria-hidden />
          <p className="mt-4 text-xs text-gray-400">{t('common.loading')}</p>
        </div>
      ) : showEmpty ? (
        <EmptyState title={t('dashboard.noProfiles')} description={t('dashboard.noProfilesHint')}
          action={<Button href="/admin/profiles/new" variant="primary">{t('dashboard.createNew')}</Button>} />
      ) : showNoResults ? (
        <EmptyState title={t('common.noResults')} description={t('dashboard.adjustFilters')} />
      ) : (
        <>
          {/* ── Desktop table ──────────────────────────────────────── */}
          <div className="hidden overflow-x-auto rounded-xl border border-gray-200/90 bg-white shadow-sm lg:block">
            <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-slate-50/90">
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">{t('dashboard.name')}</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">{t('dashboard.organization')}</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">{t('dashboard.operatorCode')}</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">{t('dashboard.verification')}</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">{t('dashboard.insuranceStatus')}</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">{t('dashboard.expiryDate')}</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">{t('field.visibility')}</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">{t('dashboard.updatedAt')}</th>
                  <th className="w-[180px] px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {profiles.map((p) => {
                  const complete = profileCompleteness(p);
                  return (
                    <tr key={p.id} className="transition-colors hover:bg-slate-50/60">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{getDisplayName(p)}</span>
                          {complete.percent < 100 ? <CompletenessBadge percent={complete.percent} /> : null}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-gray-600">{p.organization.companyName || <span className="text-gray-300">—</span>}</td>
                      <td className="px-4 py-3.5">
                        <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-700">{p.person.operatorCode || '—'}</code>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col gap-1">
                          <VerificationBadge status={p.verificationStatus} />
                          <ProfileStatusBadge status={p.status} />
                        </div>
                      </td>
                      <td className="px-4 py-3.5"><PolicyStatusDetail insurance={p.insurance} /></td>
                      <td className="px-4 py-3.5 text-sm text-gray-600">
                        {p.insurance.expiryDate ? formatDate(p.insurance.expiryDate) : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3.5"><VisibilityBadge visibility={p.visibility} /></td>
                      <td className="px-4 py-3.5 text-xs text-gray-500">{formatDate(p.updatedAt)}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <Link href={`/admin/profiles/${p.id}`}
                            className="rounded-md bg-gray-100 px-2.5 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-200">{t('common.edit')}</Link>
                          <button type="button"
                            className="rounded-md bg-gray-100 px-2.5 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-200 disabled:opacity-50"
                            disabled={toggleId !== null} onClick={() => void toggleVisibility(p)}
                            title={p.visibility === 'public' ? t('toggle.makePrivate') : t('toggle.makePublic')}>
                            {p.visibility === 'public' ? (
                              <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5"><path fillRule="evenodd" d="M8 1a3.5 3.5 0 00-3.5 3.5V7A1.5 1.5 0 003 8.5v5A1.5 1.5 0 004.5 15h7a1.5 1.5 0 001.5-1.5v-5A1.5 1.5 0 0011.5 7V4.5A3.5 3.5 0 008 1zm2 6V4.5a2 2 0 10-4 0V7h4z" clipRule="evenodd" /></svg>
                            ) : (
                              <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5"><path d="M8 1a5 5 0 00-5 5v.334a1 1 0 001 1h8a1 1 0 001-1V6A5 5 0 008 1zM3 8.5A1.5 1.5 0 014.5 7h7A1.5 1.5 0 0113 8.5v5a1.5 1.5 0 01-1.5 1.5h-7A1.5 1.5 0 013 13.5v-5z" /></svg>
                            )}
                          </button>
                          <button type="button"
                            className="rounded-md px-2.5 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
                            onClick={() => setDeleteTarget(p)}>
                            {t('common.delete')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── Mobile / tablet cards ──────────────────────────────── */}
          <ul className="space-y-3 lg:hidden">
            {profiles.map((p) => {
              const complete = profileCompleteness(p);
              const expires = p.insurance.expiryDate;
              return (
                <li key={p.id}>
                  <Card className="border-gray-200/90 shadow-sm">
                    <div className="flex flex-col gap-3 p-1">
                      {/* Name row */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900">{getDisplayName(p)}</p>
                          <p className="mt-0.5 text-xs text-gray-500">{p.organization.companyName || '—'}</p>
                          {p.person.operatorCode ? (
                            <code className="mt-1 inline-block rounded bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-600">{p.person.operatorCode}</code>
                          ) : null}
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <VerificationBadge status={p.verificationStatus} />
                          <VisibilityBadge visibility={p.visibility} />
                        </div>
                      </div>

                      {/* Data grid */}
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-gray-100 pt-3 text-xs">
                        <div>
                          <p className="font-medium uppercase tracking-wide text-gray-400">{t('dashboard.insuranceStatus')}</p>
                          <div className="mt-1"><PolicyStatusDetail insurance={p.insurance} /></div>
                        </div>
                        <div>
                          <p className="font-medium uppercase tracking-wide text-gray-400">{t('dashboard.expiryDate')}</p>
                          <p className="mt-1 text-sm text-gray-700">{expires ? formatDate(expires) : '—'}</p>
                        </div>
                        <div>
                          <p className="font-medium uppercase tracking-wide text-gray-400">{t('dashboard.completeness')}</p>
                          <div className="mt-1"><CompletenessBadge percent={complete.percent} /></div>
                        </div>
                        <div>
                          <p className="font-medium uppercase tracking-wide text-gray-400">{t('dashboard.updatedAt')}</p>
                          <p className="mt-1 text-sm text-gray-500">{formatDate(p.updatedAt)}</p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 border-t border-gray-100 pt-3">
                        <Button href={`/admin/profiles/${p.id}`} variant="primary" size="sm" className="flex-1">{t('common.edit')}</Button>
                        <Button type="button" variant="secondary" size="sm" loading={toggleId === p.id} disabled={toggleId !== null}
                          onClick={() => void toggleVisibility(p)}>
                          {p.visibility === 'public' ? t('toggle.makePrivate') : t('toggle.makePublic')}
                        </Button>
                        <Button type="button" variant="danger" size="sm" onClick={() => setDeleteTarget(p)}>{t('common.delete')}</Button>
                      </div>
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {/* ── Delete modal ──────────────────────────────────────────── */}
      <Modal isOpen={Boolean(deleteTarget)} onClose={() => !deleting && setDeleteTarget(null)} title={t('dashboard.deleteModalTitle')}>
        {deleteTarget ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">{t('dashboard.confirmDelete')}</p>
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm">
              <p className="font-medium text-gray-900">{getDisplayName(deleteTarget)}</p>
              <p className="mt-0.5 text-gray-500">{deleteTarget.organization.companyName || '—'} &middot; {deleteTarget.person.operatorCode || '—'}</p>
            </div>
            <p className="rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2.5 text-sm text-amber-900">{t('dashboard.deleteModalNote')}</p>
          </div>
        ) : null}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" disabled={deleting} onClick={() => setDeleteTarget(null)}>{t('common.cancel')}</Button>
          <Button type="button" variant="danger" loading={deleting} onClick={() => void confirmDelete()}>{t('common.delete')}</Button>
        </div>
      </Modal>
    </div>
  );
}
