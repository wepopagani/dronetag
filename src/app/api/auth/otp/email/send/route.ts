import { NextResponse } from 'next/server';

import { adminFirestore } from '@/lib/server/firebaseAdmin';
import { sendEmailOtp } from '@/lib/server/otp';
import { requireUserFromRequest } from '@/lib/server/requestAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const auth = await requireUserFromRequest(request);
  if (auth instanceof NextResponse) return auth;

  if (!auth.email) {
    return NextResponse.json({ error: 'missing email on account' }, { status: 400 });
  }

  try {
    const result = await sendEmailOtp(auth.uid, auth.email);
    const payload: Record<string, unknown> = { ok: true };
    if (result.devCode && process.env.NODE_ENV === 'development') {
      payload.devCode = result.devCode;
    }
    return NextResponse.json(payload);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'send failed';
    if (message === 'otp_cooldown') {
      return NextResponse.json({ error: 'wait before resending' }, { status: 429 });
    }
    if (message === 'otp_email_delivery_failed') {
      return NextResponse.json({ error: 'email delivery not configured' }, { status: 503 });
    }
    console.error('[otp/email/send]', err);
    return NextResponse.json({ error: 'send failed' }, { status: 500 });
  }
}
