'use client';

/**
 * Admin overview hub.
 *
 * Renders KPI tiles across the multi-entity model (users, drones, reports,
 * plans, active overrides, legacy profiles) and a sub-nav into each admin
 * section. The legacy profile dashboard lives at /admin/profiles and the
 * legacy edit/new flows under /admin/profiles/[id] / /admin/profiles/new
 * are unchanged so existing operators keep working until migration ends.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { listAllAccounts } from '@/lib/firebase/account';
import { listAllDrones } from '@/lib/firebase/drones';
import { listAllReports } from '@/lib/firebase/reports';
import { listPlans } from '@/lib/firebase/plans';
import { getAllProfiles } from '@/lib/firebase/firestore';
import { isActiveOperatorOverride } from '@/lib/utils/entities';
import { Card } from '@/components/ui/Card';
import { StatsCard } from '@/components/ui/StatsCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { AdminSubNav } from '@/components/layout/AdminSubNav';

interface HealthPayload {
  status: 'ok' | 'degraded';
  build: { version: string; commit: string; environment: string; bootedAt: string };
  firebase: { adminConfigured: boolean };
  security: { appCheckEnforce: boolean; cspMode: 'enforce' | 'report-only' | 'disabled' };
}

export default function AdminOverviewPage() {
  const { t } = useLanguage();
  const [counts, setCounts] = useState({
    users: 0,
    drones: 0,
    publicDrones: 0,
    reports: 0,
    unreadReports: 0,
    activePlans: 0,
    activeOverrides: 0,
    legacyProfiles: 0,
  });
  const [health, setHealth] = useState<HealthPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [users, drones, reports, plans, legacyProfiles, healthRes] = await Promise.all([
          listAllAccounts(),
          listAllDrones(),
          listAllReports(),
          listPlans(),
          getAllProfiles(),
          fetch('/api/health', { credentials: 'same-origin' })
            .then((r) => r.json() as Promise<HealthPayload>)
            .catch(() => null),
        ]);
        if (cancelled) return;
        setCounts({
          users: users.length,
          drones: drones.length,
          publicDrones: drones.filter((d) => d.status === 'active' && d.visibility === 'public').length,
          reports: reports.length,
          unreadReports: reports.filter((r) => !r.read).length,
          activePlans: plans.filter((p) => p.active).length,
          activeOverrides: drones.filter((d) => isActiveOperatorOverride(d)).length,
          legacyProfiles: legacyProfiles.length,
        });
        setHealth(healthRes);
      } catch (err) {
        console.error('[admin overview] load failed', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <AdminSubNav />
      <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
        <SectionHeader title={t('admin.title')} description={t('admin.subtitle')} />

        {loading ? (
          <div className="mt-6 flex items-center gap-3 text-sm text-gray-500">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
            {t('common.loading')}
          </div>
        ) : (
          <>
            <div className="mt-2 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              <StatsCard label={t('admin.stats.users')} value={counts.users} />
              <StatsCard label={t('admin.stats.drones')} value={counts.drones} />
              <StatsCard label={t('admin.stats.publicDrones')} value={counts.publicDrones} variant="success" />
              <StatsCard label={t('admin.stats.activeOverrides')} value={counts.activeOverrides} variant={counts.activeOverrides > 0 ? 'warning' : 'default'} />
              <StatsCard label={t('admin.stats.reports')} value={counts.reports} />
              <StatsCard label={t('admin.stats.unreadReports')} value={counts.unreadReports} variant={counts.unreadReports > 0 ? 'warning' : 'default'} />
              <StatsCard label={t('admin.stats.plans')} value={counts.activePlans} />
              <StatsCard label={t('admin.stats.legacyProfiles')} value={counts.legacyProfiles} />
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <NavTile href="/admin/users" title={t('admin.nav.users')} description={t('admin.users.subtitle')} />
              <NavTile href="/admin/drones" title={t('admin.nav.drones')} description={t('admin.drones.subtitle')} />
              <NavTile href="/admin/reports" title={t('admin.nav.reports')} description={t('admin.reports.subtitle')} />
              <NavTile href="/admin/verify" title={t('admin.nav.verify')} description={t('admin.verify.subtitle')} />
              <NavTile href="/admin/plans" title={t('admin.nav.plans')} description={t('admin.plans.subtitle')} />
              <NavTile href="/admin/profiles" title={t('admin.nav.legacy')} description="Legacy single-profile collection (pre-M1)." />
            </div>

            <p className="mt-10 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-xs leading-relaxed text-gray-600">
              {t('legal.platformDisclaimer')}
            </p>

            {/* Operational footer (PR-SEC-4 V-039) */}
            <OpsFooter health={health} />
          </>
        )}
      </div>
    </div>
  );
}

function OpsFooter({ health }: { health: HealthPayload | null }) {
  if (!health) {
    return (
      <p className="mt-6 text-xs text-gray-400">
        Status check unavailable.
      </p>
    );
  }
  const statusColour =
    health.status === 'ok'
      ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
      : 'bg-amber-50 text-amber-800 ring-amber-600/20';
  const cspColour =
    health.security.cspMode === 'enforce'
      ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
      : health.security.cspMode === 'disabled'
        ? 'bg-gray-100 text-gray-600 ring-gray-500/20'
        : 'bg-amber-50 text-amber-800 ring-amber-600/20';
  const appCheckColour = health.security.appCheckEnforce
    ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
    : 'bg-amber-50 text-amber-800 ring-amber-600/20';
  const fbColour = health.firebase.adminConfigured
    ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
    : 'bg-red-50 text-red-700 ring-red-600/20';
  return (
    <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-gray-200 pt-4 text-[11px] text-gray-500">
      <span className={`rounded-full px-2.5 py-0.5 font-medium ring-1 ring-inset ${statusColour}`}>
        Status: {health.status}
      </span>
      <span className={`rounded-full px-2.5 py-0.5 font-medium ring-1 ring-inset ${fbColour}`}>
        Firebase Admin: {health.firebase.adminConfigured ? 'configured' : 'missing'}
      </span>
      <span className={`rounded-full px-2.5 py-0.5 font-medium ring-1 ring-inset ${appCheckColour}`}>
        App Check: {health.security.appCheckEnforce ? 'enforce' : 'monitor'}
      </span>
      <span className={`rounded-full px-2.5 py-0.5 font-medium ring-1 ring-inset ${cspColour}`}>
        CSP: {health.security.cspMode}
      </span>
      <span className="ml-auto font-mono">
        v{health.build.version}
        {health.build.commit ? ` · ${health.build.commit}` : ''}
        {' · '}
        {health.build.environment}
      </span>
    </div>
  );
}

function NavTile({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link href={href} className="block rounded-xl transition hover:scale-[1.01]">
      <Card padding="md" className="h-full">
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        <p className="mt-1 text-xs leading-relaxed text-gray-500">{description}</p>
        <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-amber-700">
          {title}
          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 12h14" />
          </svg>
        </span>
      </Card>
    </Link>
  );
}
