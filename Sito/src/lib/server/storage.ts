/**
 * Server-side Firebase Storage uploads (Admin SDK — bypasses client rules).
 */

import { randomUUID } from 'node:crypto';
import { getStorage } from 'firebase-admin/storage';
import { getFirebaseAdmin } from '@/lib/server/firebaseAdmin';

function storageBucketName(): string | undefined {
  return process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim() || undefined;
}

export function adminStorageBucket() {
  const storage = getStorage(getFirebaseAdmin());
  const name = storageBucketName();
  return name ? storage.bucket(name) : storage.bucket();
}

/** Upload a PDF and return a persistent Firebase download URL. */
export async function adminUploadPdf(path: string, data: Buffer): Promise<string> {
  return adminUploadFile(path, data, 'application/pdf');
}

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export function isAllowedImageContentType(contentType: string): boolean {
  return ALLOWED_IMAGE_TYPES.has(contentType);
}

/** Upload an image and return a persistent Firebase download URL. */
export async function adminUploadImage(path: string, data: Buffer, contentType: string): Promise<string> {
  if (!isAllowedImageContentType(contentType)) {
    throw new Error(`unsupported image type: ${contentType}`);
  }
  return adminUploadFile(path, data, contentType);
}

async function adminUploadFile(path: string, data: Buffer, contentType: string): Promise<string> {
  const bucket = adminStorageBucket();
  const token = randomUUID();
  const file = bucket.file(path);
  await file.save(data, {
    resumable: false,
    metadata: {
      contentType,
      metadata: { firebaseStorageDownloadTokens: token },
    },
  });
  const encoded = encodeURIComponent(path);
  return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encoded}?alt=media&token=${token}`;
}
