/**
 * /api/health — operational readiness probe (PR-SEC-4).
 *
 * Returns 200 when the deployment is live and minimally functional:
 *   • Build metadata (version / commit / environment)
 *   • Firebase Admin configuration status
 *   • App Check / CSP enforcement toggles
 *
 * It does NOT expose secrets — the response is safe to scrape from
 * uptime monitors. Callers that need a richer status payload can
 * authenticate as admin and read the `/admin` overview, which
 * includes the same fields plus per-collection counts.
 */

import { NextResponse } from 'next/server';
import { getBuildInfo } from '@/lib/server/buildInfo';
import { isFirebaseAdminConfigured } from '@/lib/server/firebaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const build = getBuildInfo();
  const firebaseConfigured = isFirebaseAdminConfigured();
  const appCheckEnforce = (process.env.APP_CHECK_ENFORCE ?? 'true').toLowerCase() === 'true';
  const cspEnforce = process.env.CSP_ENFORCE === 'true';
  const cspMode = cspEnforce ? 'enforce' : 'disabled';

  const status = firebaseConfigured ? 'ok' : 'degraded';

  return NextResponse.json(
    {
      status,
      build,
      firebase: {
        adminConfigured: firebaseConfigured,
      },
      security: {
        appCheckEnforce,
        cspMode,
      },
      now: new Date().toISOString(),
    },
    { status: status === 'ok' ? 200 : 503 },
  );
}
