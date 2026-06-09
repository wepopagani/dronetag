/**
 * POST /api/entities/documents/[id]/file — upload document file via Admin SDK.
 */

import { NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/server/firebaseAdmin';
import {
  adminUploadImage,
  adminUploadPdf,
  isAllowedImageContentType,
} from '@/lib/server/storage';
import { storageErrorResponse } from '@/lib/server/storageErrors';
import { requireUserFromRequest } from '@/lib/server/requestAuth';
import { sanitizeAllowedUrl } from '@/lib/server/urls';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE = 20 * 1024 * 1024;

type RouteContext = { params: Promise<{ id: string }> };

function extForContentType(contentType: string): string {
  if (contentType === 'image/png') return 'png';
  if (contentType === 'image/webp') return 'webp';
  if (contentType === 'image/jpeg') return 'jpg';
  return 'pdf';
}

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireUserFromRequest(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await context.params;
  if (!id?.trim()) {
    return NextResponse.json({ error: 'missing document id' }, { status: 400 });
  }

  const db = adminFirestore();
  const snap = await db.collection('documents').doc(id).get();
  if (!snap.exists) {
    return NextResponse.json({ error: 'document not found' }, { status: 404 });
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

  const contentType = raw.type || 'application/octet-stream';
  const isPdf = contentType === 'application/pdf';
  const isImage = isAllowedImageContentType(contentType);
  if (!isPdf && !isImage) {
    return NextResponse.json(
      { error: 'only application/pdf, image/jpeg, image/png or image/webp allowed' },
      { status: 400 },
    );
  }
  if (raw.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'file exceeds 20 MB limit' }, { status: 400 });
  }

  const ext = extForContentType(contentType);
  const buffer = Buffer.from(await raw.arrayBuffer());
  const path = `users/${auth.uid}/documents/${id}/file.${ext}`;

  let fileUrl: string;
  try {
    fileUrl = isPdf
      ? await adminUploadPdf(path, buffer)
      : await adminUploadImage(path, buffer, contentType);
    sanitizeAllowedUrl(fileUrl, 'fileUrl');
  } catch (err) {
    return storageErrorResponse(err, 'document file upload');
  }

  const fileName =
    raw instanceof File && raw.name.trim()
      ? raw.name.trim().slice(0, 255)
      : `file.${ext}`;

  try {
    await db.collection('documents').doc(id).update({
      fileUrl,
      fileName,
      fileSize: raw.size,
      mimeType: contentType,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    return storageErrorResponse(err, 'document file firestore update');
  }

  return NextResponse.json({ fileUrl, fileName, mimeType: contentType, fileSize: raw.size });
}
