import { NextResponse } from 'next/server';

import { adminAuth, adminFirestore } from '@/lib/server/firebaseAdmin';
import { requireUserFromRequest } from '@/lib/server/requestAuth';
import { cleanString } from '@/lib/server/strings';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function nowIso(): string {
  return new Date().toISOString();
}

export async function POST(request: Request) {
  const auth = await requireUserFromRequest(request);
  if (auth instanceof NextResponse) return auth;

  let body: { phone?: unknown } = {};
  try {
    body = (await request.json()) as { phone?: unknown };
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  const phone = cleanString(body.phone, 32);
  if (!phone) {
    return NextResponse.json({ error: 'phone required' }, { status: 400 });
  }

  const userRecord = await adminAuth().getUser(auth.uid);
  if (!userRecord.phoneNumber) {
    return NextResponse.json({ error: 'phone not linked to auth user' }, { status: 400 });
  }

  const normalize = (p: string) => p.replace(/\s+/g, '');
  if (normalize(userRecord.phoneNumber) !== normalize(phone)) {
    return NextResponse.json({ error: 'phone mismatch' }, { status: 400 });
  }

  const db = adminFirestore();
  const ref = db.collection('users').doc(auth.uid);
  const snap = await ref.get();
  const cv = (snap.data()?.contactVerification ?? {}) as Record<string, unknown>;

  await ref.set(
    {
      phone,
      contactVerification: {
        channels: Array.isArray(cv.channels) ? cv.channels : ['phone'],
        emailVerifiedAt: typeof cv.emailVerifiedAt === 'string' ? cv.emailVerifiedAt : '',
        phoneVerifiedAt: nowIso(),
      },
      updatedAt: nowIso(),
    },
    { merge: true },
  );

  return NextResponse.json({ ok: true, verifiedAt: nowIso() });
}
