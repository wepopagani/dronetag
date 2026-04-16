/**
 * In-memory store for DEMO_MODE: user accounts + orders.
 * Mirrors the Firestore helpers so callers don't care.
 */

import type { Order, UserAccount } from '@/lib/types/account';
import { DEMO_ORDERS, DEMO_USER_ACCOUNT } from './accountData';

let accounts: UserAccount[] = [DEMO_USER_ACCOUNT];
const orders: Order[] = [...DEMO_ORDERS];

function delay(ms = 120): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function getAccountByUid(uid: string): Promise<UserAccount | null> {
  await delay();
  return accounts.find((a) => a.uid === uid) ?? null;
}

export async function ensureAccount(
  uid: string,
  email: string,
  seed: Partial<UserAccount> = {},
): Promise<UserAccount> {
  await delay();
  const existing = accounts.find((a) => a.uid === uid);
  if (existing) return existing;
  const now = new Date().toISOString();
  const account: UserAccount = {
    uid,
    email,
    firstName: seed.firstName ?? '',
    lastName: seed.lastName ?? '',
    phone: seed.phone ?? '',
    address: seed.address ?? {
      line1: '',
      line2: '',
      city: '',
      postalCode: '',
      country: '',
    },
    createdAt: now,
    updatedAt: now,
  };
  accounts = [...accounts, account];
  return account;
}

export async function getOrdersByUser(uid: string): Promise<Order[]> {
  await delay();
  return orders
    .filter((o) => o.userId === uid)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getOrderById(
  id: string,
  uid: string,
): Promise<Order | null> {
  await delay();
  const order = orders.find((o) => o.id === id);
  if (!order || order.userId !== uid) return null;
  return order;
}
