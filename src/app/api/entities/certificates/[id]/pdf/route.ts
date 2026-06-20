/**
 * POST /api/entities/certificates/[id]/pdf — upload certificate PDF via Admin SDK.
 */

import { NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/server/firebaseAdmin';
import { adminUploadPdf } from '@/lib/server/storage';
import { requireUserFromRequest } from '@/lib/server/requestAuth';
import { sanitizeAllowedUrl } from '@/lib/server/urls';
import { storageErrorResponse } from '@/lib/server/storageErrors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_PDF_SIZE = 20 * 1024 * 1024;

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireUserFromRequest(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await context.params;
  if (!id?.trim()) {
    return NextResponse.json({ error: 'missing certificate id' }, { status: 400 });
  }

  const db = adminFirestore();
  const snap = await db.collection('certificates').doc(id).get();
  if (!snap.exists) {
    return NextResponse.json({ error: 'certificate not found' }, { status: 404 });
  }
  const ownerId = (snap.data() as { userId?: string }).userId;
  if (ownerId !== auth.uid) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: 'invalid form data' }, { status: 400 });
  }

  const raw = form.get('file');
  if (!(raw instanceof Blob)) {
    return NextResponse.json({ error: 'file is required' }, { status: 400 });
  }
  if (raw.type && raw.type !== 'application/pdf') {
    return NextResponse.json({ error: 'only application/pdf is allowed' }, { status: 400 });
  }
  if (raw.size > MAX_PDF_SIZE) {
    return NextResponse.json({ error: 'file exceeds 20 MB limit' }, { status: 400 });
  }

  const buffer = Buffer.from(await raw.arrayBuffer());
  const path = `users/${auth.uid}/certificates/${id}/certificate.pdf`;

  let fileUrl: string;
  try {
    fileUrl = await adminUploadPdf(path, buffer);
    sanitizeAllowedUrl(fileUrl, 'fileUrl');
  } catch (err) {
    return storageErrorResponse(err, 'certificate pdf upload');
  }

  try {
    await db.collection('certificates').doc(id).update({
      fileUrl,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    return storageErrorResponse(err, 'certificate pdf firestore update');
  }

  return NextResponse.json({ fileUrl });
}
