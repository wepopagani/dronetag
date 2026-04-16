'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getOrdersForUser } from '@/lib/firebase/orders';
import type { Order, OrderStatus } from '@/lib/types/account';
import { Card } from '@/components/ui/Card';

export default function AccountOrdersPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const list = await getOrdersForUser(user.uid);
        if (!cancelled) setOrders(list);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (loading) {
    return (
      <div className="mt-8 flex items-center gap-3 text-sm text-gray-500">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
        {t('common.loading')}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <Card className="mt-6" padding="lg">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-6 w-6" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
          </div>
          <h2 className="text-base font-semibold text-gray-900">
            {t('orders.emptyTitle')}
          </h2>
          <p className="mt-1 text-sm text-gray-500">{t('orders.emptyDesc')}</p>
          <Link
            href="/shop"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            {t('orders.emptyCta')}
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 12h14" />
            </svg>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      {orders.map((order) => (
        <OrderRow key={order.id} order={order} />
      ))}
    </div>
  );
}

function OrderRow({ order }: { order: Order }) {
  const { t } = useLanguage();

  return (
    <Link
      href={`/account/orders/${order.id}`}
      className="group block rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-gray-300 hover:shadow-md"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            {t('orders.orderNumber')}
          </p>
          <p className="mt-0.5 text-base font-semibold text-gray-900">{order.number}</p>
          <p className="mt-0.5 text-xs text-gray-500">
            {t('orders.placedOn', { date: formatDate(order.createdAt) })}
          </p>
        </div>
        <StatusPill status={order.status} />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
        <div className="min-w-0 flex-1 text-sm text-gray-600">
          {order.items
            .map((i) => `${i.quantity}× ${i.name}`)
            .join(' · ')}
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-gray-900">
            {formatMoney(order.totals.total, order.totals.currency)}
          </p>
          <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-blue-600 opacity-0 transition group-hover:opacity-100">
            {t('orders.viewDetails')}
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 12h14" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
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

function formatMoney(amount: number, currency: string): string {
  return `${currency} ${amount.toLocaleString('de-CH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
