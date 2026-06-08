/**
 * POST /api/entities/certificates - create certificate via Admin SDK.
 */

import { NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/server/firebaseAdmin';
import { enforceQuota, QuotaError } from '@/lib/server/quota';
import { requireUserFromRequest } from '@/lib/server/requestAuth';
import { cleanString } from '@/lib/server/strings';
import { sanitizeAllowedUrl, UrlValidationError } from '@/lib/server/urls';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const KINDS = new Set(['A1_A3', 'A2', 'STS_THEORETICAL', 'STS_01', 'STS_02', 'custom']);

type Body = {
  kind?: unknown;
  label?: unknown;
  issuedBy?: unknown;
  issuedAt?: unknown;
  expiresAt?: unknown;
  fileUrl?: unknown;
  notes?: unknown;
};

function nowIso(): string {
  return new Date().toISOString();
}

export async function POST(request: Request) {
  const auth = await requireUserFromRequest(request);
  if (auth instanceof NextResponse) return auth;

  let body: Body = {};
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  const kind = cleanString(body.kind, 32);
  if (!KINDS.has(kind)) {
    return NextResponse.json({ error: 'invalid certificate kind' }, { status: 400 });
  }

  const label = cleanString(body.label, 200);
  if (kind === 'custom' && !label) {
    return NextResponse.json({ error: 'custom certificate requires a label' }, { status: 400 });
  }

  const issuedAt = cleanString(body.issuedAt, 32);
  const expiresAt = cleanString(body.expiresAt, 32);
  if (issuedAt && expiresAt && expiresAt < issuedAt) {
    return NextResponse.json({ error: 'expiresAt must be on or after issuedAt' }, { status: 400 });
  }

  try {
    await enforceQuota(auth.uid, 'certificate');
  } catch (err) {
    if (err instanceof QuotaError) {
      return NextResponse.json({ error: err.message, code: 'quota' }, { status: 429 });
    }
    throw err;
  }

  let fileUrl = '';
  try {
    fileUrl = sanitizeAllowedUrl(body.fileUrl, 'fileUrl');
  } catch (err) {
    if (err instanceof UrlValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }

  const ref = await adminFirestore().collection('certificates').add({
    userId: auth.uid,
    kind,
    label,
    issuedBy: cleanString(body.issuedBy, 200),
    issuedAt,
    expiresAt,
    fileUrl,
    verificationStatus: 'unverified',
    notes: cleanString(body.notes, 4000),
    createdAt: nowIso(),
    updatedAt: nowIso(),
  });

  return NextResponse.json({ id: ref.id });
}
