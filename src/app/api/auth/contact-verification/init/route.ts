import { NextResponse } from 'next/server';

import { adminAuth, adminFirestore } from '@/lib/server/firebaseAdmin';
import { requireUserFromRequest } from '@/lib/server/requestAuth';
import type { ContactVerificationChannel } from '@/lib/types/contactVerification';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function nowIso(): string {
  return new Date().toISOString();
}

type InitBody = {
  channels?: unknown;
  phone?: unknown;
};

export async function POST(request: Request) {
  const auth = await requireUserFromRequest(request);
  if (auth instanceof NextResponse) return auth;

  let body: InitBody = {};
  try {
    body = (await request.json()) as InitBody;
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  const rawChannels = Array.isArray(body.channels) ? body.channels : [];
  const channels = rawChannels.filter(
    (c): c is ContactVerificationChannel => c === 'email' || c === 'phone',
  );
  if (channels.length === 0) {
    return NextResponse.json({ error: 'at least one channel required' }, { status: 400 });
  }

  const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
  if (channels.includes('phone') && !phone) {
    return NextResponse.json({ error: 'phone required for phone verification' }, { status: 400 });
  }

  const db = adminFirestore();
  const ref = db.collection('users').doc(auth.uid);
  const snap = await ref.get();
  const existing = snap.data() ?? {};
  const cv = (existing.contactVerification ?? {}) as Record<string, unknown>;

  const userRecord = await adminAuth().getUser(auth.uid);
  let emailVerifiedAt = typeof cv.emailVerifiedAt === 'string' ? cv.emailVerifiedAt : '';
  if (channels.includes('email') && userRecord.emailVerified) {
    emailVerifiedAt = nowIso();
  }

  await ref.set(
    {
      ...existing,
      uid: auth.uid,
      email: auth.email ?? existing.email ?? '',
      phone: channels.includes('phone') ? phone : (existing.phone ?? ''),
      contactVerification: {
        channels,
        emailVerifiedAt,
        phoneVerifiedAt: typeof cv.phoneVerifiedAt === 'string' ? cv.phoneVerifiedAt : '',
      },
      updatedAt: nowIso(),
    },
    { merge: true },
  );

  return NextResponse.json({ ok: true, channels });
}
