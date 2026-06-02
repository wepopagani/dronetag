/**
 * Netlify-compatible admin gate middleware.
 *
 * This mirrors the old `proxy.ts` behaviour, but uses `middleware.ts`
 * naming so the current Netlify Next.js runtime can execute it reliably.
 */

import { NextResponse, type NextRequest } from 'next/server';
import {
  adminAuth,
  isFirebaseAdminConfigured,
} from '@/lib/server/firebaseAdmin';

const SESSION_COOKIE = '__dronetag_session';
const TOKEN_COOKIE = '__dronetag_idt';

function redirectToLogin(req: NextRequest): NextResponse {
  const url = new URL('/login', req.url);
  url.searchParams.set('redirect', req.nextUrl.pathname + req.nextUrl.search);
  return NextResponse.redirect(url);
}

function redirectToAccount(req: NextRequest): NextResponse {
  return NextResponse.redirect(new URL('/account', req.url));
}

export async function middleware(req: NextRequest) {
  if (!req.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  if (!isFirebaseAdminConfigured()) {
    return redirectToLogin(req);
  }

  const token =
    req.cookies.get(SESSION_COOKIE)?.value ||
    req.cookies.get(TOKEN_COOKIE)?.value ||
    '';
  if (!token) {
    return redirectToLogin(req);
  }

  try {
    const decoded = await adminAuth().verifyIdToken(token, true);
    if (decoded.admin !== true) {
      return redirectToAccount(req);
    }
    const res = NextResponse.next();
    res.headers.set('x-dronetag-uid', decoded.uid);
    return res;
  } catch {
    return redirectToLogin(req);
  }
}

export const config = {
  matcher: ['/admin/:path*'],
};
