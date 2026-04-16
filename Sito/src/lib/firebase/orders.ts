import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  where,
} from 'firebase/firestore';

import { DEMO_MODE, getFirebaseDb } from '@/lib/firebase/config';
import * as demoStore from '@/lib/demo/accountStore';
import type {
  Order,
  OrderEvent,
  OrderItem,
  OrderStatus,
} from '@/lib/types/account';

const ORDERS = 'orders';

function orderFromRaw(id: string, raw: Record<string, unknown>): Order {
  const str = (k: string) => (typeof raw[k] === 'string' ? (raw[k] as string) : '');
  const num = (k: string) => (typeof raw[k] === 'number' ? (raw[k] as number) : 0);

  const items = Array.isArray(raw['items']) ? (raw['items'] as OrderItem[]) : [];
  const timeline = Array.isArray(raw['timeline']) ? (raw['timeline'] as OrderEvent[]) : [];
  const shipping = (raw['shipping'] ?? {}) as Partial<Order['shipping']>;
  const totals = (raw['totals'] ?? {}) as Partial<Order['totals']>;

  return {
    id,
    number: str('number'),
    userId: str('userId'),
    status: (str('status') || 'pending') as OrderStatus,
    createdAt: str('createdAt'),
    paidAt: str('paidAt'),
    shippedAt: str('shippedAt'),
    deliveredAt: str('deliveredAt'),
    items,
    timeline,
    shipping: {
      address: shipping.address ?? {
        line1: '',
        line2: '',
        city: '',
        postalCode: '',
        country: '',
      },
      carrier: shipping.carrier ?? '',
      trackingNumber: shipping.trackingNumber ?? '',
      trackingUrl: shipping.trackingUrl ?? '',
      estimatedDelivery: shipping.estimatedDelivery ?? '',
    },
    totals: {
      subtotal: totals.subtotal ?? num('subtotal'),
      shipping: totals.shipping ?? 0,
      total: totals.total ?? 0,
      currency: totals.currency ?? 'CHF',
    },
  };
}

export async function getOrdersForUser(uid: string): Promise<Order[]> {
  if (DEMO_MODE) return demoStore.getOrdersByUser(uid);
  const db = getFirebaseDb();
  const q = query(
    collection(db, ORDERS),
    where('userId', '==', uid),
    orderBy('createdAt', 'desc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => orderFromRaw(d.id, d.data() as Record<string, unknown>));
}

export async function getOrderForUser(
  id: string,
  uid: string,
): Promise<Order | null> {
  if (DEMO_MODE) return demoStore.getOrderById(id, uid);
  const db = getFirebaseDb();
  const snap = await getDoc(doc(db, ORDERS, id));
  if (!snap.exists()) return null;
  const order = orderFromRaw(snap.id, snap.data() as Record<string, unknown>);
  if (order.userId !== uid) return null;
  return order;
}
