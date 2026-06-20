/**
 * Verify Firebase ID tokens on /api/* routes (session cookie or Bearer).
 */

import { NextResponse } from 'next/server';
import { adminAuth, isFirebaseAdminConfigured } from '@/lib/server/firebaseAdmin';

const ID_TOKEN_COOKIE = '__dronetag_idt';
const SESSION_COOKIE = '__dronetag_session';

function readCookie(header: string | null, name: string): string | null {
  if (!header) return null;
  const prefix = `${name}=`;
  for (const part of header.split(';')) {
    const trimmed = part.trim();
    if (trimmed.startsWith(prefix)) {
      return decodeURIComponent(trimmed.slice(prefix.length));
    }
  }
  return null;
}

export function tokenFromRequest(request: Request): string | null {
  const auth = request.headers.get('authorization');
  if (auth?.startsWith('Bearer ')) {
    const t = auth.slice(7).trim();
    if (t) return t;
  }
  const cookie = request.headers.get('cookie');
  return readCookie(cookie, SESSION_COOKIE) ?? readCookie(cookie, ID_TOKEN_COOKIE);
}

export type VerifiedUser = {
  uid: string;
  email?: string;
  admin: boolean;
};

export async function requireUserFromRequest(
  request: Request,
): Promise<VerifiedUser | NextResponse> {
  if (!isFirebaseAdminConfigured()) {
    return NextResponse.json({ error: 'admin sdk not configured' }, { status: 503 });
  }

  const idToken = tokenFromRequest(request);
  if (!idToken) {
    return NextResponse.json({ error: 'missing id token' }, { status: 401 });
  }

  try {
    const decoded = await adminAuth().verifyIdToken(idToken, true);
    return {
      uid: decoded.uid,
      email: decoded.email,
      admin: decoded.admin === true,
    };
  } catch (err) {
    return NextResponse.json(
      { error: 'invalid token', code: (err as { code?: string }).code ?? 'unknown' },
      { status: 401 },
    );
  }
}
