/**
 * POST /api/admin/resync-public-drones
 * Body: { uid: string }
 *
 * Rebuilds `dronesPublic/{slug}` snapshots for all public-active drones
 * owned by `uid`. Admin-only; uses Firebase Admin SDK.
 */

import { NextResponse } from 'next/server';
import { requireAdminFromRequest } from '@/lib/server/adminAuth';
import { resyncUserPublicDronesAdmin } from '@/lib/server/syncPublicDrones';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if (auth instanceof NextResponse) return auth;

  let body: { uid?: string };
  try {
    body = (await request.json()) as { uid?: string };
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  const uid = typeof body.uid === 'string' ? body.uid.trim() : '';
  if (!uid) {
    return NextResponse.json({ error: 'uid required' }, { status: 400 });
  }

  try {
    const written = await resyncUserPublicDronesAdmin(uid);
    return NextResponse.json({ ok: true, written });
  } catch (err) {
    console.error('[admin/resync-public-drones]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'resync failed' },
      { status: 500 },
    );
  }
}
