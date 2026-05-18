/**
 * Next.js 16 Proxy — formerly known as middleware (V-029 closure).
 *
 * Runs on the Node.js runtime (Next 16 default for proxy) so it can use
 * `firebase-admin` directly to verify Firebase ID tokens. This rejects
 * non-admin traffic to `/admin/*` BEFORE any React component renders;
 * client-side gating in `AdminLayout` becomes a defence-in-depth layer
 * rather than the primary boundary.
 *
 * Cookie precedence:
 *   1. `__dronetag_session` — HttpOnly, set by /api/session after
 *      server-side verification. Preferred.
 *   2. `__dronetag_idt` — JS-readable mirror set by AuthContext.
 *      Used when /api/session is not configured (no service account).
 *
 * If `firebase-admin` is not configured at all (no service-account env),
 * the proxy fails CLOSED for `/admin/*` — better safe than sorry.
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

export async function proxy(req: NextRequest) {
  // Only gate /admin/*. Other paths fall through.
  if (!req.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  // Fail closed if Admin SDK isn't configured at all — refusing
  // service is safer than letting clients walk into /admin and rely
  // on Firestore rules to bounce their queries.
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
    // Optional: stash the verified uid on a request header so server
    // components can read it without re-verifying. Edge proxies must use
    // headers; Node-runtime proxy does too.
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
