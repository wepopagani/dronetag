/**
 * GET /api/files/proxy?url=… — stream an allowlisted Storage PDF same-origin
 * so pdf.js can render it (Safari blocks cross-origin PDF iframes).
 */

import { NextResponse } from 'next/server';
import { requireUserFromRequest } from '@/lib/server/requestAuth';
import { sanitizeAllowedUrl } from '@/lib/server/urls';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_PDF_BYTES = 20 * 1024 * 1024;

function objectPathFromStorageUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const match = u.pathname.match(/\/o\/(.+)$/);
    if (!match?.[1]) return null;
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const auth = await requireUserFromRequest(request);
  if (auth instanceof NextResponse) return auth;

  const rawUrl = new URL(request.url).searchParams.get('url')?.trim() ?? '';
  if (!rawUrl) {
    return NextResponse.json({ error: 'missing url' }, { status: 400 });
  }

  let fileUrl: string;
  try {
    fileUrl = sanitizeAllowedUrl(rawUrl, 'url');
  } catch {
    return NextResponse.json({ error: 'url not allowed' }, { status: 400 });
  }

  const objectPath = objectPathFromStorageUrl(fileUrl);
  if (!objectPath) {
    return NextResponse.json({ error: 'invalid storage url' }, { status: 400 });
  }

  const ownedPrefix = `users/${auth.uid}/`;
  if (!auth.admin && !objectPath.startsWith(ownedPrefix)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(fileUrl, { redirect: 'follow' });
  } catch (err) {
    console.error('[files/proxy] upstream fetch failed', err);
    return NextResponse.json({ error: 'upstream fetch failed' }, { status: 502 });
  }

  if (!upstream.ok) {
    return NextResponse.json(
      { error: `upstream returned ${upstream.status}` },
      { status: upstream.status === 402 ? 503 : 502 },
    );
  }

  const buffer = Buffer.from(await upstream.arrayBuffer());
  if (buffer.byteLength > MAX_PDF_BYTES) {
    return NextResponse.json({ error: 'file too large' }, { status: 413 });
  }

  const contentType = upstream.headers.get('content-type') || 'application/pdf';

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': contentType.includes('pdf') ? contentType : 'application/pdf',
      'Content-Disposition': 'inline',
      'Cache-Control': 'private, max-age=300',
    },
  });
}
