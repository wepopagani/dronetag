/**
 * /api/billing/webhook — placeholder.
 *
 * PR-SEC-4 ships only the abstraction (src/lib/billing/types.ts).
 * The future PR-BILL-1 will:
 *   1. Configure a `StripeBillingProvider` that verifies
 *      `stripe-signature` against `STRIPE_WEBHOOK_SECRET`.
 *   2. Translate Stripe events into Firestore writes on
 *      `subscriptions/{uid}` and `slots/{uid}` via firebase-admin.
 *   3. Replace `NoopBillingProvider` via `setBillingProvider(...)`.
 *
 * Until then, this endpoint exists so URL-based webhook configuration
 * (Stripe dashboard, GitHub Actions, etc.) can be set up at any time
 * and traffic is logged on the server side instead of being lost.
 */

import { NextResponse } from 'next/server';
import { getBillingProvider } from '@/lib/billing/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const provider = getBillingProvider();
  const rawBody = await req.text();
  const headers = req.headers;

  const result = await provider.handleWebhook(headers, rawBody);
  return new NextResponse(result.body ?? '', { status: result.status });
}
