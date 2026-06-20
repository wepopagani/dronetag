/**
 * /api/session — server companion to AuthContext (PR-SEC-2).
 *
 * POST { idToken: string }: verify the Firebase ID token via firebase-admin
 *   and set an HttpOnly `__dronetag_session` cookie holding the verified
 *   token (1-hour TTL — exactly the lifetime of a Firebase ID token).
 *
 * DELETE: clear the cookie on sign-out.
 *
 * The HttpOnly cookie is what the proxy (proxy.ts) reads to gate
 * /admin/*. Pairing it with the JS-readable __dronetag_idt cookie set
 * directly by AuthContext means the proxy can run with EITHER cookie
 * present — simpler dev story, defence in depth in prod.
 *
 * If FIREBASE_SERVICE_ACCOUNT_KEY is not configured, this route returns
 * 204 with no cookie set; the proxy then falls back to the JS-readable
 * cookie. AuthContext is best-effort here on purpose.
 */

import { NextResponse } from 'next/server';
import {
  adminAuth,
  isFirebaseAdminConfigured,
} from '@/lib/server/firebaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SESSION_COOKIE = '__dronetag_session';
const SESSION_MAX_AGE = 60 * 60; // 1 hour, matching ID token TTL

export async function POST(request: Request) {
  if (!isFirebaseAdminConfigured()) {
    return new NextResponse(null, { status: 204 });
  }

  let body: { idToken?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }
  const idToken = typeof body.idToken === 'string' ? body.idToken : '';
  if (!idToken) {
    return NextResponse.json({ error: 'missing idToken' }, { status: 400 });
  }

  try {
    // checkRevoked=true rejects tokens whose refresh tokens have been
    // revoked — important for grant-admin's revokeRefreshTokens path.
    await adminAuth().verifyIdToken(idToken, true);
  } catch (err) {
    return NextResponse.json(
      { error: 'invalid token', code: (err as { code?: string }).code ?? 'unknown' },
      { status: 401 },
    );
  }

  const res = NextResponse.json({ ok: true });
  const isHttps = new URL(request.url).protocol === 'https:';
  res.cookies.set({
    name: SESSION_COOKIE,
    value: idToken,
    httpOnly: true,
    secure: isHttps,
    sameSite: 'strict',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set({
    name: SESSION_COOKIE,
    value: '',
    httpOnly: true,
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  });
  return res;
}
