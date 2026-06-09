/**
 * POST /api/account/branding — upload profile photo, logo or banner via Admin SDK.
 */

import { NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/server/firebaseAdmin';
import { adminUploadImage, isAllowedImageContentType } from '@/lib/server/storage';
import { requireUserFromRequest } from '@/lib/server/requestAuth';
import { sanitizeAllowedUrl } from '@/lib/server/urls';
import { storageErrorResponse } from '@/lib/server/storageErrors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const BRANDING_KINDS = new Set(['photo', 'logo', 'banner']);

const BRANDING_FIELD: Record<'photo' | 'logo' | 'banner', string> = {
  photo: 'profilePhotoUrl',
  logo: 'logoUrl',
  banner: 'bannerUrl',
};

function extForContentType(contentType: string): string {
  if (contentType === 'image/png') return 'png';
  if (contentType === 'image/webp') return 'webp';
  return 'jpg';
}

export async function POST(request: Request) {
  const auth = await requireUserFromRequest(request);
  if (auth instanceof NextResponse) return auth;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: 'invalid form data' }, { status: 400 });
  }

  const kindRaw = form.get('kind');
  const kind = typeof kindRaw === 'string' ? kindRaw.trim() : '';
  if (!BRANDING_KINDS.has(kind)) {
    return NextResponse.json({ error: 'invalid branding kind' }, { status: 400 });
  }

  const raw = form.get('file');
  if (!(raw instanceof Blob)) {
    return NextResponse.json({ error: 'file is required' }, { status: 400 });
  }

  const contentType = raw.type || 'application/octet-stream';
  if (!isAllowedImageContentType(contentType)) {
    return NextResponse.json({ error: 'only image/jpeg, image/png or image/webp allowed' }, { status: 400 });
  }
  if (raw.size > MAX_IMAGE_SIZE) {
    return NextResponse.json({ error: 'file exceeds 5 MB limit' }, { status: 400 });
  }

  const ext = extForContentType(contentType);
  const buffer = Buffer.from(await raw.arrayBuffer());
  const path = `users/${auth.uid}/profiles/account/${kind}.${ext}`;

  let url: string;
  try {
    url = await adminUploadImage(path, buffer, contentType);
    sanitizeAllowedUrl(url, `${kind}Url`);
  } catch (err) {
    return storageErrorResponse(err, 'branding upload');
  }

  try {
    const field = BRANDING_FIELD[kind as keyof typeof BRANDING_FIELD];
    await adminFirestore().collection('users').doc(auth.uid).update({
      [field]: url,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    return storageErrorResponse(err, 'branding firestore update');
  }

  return NextResponse.json({ kind, url });
}
