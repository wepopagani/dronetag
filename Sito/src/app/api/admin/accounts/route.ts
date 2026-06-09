/**
 * GET /api/admin/accounts - list all `users/{uid}` docs (admin only).
 *
 * Uses the Firebase Admin SDK so listing works even when client-side
 * Firestore rules are missing/outdated. The caller must present a valid
 * ID token with `admin: true` (session cookie or __dronetag_idt).
 */

import { NextResponse } from 'next/server';
import { requireAdminFromRequest } from '@/lib/server/adminAuth';
import { adminFirestore } from '@/lib/server/firebaseAdmin';
import type { UserAccount } from '@/lib/types/account';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function accountFromRaw(uid: string, raw: Record<string, unknown>): UserAccount {
  const str = (k: string) => (typeof raw[k] === 'string' ? (raw[k] as string) : '');
  const addr = (raw['address'] ?? {}) as Record<string, unknown>;
  const addrStr = (k: string) => (typeof addr[k] === 'string' ? (addr[k] as string) : '');
  const rawType = str('accountType');
  const accountType: UserAccount['accountType'] =
    rawType === 'company' ? 'company' : 'private';

  return {
    uid,
    email: str('email'),
    accountType,
    firstName: str('firstName'),
    lastName: str('lastName'),
    dateOfBirth: str('dateOfBirth'),
    phone: str('phone'),
    address: {
      line1: addrStr('line1'),
      line2: addrStr('line2'),
      city: addrStr('city'),
      postalCode: addrStr('postalCode'),
      country: addrStr('country'),
    },
    companyName: str('companyName'),
    companyContactPerson: str('companyContactPerson'),
    companyVat: str('companyVat'),
    companyUniqueNumber: str('companyUniqueNumber'),
    profilePhotoUrl: str('profilePhotoUrl'),
    logoUrl: str('logoUrl'),
    bannerUrl: str('bannerUrl'),
    createdAt: str('createdAt'),
    updatedAt: str('updatedAt'),
  };
}

export async function GET(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const snap = await adminFirestore().collection('users').get();
    const accounts = snap.docs
      .map((d) => accountFromRaw(d.id, d.data() as Record<string, unknown>))
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    return NextResponse.json({ accounts });
  } catch (err) {
    console.error('[api/admin/accounts]', err);
    return NextResponse.json({ error: 'firestore list failed' }, { status: 500 });
  }
}
