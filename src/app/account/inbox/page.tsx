'use client';

/**
 * Account inbox — incoming "Report found drone" submissions.
 *
 * Reads from the M1 `reports` collection where `ownerUserId == uid` and
 * lists each report with finder details, optional message, optional
 * GPS coords + free-text location, and a quick "Open drone" link.
 *
 * Mark-as-read is the only allowed mutation per the firestore.rules
 * (M1 + M3 update). Notification fan-out fields (`emailNotified`,
 * `pushNotified`) are read here for UX but never written from this
 * page — that's reserved for an admin / Cloud Function in M5.
 */

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { listDronesByUser } from '@/lib/firebase/drones';
import { listReportsForOwner, markReportRead } from '@/lib/firebase/reports';
import type { Drone, Report } from '@/lib/types/entities';
import { classNames, formatDateTime } from '@/lib/utils';
import { safeMailto } from '@/lib/utils/safeMailto';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { EntityListShell } from '@/components/account/EntityListShell';

export default function AccountInboxPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [reports, setReports] = useState<Report[]>([]);
  const [drones, setDrones] = useState<Drone[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const reload = useMemo(
    () => async () => {
      if (!user) return;
      const [list, dronesList] = await Promise.all([
        listReportsForOwner(user.uid),
        listDronesByUser(user.uid),
      ]);
      setReports(list);
      setDrones(dronesList);
    },
    [user],
  );

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        await reload();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, reload]);

  if (loading) {
    return (
      <div className="mt-8 flex items-center gap-3 text-sm text-gray-500">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
        {t('common.loading')}
      </div>
    );
  }

  function droneLabel(droneId: string, fallbackSlug: string): string {
    const d = drones.find((x) => x.id === droneId);
    if (!d) return fallbackSlug;
    return [d.manufacturer, d.model].filter(Boolean).join(' ').trim() || d.slug;
  }

  async function handleMarkRead(report: Report) {
    if (report.read) return;
    setBusyId(report.id);
    try {
      await markReportRead(report.id);
      setReports((prev) =>
        prev.map((r) => (r.id === report.id ? { ...r, read: true } : r)),
      );
    } finally {
      setBusyId(null);
    }
  }

  const unreadCount = reports.filter((r) => !r.read).length;

  return (
    <EntityListShell
      title={t('inbox.title')}
      subtitle={t('inbox.subtitle')}
      rightActions={
        unreadCount > 0 ? (
          <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-600" aria-hidden />
            {unreadCount} {t('inbox.unread').toLowerCase()}
          </span>
        ) : null
      }
    >
      {reports.length === 0 ? (
        <EmptyState
          title={t('inbox.empty')}
          description={t('inbox.emptyDesc')}
          hints={[t('empty.hints.inbox.1'), t('empty.hints.inbox.2')]}
        />
      ) : (
        <ul className="space-y-3">
          {reports.map((r) => (
            <ReportRow
              key={r.id}
              report={r}
              droneLabel={droneLabel(r.droneId, r.droneSlug)}
              busy={busyId === r.id}
              onMarkRead={() => handleMarkRead(r)}
            />
          ))}
        </ul>
      )}
    </EntityListShell>
  );
}

// ─── Row ──────────────────────────────────────────────────────────────────

function ReportRow({
  report,
  droneLabel,
  busy,
  onMarkRead,
}: {
  report: Report;
  droneLabel: string;
  busy: boolean;
  onMarkRead: () => void;
}) {
  const { t } = useLanguage();
  const finderName = report.finderName.trim() || t('inbox.fromAnonymous');
  // V-021: only render the mailto link when the email passes a strict
  // regex. Anything carrying ?subject=… / &body=… is dropped silently.
  const mailtoHref = safeMailto(report.contactEmail);
  const hasContact = Boolean(mailtoHref);
  const hasMessage = Boolean(report.message.trim());
  const hasLocation = Boolean(report.location || report.locationText.trim());

  // Build a Google Maps URL for the GPS coordinates (no external lookup,
  // just a query string the user can decide to open).
  const mapHref = report.location
    ? `https://www.google.com/maps/search/?api=1&query=${report.location.lat},${report.location.lng}`
    : null;

  return (
    <li>
      <Card padding="md">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold text-gray-900">{finderName}</h3>
              <ReadBadge read={report.read} />
            </div>

            <p className="text-xs text-gray-500">
              <Link
                href={`/u/${report.droneSlug}`}
                className="text-blue-600 underline-offset-2 hover:underline"
              >
                {droneLabel}
              </Link>
              <span className="mx-1.5 text-gray-300">·</span>
              {t('inbox.receivedAt', { date: formatDateTime(report.createdAt) })}
            </p>

            {hasContact && mailtoHref ? (
              <p className="text-sm text-gray-700">
                <span className="text-xs uppercase tracking-wider text-gray-400">
                  {t('inbox.contact')}:
                </span>{' '}
                <a
                  href={mailtoHref}
                  className="text-blue-600 underline-offset-2 hover:underline"
                >
                  {report.contactEmail.trim()}
                </a>
              </p>
            ) : null}

            {hasMessage ? (
              <div className="rounded-lg border border-gray-200 bg-gray-50/60 px-3 py-2.5 text-sm text-gray-800">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                  {t('inbox.message')}
                </p>
                <p className="whitespace-pre-wrap leading-relaxed">{report.message}</p>
              </div>
            ) : null}

            {hasLocation ? (
              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                  {t('inbox.location')}:
                </span>
                {report.locationText.trim() ? (
                  <span>{report.locationText}</span>
                ) : null}
                {report.location ? (
                  <>
                    <span className="font-mono text-[11px] text-gray-500">
                      {t('inbox.locationCoords', {
                        lat: report.location.lat.toFixed(5),
                        lng: report.location.lng.toFixed(5),
                        accuracy: Math.round(report.location.accuracy),
                      })}
                    </span>
                    {mapHref ? (
                      <a
                        href={mapHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline-offset-2 hover:underline"
                      >
                        {t('inbox.viewLocation')}
                      </a>
                    ) : null}
                  </>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="flex shrink-0 flex-col items-stretch gap-2">
            <Button
              href={`/account/drones/${report.droneId}`}
              variant="secondary"
              size="sm"
            >
              {t('inbox.openDrone')}
            </Button>
            {!report.read ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={onMarkRead}
                loading={busy}
              >
                {t('inbox.markRead')}
              </Button>
            ) : null}
          </div>
        </div>
      </Card>
    </li>
  );
}

function ReadBadge({ read }: { read: boolean }) {
  const { t } = useLanguage();
  return (
    <span
      className={classNames(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1 ring-inset',
        read
          ? 'bg-gray-50 text-gray-600 ring-gray-500/20'
          : 'bg-blue-50 text-blue-700 ring-blue-600/20',
      )}
    >
      <span
        className={classNames(
          'h-1.5 w-1.5 rounded-full',
          read ? 'bg-gray-400' : 'bg-blue-600',
        )}
        aria-hidden
      />
      {read ? t('inbox.read') : t('inbox.unread')}
    </span>
  );
}
