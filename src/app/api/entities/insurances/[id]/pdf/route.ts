/**
 * POST /api/entities/insurances/[id]/pdf — upload policy PDF via Admin SDK.
 */

import { NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/server/firebaseAdmin';
import { adminUploadPdf } from '@/lib/server/storage';
import { requireUserFromRequest } from '@/lib/server/requestAuth';
import { sanitizeAllowedUrl } from '@/lib/server/urls';
import { storageErrorResponse } from '@/lib/server/storageErrors';
import {
  insuranceFromFirestore,
  resolveInsuranceVerificationAfterPdfUpload,
} from '@/lib/server/parserAutoVerify';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_PDF_SIZE = 20 * 1024 * 1024;

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireUserFromRequest(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await context.params;
  if (!id?.trim()) {
    return NextResponse.json({ error: 'missing insurance id' }, { status: 400 });
  }

  const db = adminFirestore();
  const snap = await db.collection('insurances').doc(id).get();
  if (!snap.exists) {
    return NextResponse.json({ error: 'insurance not found' }, { status: 404 });
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
  const parserTrustedByUser = form.get('parserTrusted') === '1';
  if (raw.type && raw.type !== 'application/pdf') {
    return NextResponse.json({ error: 'only application/pdf is allowed' }, { status: 400 });
  }
  if (raw.size > MAX_PDF_SIZE) {
    return NextResponse.json({ error: 'file exceeds 20 MB limit' }, { status: 400 });
  }

  const buffer = Buffer.from(await raw.arrayBuffer());
  const path = `users/${auth.uid}/insurances/${id}/policy.pdf`;

  let pdfUrl: string;
  try {
    pdfUrl = await adminUploadPdf(path, buffer);
    sanitizeAllowedUrl(pdfUrl, 'pdfUrl');
  } catch (err) {
    return storageErrorResponse(err, 'insurance pdf upload');
  }

  let verificationStatus = insuranceFromFirestore(id, snap.data() as Record<string, unknown>).verificationStatus;
  try {
    const insurance = insuranceFromFirestore(id, snap.data() as Record<string, unknown>);
    verificationStatus = await resolveInsuranceVerificationAfterPdfUpload({
      pdfBuffer: buffer,
      insurance,
      parserTrustedByUser,
    });
  } catch (err) {
    console.warn('[insurance/pdf] parser auto-verify skipped', err);
  }

  try {
    await db.collection('insurances').doc(id).update({
      pdfUrl,
      verificationStatus,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    return storageErrorResponse(err, 'insurance pdf firestore update');
  }

  return NextResponse.json({ pdfUrl, verificationStatus });
}
