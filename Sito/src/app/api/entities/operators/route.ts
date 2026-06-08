/**
 * POST /api/entities/operators - create operator via Admin SDK.
 * Fallback when Cloud Functions are not deployed.
 */

import { NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/server/firebaseAdmin';
import { enforceQuota, QuotaError } from '@/lib/server/quota';
import { requireUserFromRequest } from '@/lib/server/requestAuth';
import { cleanString } from '@/lib/server/strings';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Address = {
  line1?: unknown;
  line2?: unknown;
  city?: unknown;
  postalCode?: unknown;
  country?: unknown;
};

type Body = {
  kind?: unknown;
  label?: unknown;
  isDefault?: unknown;
  private?: {
    firstName?: unknown;
    lastName?: unknown;
    dateOfBirth?: unknown;
    email?: unknown;
    phone?: unknown;
    address?: Address;
  };
  company?: {
    companyName?: unknown;
    contactPerson?: unknown;
    vatNumber?: unknown;
    uniqueCompanyNumber?: unknown;
    email?: unknown;
    address?: Address;
  };
};

function sanitizeAddress(a: Address | undefined) {
  return {
    line1: cleanString(a?.line1, 200),
    line2: cleanString(a?.line2, 200),
    city: cleanString(a?.city, 200),
    postalCode: cleanString(a?.postalCode, 32),
    country: cleanString(a?.country, 100),
  };
}

function nowIso(): string {
  return new Date().toISOString();
}

export async function POST(request: Request) {
  const auth = await requireUserFromRequest(request);
  if (auth instanceof NextResponse) return auth;

  let body: Body = {};
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  const kind = cleanString(body.kind, 16);
  if (kind !== 'private' && kind !== 'company') {
    return NextResponse.json({ error: 'kind must be private or company' }, { status: 400 });
  }

  try {
    await enforceQuota(auth.uid, 'operator');
  } catch (err) {
    if (err instanceof QuotaError) {
      return NextResponse.json({ error: err.message, code: 'quota' }, { status: 429 });
    }
    throw err;
  }

  const priv = body.private ?? {};
  const comp = body.company ?? {};
  const payload = {
    userId: auth.uid,
    kind,
    label: cleanString(body.label, 200),
    isDefault: body.isDefault === true,
    private: {
      firstName: cleanString(priv.firstName, 200),
      lastName: cleanString(priv.lastName, 200),
      dateOfBirth: cleanString(priv.dateOfBirth, 32),
      email: cleanString(priv.email, 320),
      phone: cleanString(priv.phone, 64),
      address: sanitizeAddress(priv.address),
    },
    company: {
      companyName: cleanString(comp.companyName, 300),
      contactPerson: cleanString(comp.contactPerson, 200),
      vatNumber: cleanString(comp.vatNumber, 64),
      uniqueCompanyNumber: cleanString(comp.uniqueCompanyNumber, 64),
      email: cleanString(comp.email, 320),
      address: sanitizeAddress(comp.address),
    },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };

  if (kind === 'private' && !payload.private.firstName && !payload.private.lastName) {
    return NextResponse.json({ error: 'private operator requires name' }, { status: 400 });
  }
  if (kind === 'company' && !payload.company.companyName) {
    return NextResponse.json({ error: 'company operator requires company name' }, { status: 400 });
  }

  const db = adminFirestore();

  if (payload.isDefault) {
    const existing = await db
      .collection('operators')
      .where('userId', '==', auth.uid)
      .where('isDefault', '==', true)
      .get();
    const batch = db.batch();
    for (const d of existing.docs) {
      batch.update(d.ref, { isDefault: false, updatedAt: nowIso() });
    }
    const ref = db.collection('operators').doc();
    batch.set(ref, payload);
    await batch.commit();
    return NextResponse.json({ id: ref.id });
  }

  const ref = await db.collection('operators').add(payload);
  return NextResponse.json({ id: ref.id });
}
