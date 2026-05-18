'use client';

/**
 * Admin: list every drone across the platform.
 *
 * Free-text search across slug, manufacturer, model, serial, owner email
 * (resolved via the cached account list). Each row shows the active
 * override state and offers a quick "clear override" + "open" action.
 */

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { listAllAccounts } from '@/lib/firebase/account';
import {
  clearActiveOperator,
  listAllDrones,
} from '@/lib/firebase/drones';
import type { UserAccount } from '@/lib/types/account';
import type { Drone } from '@/lib/types/entities';
import {
  accountDisplayName,
  isActiveOperatorOverride,
} from '@/lib/utils/entities';
import { getPublicProfileUrl } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { SectionHeader } from '@/components/ui/SectionHeader';

export default function AdminDronesListPage() {
  const { t } = useLanguage();
  const [drones, setDrones] = useState<Drone[]>([]);
  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const reload = async () => {
    const [dList, aList] = await Promise.all([listAllDrones(), listAllAccounts()]);
    setDrones(dList);
    setAccounts(aList);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await reload();
      } catch (err) {
        console.error('[admin drones] load failed', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const accountsByUid = useMemo(() => {
    const map = new Map<string, UserAccount>();
    for (const a of accounts) map.set(a.uid, a);
    return map;
  }, [accounts]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return drones;
    return drones.filter((d) => {
      const owner = accountsByUid.get(d.userId);
      const hay = [
        d.slug,
        d.manufacturer,
        d.model,
        d.droneSerialNumber,
        owner?.email,
        owner ? accountDisplayName(owner) : '',
      ]
        .map((s) => (s || '').toLowerCase())
        .join(' ');
      return hay.includes(q);
    });
  }, [drones, search, accountsByUid]);

  async function handleClear(id: string) {
    setBusyId(id);
    try {
      await clearActiveOperator(id);
      await reload();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
      <SectionHeader title={t('admin.drones.title')} description={t('admin.drones.subtitle')} />

      <div className="mt-2 max-w-md">
        <Input
          name="search"
          label={t('common.search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('admin.drones.searchPlaceholder')}
        />
      </div>

      {loading ? (
        <div className="mt-6 flex items-center gap-3 text-sm text-gray-500">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
          {t('common.loading')}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="mt-6 text-center" padding="lg">
          <p className="text-sm text-gray-500">{t('common.noResults')}</p>
        </Card>
      ) : (
        <Card className="mt-6 overflow-x-auto" padding="none">
          <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-slate-50/80">
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  {t('admin.drones.col.drone')}
                </th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  {t('admin.drones.col.owner')}
                </th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  {t('admin.drones.col.status')}
                </th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  {t('admin.drones.col.override')}
                </th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  {t('common.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((d) => {
                const overrideActive = isActiveOperatorOverride(d);
                const owner = accountsByUid.get(d.userId);
                const isPublic = d.status === 'active' && d.visibility === 'public';
                return (
                  <tr key={d.id} className="transition hover:bg-slate-50/60">
                    <td className="px-4 py-3.5">
                      <Link
                        href={`/admin/drones/${d.id}`}
                        className="font-medium text-gray-900 hover:underline"
                      >
                        {[d.manufacturer, d.model].filter(Boolean).join(' ').trim() || d.slug}
                      </Link>
                      <p className="mt-0.5 font-mono text-xs text-gray-500">{d.slug}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      {owner ? (
                        <Link
                          href={`/admin/users/${owner.uid}`}
                          className="text-sm text-gray-700 hover:underline"
                        >
                          {accountDisplayName(owner)}
                        </Link>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={
                          isPublic
                            ? 'rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20'
                            : 'rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600'
                        }
                      >
                        {t(`status.${d.status}`)} · {t(`visibility.${d.visibility}`)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {overrideActive ? (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
                          {t('activeOp.label.activeOverride')}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Link
                          href={`/admin/drones/${d.id}`}
                          className="rounded-md bg-gray-100 px-2.5 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-200"
                        >
                          {t('admin.drones.openInAdmin')}
                        </Link>
                        {isPublic ? (
                          <a
                            href={getPublicProfileUrl(d.slug)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-md border border-sky-200 bg-sky-50 px-2.5 py-1.5 text-xs font-medium text-sky-800 transition hover:bg-sky-100"
                          >
                            {t('common.preview')}
                          </a>
                        ) : null}
                        {overrideActive ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            loading={busyId === d.id}
                            onClick={() => handleClear(d.id)}
                          >
                            {t('admin.drones.clearOverride')}
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
