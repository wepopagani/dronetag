/**
 * POST /api/admin/users - provision a new end-user (admin only).
 *
 * Creates Firebase Auth credentials plus users/{uid}, pilots/{uid},
 * and slots/{uid}. Public self-signup is disabled; this is the only
 * supported account-creation path in production.
 */

import { NextResponse } from 'next/server';
import { requireAdminFromRequest } from '@/lib/server/adminAuth';
import { adminAuth, adminFirestore } from '@/lib/server/firebaseAdmin';
import { BASE_SLOTS } from '@/lib/types/entities';
import type { AccountType } from '@/lib/types/account';
import {
  apiFieldsFromCodes,
  validateAdminCreateUserInput,
} from '@/lib/validation/adminCreateUser';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type CreateUserBody = {
  email?: unknown;
  password?: unknown;
  accountType?: unknown;
  firstName?: unknown;
  lastName?: unknown;
  dateOfBirth?: unknown;
  phone?: unknown;
  companyName?: unknown;
  companyContactPerson?: unknown;
  companyVat?: unknown;
  companyUniqueNumber?: unknown;
  address?: {
    line1?: unknown;
    line2?: unknown;
    city?: unknown;
    postalCode?: unknown;
    country?: unknown;
  };
};

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

export async function POST(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if (auth instanceof NextResponse) return auth;

  let body: CreateUserBody = {};
  try {
    body = (await request.json()) as CreateUserBody;
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  const email = str(body.email).toLowerCase();
  const password = str(body.password);
  const firstName = str(body.firstName);
  const lastName = str(body.lastName);
  const accountTypeRaw = str(body.accountType);
  const accountType: AccountType = accountTypeRaw === 'company' ? 'company' : 'private';

  const validationCodes = validateAdminCreateUserInput({
    email,
    password,
    accountType,
    firstName,
    lastName,
    companyName: str(body.companyName),
    companyContactPerson: str(body.companyContactPerson),
  });
  if (validationCodes.length > 0) {
    return NextResponse.json(
      {
        error: 'validation_failed',
        fields: apiFieldsFromCodes(validationCodes),
        codes: validationCodes,
      },
      { status: 400 },
    );
  }

  const addr = body.address ?? {};
  const address = {
    line1: str(addr.line1),
    line2: str(addr.line2),
    city: str(addr.city),
    postalCode: str(addr.postalCode),
    country: str(addr.country),
  };

  const now = new Date().toISOString();
  const displayName = `${firstName} ${lastName}`.trim();

  try {
    const userRecord = await adminAuth().createUser({
      email,
      password,
      displayName,
      emailVerified: false,
    });
    const uid = userRecord.uid;
    const db = adminFirestore();

    const account = {
      uid,
      email,
      accountType,
      firstName,
      lastName,
      dateOfBirth: str(body.dateOfBirth),
      phone: str(body.phone),
      address,
      companyName: accountType === 'company' ? str(body.companyName) : '',
      companyContactPerson: accountType === 'company' ? str(body.companyContactPerson) : '',
      companyVat: accountType === 'company' ? str(body.companyVat) : '',
      companyUniqueNumber: accountType === 'company' ? str(body.companyUniqueNumber) : '',
      createdAt: now,
      updatedAt: now,
      provisionedBy: auth.uid,
    };

    const pilot = {
      userId: uid,
      firstName,
      lastName,
      dateOfBirth: str(body.dateOfBirth),
      nationality: '',
      email,
      phone: str(body.phone),
      address,
      operatorCode: '',
      operatorLicense: '',
      emergencyContact: '',
      createdAt: now,
      updatedAt: now,
    };

    const batch = db.batch();
    batch.set(db.collection('users').doc(uid), account);
    batch.set(db.collection('pilots').doc(uid), pilot);
    batch.set(db.collection('slots').doc(uid), {
      userId: uid,
      ...BASE_SLOTS,
      createdAt: now,
      updatedAt: now,
      provisionedBy: auth.uid,
    });
    await batch.commit();

    return NextResponse.json({ uid, email });
  } catch (err) {
    const code = (err as { code?: string }).code ?? 'unknown';
    if (code === 'auth/email-already-exists') {
      return NextResponse.json({ error: 'email already exists', code }, { status: 409 });
    }
    console.error('[api/admin/users]', err);
    return NextResponse.json({ error: 'create failed', code }, { status: 500 });
  }
}
