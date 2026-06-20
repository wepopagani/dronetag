/**
 * Billing abstraction (PR-SEC-4 — preparation layer only).
 *
 * No vendor SDK is imported here. The interfaces below are the
 * contract that a future Stripe (or any other) integration must
 * satisfy. The product entities live in a `products/{id}` Firestore
 * collection so the admin plan editor can keep using its current
 * shape; a `subscriptions/{uid}` collection records the current
 * status of each user's active subscription.
 *
 * Webhook flow (placeholder until PR-BILL-1):
 *
 *   Stripe → POST /api/billing/webhook → BillingProvider.handleWebhook
 *     → updates `subscriptions/{uid}` + grants slot entitlements via
 *       `BillingProvider.applyEntitlements(uid, productId)`.
 */

import type { SlotKind } from '@/lib/types/entities';

export type SubscriptionStatus =
  | 'inactive'
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled';

/** What a paid plan unlocks for a user (in addition to BASE_SLOTS). */
export type PlanSlotEntitlements = Record<SlotKind, number>;

export interface BillingProduct {
  id: string;
  /** Vendor-side product id (e.g. Stripe `prod_*`). Empty until configured. */
  externalProductId: string;
  /** Vendor-side price id (e.g. Stripe `price_*`). Empty until configured. */
  externalPriceId: string;
  label: string;
  description: string;
  priceCents: number;
  currency: string;
  interval: 'month' | 'year' | 'one_time';
  slotEntitlements: PlanSlotEntitlements;
  active: boolean;
}

export interface UserSubscription {
  uid: string;
  productId: string;
  status: SubscriptionStatus;
  /** ISO timestamp. */
  currentPeriodStart: string;
  /** ISO timestamp. */
  currentPeriodEnd: string;
  /** ISO when the user requested cancellation. Empty when active. */
  cancelAt: string;
  /** Vendor-side subscription id (e.g. Stripe `sub_*`). */
  externalSubscriptionId: string;
}

export interface CheckoutSessionArgs {
  uid: string;
  productId: string;
  /** Where to send the user after a successful purchase. */
  successUrl: string;
  /** Where to send the user if they cancel. */
  cancelUrl: string;
}

export interface BillingProvider {
  /**
   * Returns a vendor-hosted checkout URL the client redirects to.
   * Throws when the vendor is not configured (e.g. NoopBillingProvider).
   */
  createCheckoutSession(args: CheckoutSessionArgs): Promise<{ url: string }>;

  /** Cancels the user's active subscription at the end of the period. */
  cancelSubscription(uid: string): Promise<void>;

  /** Resumes a previously-cancelled subscription within its grace window. */
  resumeSubscription(uid: string): Promise<void>;

  /** URL of the vendor billing portal (where users update card info). */
  getPortalUrl(uid: string, returnUrl: string): Promise<string>;

  /**
   * Server-side webhook handler. Implementations MUST verify the
   * incoming signature against the vendor secret before mutating any
   * data. The current placeholder rejects everything with 501.
   */
  handleWebhook(headers: Headers, rawBody: string): Promise<{ status: number; body?: string }>;
}

export class BillingNotConfiguredError extends Error {
  constructor() {
    super('Billing provider not configured. PR-BILL-1 will wire Stripe.');
    this.name = 'BillingNotConfiguredError';
  }
}

/** Default provider used until a real one is wired in. */
export const NoopBillingProvider: BillingProvider = {
  async createCheckoutSession() { throw new BillingNotConfiguredError(); },
  async cancelSubscription() { throw new BillingNotConfiguredError(); },
  async resumeSubscription() { throw new BillingNotConfiguredError(); },
  async getPortalUrl() { throw new BillingNotConfiguredError(); },
  async handleWebhook() {
    return { status: 501, body: 'billing provider not configured' };
  },
};

let activeProvider: BillingProvider = NoopBillingProvider;

export function setBillingProvider(next: BillingProvider): void {
  activeProvider = next;
}

export function getBillingProvider(): BillingProvider {
  return activeProvider;
}
