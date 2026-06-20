'use client';

import Link from 'next/link';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getAccount } from '@/lib/firebase/account';
import { listCertificates } from '@/lib/firebase/certificates';
import { listDocuments } from '@/lib/firebase/documents';
import { listDronesByUser } from '@/lib/firebase/drones';
import { listInsurances } from '@/lib/firebase/insurances';
import { listOperators } from '@/lib/firebase/operators';
import { computeCertificateStatus, computePolicyStatus, formatDate } from '@/lib/utils';
import { operatorDisplayName } from '@/lib/utils/entities';
import { getPublicProfileUrl } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { PolicyStatusBadge } from '@/components/ui/StatusBadge';
import { ResponsivePageHeader } from '@/components/ui/ResponsivePageHeader';
import type { Certificate, Drone, Insurance, Operator } from '@/lib/types/entities';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
}

function QuickAction({ href, label, desc, icon }: { href: string; label: string; desc: string; icon: ReactNode }) {
  return (
    <Link href={href} className="app-card tap-44 flex min-w-0 flex-col gap-1.5 p-3 transition hover:border-[var(--color-action)]/30 hover:shadow-md sm:gap-2 sm:p-4">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-action-light)] text-[var(--color-action)] sm:h-10 sm:w-10">{icon}</span>
      <span className="text-xs font-semibold text-[var(--color-text)] sm:text-sm">{label}</span>
      <span className="text-[11px] leading-snug text-[var(--color-text-secondary)] sm:text-xs">{desc}</span>
    </Link>
  );
}

export function AccountDashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [drones, setDrones] = useState<Drone[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [insurances, setInsurances] = useState<Insurance[]>([]);
  const [documents, setDocuments] = useState<{ id: string }[]>([]);
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const [ops, drs, certs, ins, docs, acct] = await Promise.all([
          listOperators(user.uid),
          listDronesByUser(user.uid),
          listCertificates(user.uid),
          listInsurances(user.uid),
          listDocuments(user.uid),
          getAccount(user.uid).catch(() => null),
        ]);
        if (cancelled) return;
        setOperators(ops);
        setDrones(drs);
        setCertificates(certs);
        setInsurances(ins);
        setDocuments(docs);
        const name = acct
          ? [acct.firstName, acct.lastName].filter(Boolean).join(' ').trim()
          : user.displayName ?? user.email ?? '';
        setDisplayName(name);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const stats = useMemo(() => {
    const validCerts = certificates.filter((c) => computeCertificateStatus(c) === 'valid').length;
    const expiringCerts = certificates.filter((c) => computeCertificateStatus(c) === 'expiring').length;
    const validIns = insurances.filter((i) => computePolicyStatus(i) === 'valid').length;
    const expiringIns = insurances.filter((i) => computePolicyStatus(i) === 'expiring').length;
    const expiredIns = insurances.filter((i) => computePolicyStatus(i) === 'expired').length;
    const publicDrone = drones.find((d) => d.status === 'active' && d.visibility === 'public');
    const completeness = Math.round(
      ([operators.length > 0, drones.length > 0, certificates.length > 0, insurances.length > 0, documents.length > 0].filter(Boolean).length / 5) * 100,
    );
    return { validCerts, expiringCerts, validIns, expiringIns, expiredIns, publicDrone, completeness };
  }, [operators, drones, certificates, insurances, documents]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-24 w-full" />
        <div className="skeleton h-40 w-full" />
        <div className="grid grid-cols-2 gap-3">
          <div className="skeleton h-28" />
          <div className="skeleton h-28" />
          <div className="skeleton h-28" />
          <div className="skeleton h-28" />
        </div>
      </div>
    );
  }

  const firstName = displayName.split(/\s+/)[0] || t('account.nav.home');

  return (
    <div className="space-y-4 sm:space-y-6">
      <ResponsivePageHeader
        title={t('account.dashboard.greeting', { name: firstName })}
        subtitle={t('account.dashboard.subtitle')}
        actions={
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-navy)] text-xs font-bold text-white sm:h-11 sm:w-11 sm:text-sm" aria-hidden>
            {initials(displayName)}
          </div>
        }
      />

      <Card padding="md">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-[var(--color-text)]">{t('account.dashboard.credentialsStatus')}</h2>
            <p className="mt-1 text-xs text-[var(--color-text-secondary)]">{t('account.dashboard.completeness', { pct: stats.completeness })}</p>
          </div>
          <div className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-gray-100 sm:w-48">
            <div className="h-full rounded-full bg-[var(--color-action)] transition-all" style={{ width: `${stats.completeness}%` }} role="progressbar" aria-valuenow={stats.completeness} aria-valuemin={0} aria-valuemax={100} />
          </div>
        </div>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          <li className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2.5 text-xs">
            <span className="text-[var(--color-text-secondary)]">{t('account.tab.certificates')}</span>
            <span className="font-medium text-[var(--color-text)]">
              {stats.validCerts} {t('policy.valid')}
              {stats.expiringCerts > 0 ? ` / ${stats.expiringCerts} ${t('policy.expiring')}` : ''}
            </span>
          </li>
          <li className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2.5 text-xs">
            <span className="text-[var(--color-text-secondary)]">{t('account.tab.insurances')}</span>
            <span className="font-medium text-[var(--color-text)]">
              {stats.expiredIns > 0 ? t('policy.expired') : stats.expiringIns > 0 ? t('policy.expiring') : stats.validIns > 0 ? t('policy.valid') : t('policy.missing')}
            </span>
          </li>
        </ul>
      </Card>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-[var(--color-text)] sm:mb-3">{t('account.dashboard.quickActions')}</h2>
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <QuickAction href={stats.publicDrone ? `/u/${stats.publicDrone.slug}` : '/account/drones'} label={t('account.dashboard.actionPublic')} desc={t('account.dashboard.actionPublicDesc')} icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>} />
          <QuickAction href="/account/documents" label={t('account.dashboard.actionDocument')} desc={t('account.dashboard.actionDocumentDesc')} icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>} />
          <QuickAction href="/account/orders" label={t('account.dashboard.actionBadge')} desc={t('account.dashboard.actionBadgeDesc')} icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" /></svg>} />
          <QuickAction href="/account/drones" label={t('account.dashboard.actionDrone')} desc={t('account.dashboard.actionDroneDesc')} icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>} />
        </div>
      </section>

      <DashboardSection title={t('account.tab.drones')} href="/account/drones" seeAll={t('account.dashboard.seeAll')} empty={drones.length === 0} emptyLabel={t('drone.list.empty')}>
        {drones.slice(0, 2).map((d) => (
          <Link key={d.id} href={`/account/drones/${d.id}`} className="app-card block p-4 transition hover:border-[var(--color-action)]/30">
            <p className="font-semibold text-[var(--color-text)]">{[d.manufacturer, d.model].filter(Boolean).join(' ') || d.slug}</p>
            <p className="mt-1 text-xs text-[var(--color-text-secondary)]">{d.classMarking}</p>
          </Link>
        ))}
      </DashboardSection>

      <DashboardSection title={t('account.tab.certificates')} href="/account/certificates" seeAll={t('account.dashboard.seeAll')} empty={certificates.length === 0} emptyLabel={t('cert.list.empty')}>
        {certificates.slice(0, 2).map((c) => (
          <div key={c.id} className="app-card flex items-center justify-between gap-2 p-4">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[var(--color-text)]">{c.registrationNumber || c.kind}</p>
              {c.expiresAt ? <p className="text-xs text-[var(--color-text-secondary)]">{formatDate(c.expiresAt)}</p> : null}
            </div>
            <PolicyStatusBadge status={computeCertificateStatus(c)} />
          </div>
        ))}
      </DashboardSection>

      <DashboardSection title={t('account.tab.insurances')} href="/account/insurances" seeAll={t('account.dashboard.seeAll')} empty={insurances.length === 0} emptyLabel={t('insurance.list.empty')}>
        {insurances.slice(0, 2).map((i) => (
          <div key={i.id} className="app-card flex items-center justify-between gap-2 p-4">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[var(--color-text)]">{i.provider}</p>
              <p className="font-mono text-xs text-[var(--color-text-secondary)]">{i.policyNumber}</p>
            </div>
            <PolicyStatusBadge status={computePolicyStatus(i)} />
          </div>
        ))}
      </DashboardSection>

      <DashboardSection title={t('account.tab.operators')} href="/account/operators" seeAll={t('account.dashboard.seeAll')} empty={operators.length === 0} emptyLabel={t('operator.list.empty')}>
        {operators.slice(0, 2).map((o) => (
          <div key={o.id} className="app-card p-4">
            <p className="text-sm font-semibold text-[var(--color-text)]">{operatorDisplayName(o)}</p>
          </div>
        ))}
      </DashboardSection>

      {stats.publicDrone ? (
        <p className="truncate text-center text-[10px] text-[var(--color-text-secondary)] sm:text-[11px]">{getPublicProfileUrl(stats.publicDrone.slug)}</p>
      ) : null}
    </div>
  );
}

function DashboardSection({ title, href, seeAll, empty, emptyLabel, children }: { title: string; href: string; seeAll: string; empty: boolean; emptyLabel: string; children: ReactNode }) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-[var(--color-text)]">{title}</h2>
        <Link href={href} className="text-xs font-medium text-[var(--color-action)] hover:underline">{seeAll}</Link>
      </div>
      {empty ? (
        <p className="rounded-xl border border-dashed border-[var(--color-border)] bg-white px-3 py-4 text-center text-xs text-[var(--color-text-secondary)] sm:px-4 sm:py-6">{emptyLabel}</p>
      ) : (
        <div className="space-y-2">{children}</div>
      )}
    </section>
  );
}
