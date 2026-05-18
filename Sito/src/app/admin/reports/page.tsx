'use client';

/**
 * Admin: list every report-found submission across users.
 *
 * Read-only view (mark-as-read flips through the same updateDoc rule the
 * owner has). Search across slug, finder name, email, message text.
 */

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { listAllAccounts } from '@/lib/firebase/account';
import { listAllReports, markReportRead } from '@/lib/firebase/reports';
import type { UserAccount } from '@/lib/types/account';
import type { Report } from '@/lib/types/entities';
import { accountDisplayName } from '@/lib/utils/entities';
import { formatDateTime } from '@/lib/utils';
import { safeMailto } from '@/lib/utils/safeMailto';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { SectionHeader } from '@/components/ui/SectionHeader';

export default function AdminReportsPage() {
  const { t } = useLanguage();
  const [reports, setReports] = useState<Report[]>([]);
  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [r, a] = await Promise.all([listAllReports(), listAllAccounts()]);
        if (cancelled) return;
        setReports(r);
        setAccounts(a);
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
    if (!q) return reports;
    return reports.filter((r) => {
      const owner = accountsByUid.get(r.ownerUserId);
      const hay = [
        r.droneSlug,
        r.finderName,
        r.contactEmail,
        r.message,
        r.locationText,
        owner ? accountDisplayName(owner) : '',
        owner?.email,
      ]
        .map((s) => (s || '').toLowerCase())
        .join(' ');
      return hay.includes(q);
    });
  }, [reports, search, accountsByUid]);

  async function handleMarkRead(r: Report) {
    if (r.read) return;
    setBusyId(r.id);
    try {
      await markReportRead(r.id);
      setReports((prev) => prev.map((x) => (x.id === r.id ? { ...x, read: true } : x)));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
      <SectionHeader title={t('admin.reports.title')} description={t('admin.reports.subtitle')} />

      <div className="mt-2 max-w-md">
        <Input
          name="search"
          label={t('common.search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('admin.reports.searchPlaceholder')}
        />
      </div>

      {loading ? (
        <div className="mt-6 flex items-center gap-3 text-sm text-gray-500">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
          {t('common.loading')}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="mt-6 text-center" padding="lg">
          <p className="text-sm text-gray-500">{t('inbox.empty')}</p>
        </Card>
      ) : (
        <div className="mt-6 space-y-3">
          {filtered.map((r) => {
            const owner = accountsByUid.get(r.ownerUserId);
            const mapHref = r.location
              ? `https://www.google.com/maps/search/?api=1&query=${r.location.lat},${r.location.lng}`
              : null;
            return (
              <Card key={r.id} padding="md">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-gray-900">
                        {r.finderName.trim() || t('inbox.fromAnonymous')}
                      </h3>
                      <span
                        className={
                          r.read
                            ? 'rounded-full bg-gray-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gray-600 ring-1 ring-inset ring-gray-500/20'
                            : 'rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-blue-700 ring-1 ring-inset ring-blue-600/20'
                        }
                      >
                        {r.read ? t('inbox.read') : t('inbox.unread')}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      <Link
                        href={`/u/${r.droneSlug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline-offset-2 hover:underline"
                      >
                        {r.droneSlug}
                      </Link>
                      {owner ? (
                        <>
                          {' '}· {t('admin.drones.col.owner')}:{' '}
                          <Link
                            href={`/admin/users/${owner.uid}`}
                            className="text-blue-600 underline-offset-2 hover:underline"
                          >
                            {accountDisplayName(owner)}
                          </Link>
                        </>
                      ) : null}
                      <span className="mx-1.5 text-gray-300">·</span>
                      {t('inbox.receivedAt', { date: formatDateTime(r.createdAt) })}
                    </p>

                    {(() => {
                      const mailto = safeMailto(r.contactEmail);
                      if (!mailto) return null;
                      return (
                        <p className="text-sm text-gray-700">
                          <span className="text-xs uppercase tracking-wider text-gray-400">
                            {t('inbox.contact')}:
                          </span>{' '}
                          <a
                            href={mailto}
                            className="text-blue-600 underline-offset-2 hover:underline"
                          >
                            {r.contactEmail.trim()}
                          </a>
                        </p>
                      );
                    })()}

                    {r.message.trim() ? (
                      <div className="rounded-lg border border-gray-200 bg-gray-50/60 px-3 py-2.5 text-sm text-gray-800">
                        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                          {t('inbox.message')}
                        </p>
                        <p className="whitespace-pre-wrap leading-relaxed">{r.message}</p>
                      </div>
                    ) : null}

                    {r.location || r.locationText.trim() ? (
                      <p className="text-xs text-gray-600">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                          {t('inbox.location')}:
                        </span>{' '}
                        {r.locationText.trim() || ''}
                        {r.location ? (
                          <>
                            {' '}
                            <span className="font-mono text-[11px] text-gray-500">
                              {t('inbox.locationCoords', {
                                lat: r.location.lat.toFixed(5),
                                lng: r.location.lng.toFixed(5),
                                accuracy: Math.round(r.location.accuracy),
                              })}
                            </span>
                            {mapHref ? (
                              <>
                                {' '}
                                <a
                                  href={mapHref}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 underline-offset-2 hover:underline"
                                >
                                  {t('inbox.viewLocation')}
                                </a>
                              </>
                            ) : null}
                          </>
                        ) : null}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 flex-col items-stretch gap-2">
                    {!r.read ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        loading={busyId === r.id}
                        onClick={() => handleMarkRead(r)}
                      >
                        {t('inbox.markRead')}
                      </Button>
                    ) : null}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
