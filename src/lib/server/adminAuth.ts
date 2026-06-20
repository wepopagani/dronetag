/**
 * Verify a Firebase ID token from the incoming request and require `admin: true`.
 */

import { NextResponse } from 'next/server';
import { adminAuth, isFirebaseAdminConfigured } from '@/lib/server/firebaseAdmin';
import { tokenFromRequest } from '@/lib/server/requestAuth';

export type VerifiedAdmin = {
  uid: string;
  email?: string;
};

export async function requireAdminFromRequest(
  request: Request,
): Promise<VerifiedAdmin | NextResponse> {
  if (!isFirebaseAdminConfigured()) {
    return NextResponse.json({ error: 'admin sdk not configured' }, { status: 503 });
  }

  const idToken = tokenFromRequest(request);
  if (!idToken) {
    return NextResponse.json({ error: 'missing id token' }, { status: 401 });
  }

  try {
    const decoded = await adminAuth().verifyIdToken(idToken, true);
    if (decoded.admin !== true) {
      return NextResponse.json({ error: 'admin required' }, { status: 403 });
    }
    return { uid: decoded.uid, email: decoded.email };
  } catch (err) {
    return NextResponse.json(
      { error: 'invalid token', code: (err as { code?: string }).code ?? 'unknown' },
      { status: 401 },
    );
  }
}
