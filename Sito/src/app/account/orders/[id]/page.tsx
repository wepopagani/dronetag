'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getOrderForUser } from '@/lib/firebase/orders';
import type {
  Order,
  OrderEvent,
  OrderEventType,
  OrderItem,
  OrderStatus,
} from '@/lib/types/account';
import { ORDER_STATUS_STEPS } from '@/lib/types/account';
import { Card } from '@/components/ui/Card';

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!user || !params.id) return;
    let cancelled = false;
    (async () => {
      try {
        const o = await getOrderForUser(params.id, user.uid);
        if (cancelled) return;
        if (!o) setNotFound(true);
        else setOrder(o);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, params.id]);

  if (loading) {
    return (
      <div className="mt-8 flex items-center gap-3 text-sm text-gray-500">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
        {t('common.loading')}
      </div>
    );
  }

  if (notFound || !order) {
    return (
      <Card className="mt-6" padding="lg">
        <div className="text-center">
          <p className="text-sm text-gray-700">{t('orders.notFound')}</p>
          <button
            type="button"
            onClick={() => router.push('/account/orders')}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
          >
            {t('common.back')}
          </button>
        </div>
      </Card>
    );
  }

  return (
    <div className="mt-6 space-y-6">
      <Link
        href="/account/orders"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 transition hover:text-gray-800"
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        {t('orders.backToOrders')}
      </Link>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <Card padding="md">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              {t('orders.orderNumber')}
            </p>
            <h2 className="mt-0.5 text-xl font-bold text-gray-900">{order.number}</h2>
            <p className="mt-1 text-xs text-gray-500">
              {t('orders.placedOn', { date: formatDateTime(order.createdAt) })}
            </p>
          </div>
          <StatusPill status={order.status} />
        </div>
      </Card>

      {/* ── Status progress bar ────────────────────────────────────────────── */}
      <Card padding="md">
        <h3 className="text-sm font-semibold text-gray-900">{t('orders.progress')}</h3>
        <StatusProgress status={order.status} />
      </Card>

      {/* ── Shipping ───────────────────────────────────────────────────────── */}
      <Card padding="md">
        <h3 className="mb-3 text-sm font-semibold text-gray-900">
          {t('orders.shippingTitle')}
        </h3>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
              {t('orders.carrier')}
            </p>
            <p className="mt-1 text-sm text-gray-900">
              {order.shipping.carrier || '—'}
            </p>
            {order.shipping.trackingNumber ? (
              <p className="mt-2 text-xs font-mono text-gray-500 break-all">
                {order.shipping.trackingNumber}
              </p>
            ) : null}
            {order.shipping.trackingUrl ? (
              <a
                href={order.shipping.trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800"
              >
                {t('orders.openTracking')}
                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 3h7m0 0v7m0-7L10 14M5 5v14h14v-5" />
                </svg>
              </a>
            ) : null}
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
              {t('orders.shipTo')}
            </p>
            <address className="mt-1 not-italic text-sm leading-relaxed text-gray-900">
              {formatAddress(order.shipping.address).map((l, i) => (
                <div key={i}>{l}</div>
              ))}
            </address>
            {order.shipping.estimatedDelivery ? (
              <p className="mt-3 rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 inline-block">
                {t('orders.eta', { date: formatDate(order.shipping.estimatedDelivery) })}
              </p>
            ) : null}
            {order.deliveredAt ? (
              <p className="mt-3 rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 inline-block">
                {t('orders.deliveredOn', { date: formatDate(order.deliveredAt) })}
              </p>
            ) : null}
          </div>
        </div>
      </Card>

      {/* ── Items + traceability ───────────────────────────────────────────── */}
      <Card padding="md">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">{t('orders.items')}</h3>
          <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-indigo-700">
            {t('orders.professionalTrace')}
          </span>
        </div>
        <div className="space-y-4">
          {order.items.map((item) => (
            <ItemTraceCard key={item.id} item={item} currency={order.totals.currency} />
          ))}
        </div>

        <div className="mt-6 border-t border-gray-100 pt-4 space-y-2 text-sm">
          <TotalLine label={t('orders.subtotal')} amount={order.totals.subtotal} currency={order.totals.currency} />
          <TotalLine label={t('orders.shippingFee')} amount={order.totals.shipping} currency={order.totals.currency} />
          <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              {t('orders.total')}
            </span>
            <span className="text-lg font-bold text-gray-900">
              {formatMoney(order.totals.total, order.totals.currency)}
            </span>
          </div>
        </div>
      </Card>

      {/* ── Full chain-of-custody timeline ─────────────────────────────────── */}
      <Card padding="md">
        <h3 className="mb-4 text-sm font-semibold text-gray-900">
          {t('orders.timeline')}
        </h3>
        <Timeline events={order.timeline} />
      </Card>
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function ItemTraceCard({
  item,
  currency,
}: {
  item: OrderItem;
  currency: string;
}) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900">{item.name}</p>
          <p className="mt-0.5 text-xs text-gray-500">
            {item.quantity} × {formatMoney(item.unitPrice, currency)}
          </p>
          {item.trace?.serialNumber ? (
            <p className="mt-2 font-mono text-[11px] uppercase tracking-wider text-gray-500">
              S/N · {item.trace.serialNumber}
            </p>
          ) : null}
        </div>
        <p className="text-sm font-semibold text-gray-900">
          {formatMoney(item.unitPrice * item.quantity, currency)}
        </p>
      </div>

      {item.trace ? (
        <>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-700 transition hover:bg-gray-50"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className={`h-3.5 w-3.5 transition ${open ? 'rotate-90' : ''}`}
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            {open ? t('orders.hideTrace') : t('orders.showTrace')}
          </button>

          {open ? (
            <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-3 border-t border-gray-200 pt-4 sm:grid-cols-2">
              <TraceField label={t('trace.batch')} value={item.trace.batchNumber} />
              <TraceField label={t('trace.material')} value={item.trace.material} />
              <TraceField label={t('trace.printedAt')} value={formatDateTime(item.trace.printedAt)} />
              <TraceField label={t('trace.printer')} value={item.trace.printerId} />
              <TraceField label={t('trace.assembledAt')} value={formatDateTime(item.trace.assembledAt)} />
              <TraceField label={t('trace.assembledBy')} value={item.trace.assembledBy} />
              <TraceField label={t('trace.qcAt')} value={formatDateTime(item.trace.qcAt)} />
              <TraceField label={t('trace.qcBy')} value={item.trace.qcBy} />
              {item.trace.notes ? (
                <div className="sm:col-span-2">
                  <dt className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                    {t('trace.notes')}
                  </dt>
                  <dd className="mt-1 text-sm text-gray-700">{item.trace.notes}</dd>
                </div>
              ) : null}
            </dl>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

function TraceField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm text-gray-900">{value || '—'}</dd>
    </div>
  );
}

function TotalLine({
  label,
  amount,
  currency,
}: {
  label: string;
  amount: number;
  currency: string;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-900">{formatMoney(amount, currency)}</span>
    </div>
  );
}

function StatusProgress({ status }: { status: OrderStatus }) {
  const { t } = useLanguage();
  const currentIdx = ORDER_STATUS_STEPS.indexOf(status);
  const done = currentIdx >= 0;

  return (
    <ol className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-8">
      {ORDER_STATUS_STEPS.map((step, i) => {
        const isActive = done && i === currentIdx;
        const isDone = done && i < currentIdx;
        return (
          <li key={step} className="flex flex-col items-center gap-1.5">
            <div
              className={[
                'flex h-7 w-7 items-center justify-center rounded-full border-2 text-[11px] font-bold transition',
                isActive
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : isDone
                    ? 'border-blue-600 bg-white text-blue-700'
                    : 'border-gray-200 bg-white text-gray-300',
              ].join(' ')}
            >
              {isDone ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="h-3.5 w-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                i + 1
              )}
            </div>
            <span
              className={[
                'text-center text-[10px] font-medium leading-tight',
                isActive ? 'text-blue-700' : isDone ? 'text-gray-700' : 'text-gray-400',
              ].join(' ')}
            >
              {t(`orderStatus.${step}`)}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function Timeline({ events }: { events: OrderEvent[] }) {
  if (events.length === 0) return null;
  return (
    <ol className="relative space-y-5 border-l-2 border-gray-100 pl-6">
      {events
        .slice()
        .sort((a, b) => b.at.localeCompare(a.at))
        .map((event, i) => (
          <li key={i} className="relative">
            <span
              aria-hidden
              className={`absolute -left-[34px] top-1 flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-white ${eventColor(event.type)}`}
            >
              <span className="h-2 w-2 rounded-full bg-white" />
            </span>
            <p className="text-sm font-semibold text-gray-900">{event.label}</p>
            <p className="mt-0.5 text-xs text-gray-500">
              {formatDateTime(event.at)}
              {event.by ? ` · ${event.by}` : ''}
              {event.location ? ` · ${event.location}` : ''}
            </p>
            {event.note ? (
              <p className="mt-1 text-xs text-gray-600">{event.note}</p>
            ) : null}
          </li>
        ))}
    </ol>
  );
}

function StatusPill({ status }: { status: OrderStatus }) {
  const { t } = useLanguage();
  const styles: Record<OrderStatus, string> = {
    pending: 'bg-gray-100 text-gray-700',
    paid: 'bg-blue-50 text-blue-700',
    in_production: 'bg-indigo-50 text-indigo-700',
    assembled: 'bg-indigo-50 text-indigo-700',
    quality_check: 'bg-amber-50 text-amber-700',
    packed: 'bg-sky-50 text-sky-700',
    shipped: 'bg-sky-50 text-sky-700',
    in_transit: 'bg-sky-50 text-sky-700',
    delivered: 'bg-emerald-50 text-emerald-700',
    cancelled: 'bg-red-50 text-red-700',
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ${styles[status]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      {t(`orderStatus.${status}`)}
    </span>
  );
}

function eventColor(type: OrderEventType): string {
  switch (type) {
    case 'delivered':
    case 'qc_passed':
      return 'bg-emerald-500';
    case 'shipped':
    case 'in_transit':
    case 'packed':
      return 'bg-sky-500';
    case 'production_started':
    case 'assembled':
      return 'bg-indigo-500';
    case 'paid':
      return 'bg-blue-500';
    case 'created':
      return 'bg-gray-400';
    default:
      return 'bg-gray-400';
  }
}

// ─── Formatters ─────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso.slice(0, 10);
  }
}

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function formatMoney(amount: number, currency: string): string {
  return `${currency} ${amount.toLocaleString('de-CH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatAddress(addr: {
  line1: string;
  line2: string;
  city: string;
  postalCode: string;
  country: string;
}): string[] {
  return [
    addr.line1,
    addr.line2,
    [addr.postalCode, addr.city].filter(Boolean).join(' '),
    addr.country,
  ].filter(Boolean);
}
