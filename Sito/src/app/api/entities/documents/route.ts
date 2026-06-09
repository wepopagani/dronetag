/**
 * POST /api/entities/documents - create document via Admin SDK.
 */

import { NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/server/firebaseAdmin';
import { enforceQuota, QuotaError } from '@/lib/server/quota';
import { requireUserFromRequest } from '@/lib/server/requestAuth';
import { cleanString } from '@/lib/server/strings';
import { sanitizeAllowedUrl, UrlValidationError } from '@/lib/server/urls';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const KINDS = new Set([
  'insurance_policy',
  'operator_license',
  'drone_registration',
  'training_certificate',
  'identity',
  'other',
]);

const ALLOWED_MIME = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
]);

type Body = {
  kind?: unknown;
  label?: unknown;
  fileUrl?: unknown;
  fileName?: unknown;
  fileSize?: unknown;
  mimeType?: unknown;
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
    return NextResponse.json({ error: 'invalid document kind' }, { status: 400 });
  }

  let fileUrl = '';
  if (body.fileUrl !== undefined && body.fileUrl !== null && String(body.fileUrl).trim()) {
    try {
      fileUrl = sanitizeAllowedUrl(body.fileUrl, 'fileUrl');
    } catch (err) {
      if (err instanceof UrlValidationError) {
        return NextResponse.json({ error: err.message }, { status: 400 });
      }
      throw err;
    }
  }

  const mimeType = cleanString(body.mimeType, 64);
  if (mimeType && !ALLOWED_MIME.has(mimeType)) {
    return NextResponse.json({ error: 'mimeType not allowed' }, { status: 400 });
  }

  const fileSizeRaw = Number(body.fileSize);
  const fileSize =
    Number.isFinite(fileSizeRaw) && fileSizeRaw >= 0
      ? Math.min(fileSizeRaw, 50 * 1024 * 1024)
      : 0;

  try {
    await enforceQuota(auth.uid, 'pdf');
  } catch (err) {
    if (err instanceof QuotaError) {
      return NextResponse.json({ error: err.message, code: 'quota' }, { status: 429 });
    }
    throw err;
  }

  const ref = await adminFirestore().collection('documents').add({
    userId: auth.uid,
    kind,
    label: cleanString(body.label, 200),
    fileUrl,
    fileName: cleanString(body.fileName, 255),
    fileSize,
    mimeType,
    verificationStatus: 'unverified',
    notes: cleanString(body.notes, 4000),
    createdAt: nowIso(),
    updatedAt: nowIso(),
  });

  return NextResponse.json({ id: ref.id });
}
