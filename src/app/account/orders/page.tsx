'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getOrdersForUser } from '@/lib/firebase/orders';
import type { Order, OrderStatus } from '@/lib/types/account';
import { EmptyState } from '@/components/ui/EmptyState';
import { EntityListRow } from '@/components/ui/EntityListRow';
import { ResponsivePageHeader } from '@/components/ui/ResponsivePageHeader';
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
      <div className="flex items-center gap-3 text-sm text-[var(--color-text-secondary)]">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-200 border-t-[var(--color-action)]" />
        {t('common.loading')}
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      <ResponsivePageHeader title={t('account.tabOrders')} />

      {orders.length === 0 ? (
        <EmptyState
          title={t('orders.emptyTitle')}
          description={t('orders.emptyDesc')}
        />
      ) : (
        <ul className="space-y-2 sm:space-y-3">
          {orders.map((order) => (
            <OrderRow key={order.id} order={order} />
          ))}
        </ul>
      )}
    </div>
  );
}

function OrderRow({ order }: { order: Order }) {
  const { t } = useLanguage();

  return (
    <li>
      <Link href={`/account/orders/${order.id}`} className="block">
        <Card padding="md" className="transition hover:border-[var(--color-action)]/30">
          <EntityListRow
            actions={<StatusPill status={order.status} />}
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 sm:text-xs">
              {t('orders.orderNumber')}
            </p>
            <p className="mt-0.5 truncate text-sm font-semibold text-gray-900 sm:text-base">{order.number}</p>
            <p className="mt-0.5 text-[11px] text-gray-500 sm:text-xs">
              {t('orders.placedOn', { date: formatDate(order.createdAt) })}
            </p>
            <p className="mt-2 line-clamp-2 text-[11px] text-gray-600 sm:text-sm">
              {order.items.map((i) => `${i.quantity}x ${i.name}`).join(' · ')}
            </p>
            <p className="mt-2 text-sm font-bold text-gray-900">
              {formatMoney(order.totals.total, order.totals.currency)}
            </p>
          </EntityListRow>
        </Card>
      </Link>
    </li>
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
      className={`inline-flex max-w-full items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide sm:px-2.5 sm:py-1 sm:text-[11px] ${styles[status]}`}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" aria-hidden />
      <span className="truncate">{t(`orderStatus.${status}`)}</span>
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
