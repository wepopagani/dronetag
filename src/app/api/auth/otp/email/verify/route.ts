import { NextResponse } from 'next/server';

import { adminAuth, adminFirestore } from '@/lib/server/firebaseAdmin';
import { verifyEmailOtp } from '@/lib/server/otp';
import { requireUserFromRequest } from '@/lib/server/requestAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function nowIso(): string {
  return new Date().toISOString();
}

export async function POST(request: Request) {
  const auth = await requireUserFromRequest(request);
  if (auth instanceof NextResponse) return auth;

  let body: { code?: unknown } = {};
  try {
    body = (await request.json()) as { code?: unknown };
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  const code = typeof body.code === 'string' ? body.code.trim() : '';
  if (!/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: 'invalid code format' }, { status: 400 });
  }

  const ok = await verifyEmailOtp(auth.uid, code);
  if (!ok) {
    return NextResponse.json({ error: 'invalid or expired code' }, { status: 400 });
  }

  const db = adminFirestore();
  const ref = db.collection('users').doc(auth.uid);
  const snap = await ref.get();
  const cv = (snap.data()?.contactVerification ?? {}) as Record<string, unknown>;

  await ref.set(
    {
      contactVerification: {
        channels: Array.isArray(cv.channels) ? cv.channels : ['email'],
        emailVerifiedAt: nowIso(),
        phoneVerifiedAt: typeof cv.phoneVerifiedAt === 'string' ? cv.phoneVerifiedAt : '',
      },
      updatedAt: nowIso(),
    },
    { merge: true },
  );

  if (auth.email) {
    try {
      await adminAuth().updateUser(auth.uid, { emailVerified: true });
    } catch (err) {
      console.warn('[otp/email/verify] could not set emailVerified on auth user', err);
    }
  }

  return NextResponse.json({ ok: true, verifiedAt: nowIso() });
}
