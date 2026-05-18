/**
 * Firebase Storage helpers — PR-SEC-1.
 *
 * Closes:
 *   V-012 — uploads are now user-scoped under `users/{uid}/...`. The
 *           uid is provided by the caller (it MUST equal the
 *           authenticated user's uid; storage.rules also enforce
 *           `request.auth.uid == uid` so a malicious caller cannot
 *           upload into someone else's namespace).
 *   V-013 — `image/svg+xml` removed from the allow-list. SVG files
 *           can carry script payloads that execute when opened
 *           directly in a browser tab (storage origin), so we drop
 *           them entirely.
 *   V-014 — sizes capped both client-side (defence in depth) and
 *           server-side via storage.rules.
 *
 * Path layout:
 *   users/{uid}/profiles/{profileId}/photo.{ext}
 *   users/{uid}/profiles/{profileId}/logo.{ext}
 *   users/{uid}/profiles/{profileId}/banner.{ext}
 *   users/{uid}/profiles/{profileId}/insurance/policy.pdf
 *   users/{uid}/profiles/{profileId}/qr.{ext}
 *   users/{uid}/profiles/{profileId}/documents/{docId}.{ext}
 *
 * The `profiles` segment is a sub-namespace under the user's folder for
 * the legacy single-profile model. Future per-drone uploads will live
 * under `users/{uid}/drones/{droneId}/...` and re-use the same helpers.
 */

import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { awaitFirebaseAuthReady } from '@/lib/firebase/auth';
import { DEMO_MODE, getFirebaseStorage } from '@/lib/firebase/config';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;   // 5 MB
const MAX_PDF_SIZE   = 20 * 1024 * 1024;   // 20 MB

// SVG intentionally NOT in the allow-list (V-013).
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_PDF_TYPES = new Set(['application/pdf']);

class UploadValidationError extends Error {
  constructor(message: string) { super(message); this.name = 'UploadValidationError'; }
}

function validateFile(
  file: File,
  allowedTypes: Set<string>,
  maxSize: number,
): void {
  if (!allowedTypes.has(file.type)) {
    throw new UploadValidationError(
      `Invalid file type "${file.type}". Allowed: ${[...allowedTypes].join(', ')}`,
    );
  }
  if (file.size > maxSize) {
    const limitMb = Math.round(maxSize / (1024 * 1024));
    throw new UploadValidationError(
      `File too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum: ${limitMb} MB`,
    );
  }
}

function safeExt(file: File, fallback: string): string {
  const fromName = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (/^[a-z0-9]{1,5}$/.test(fromName)) return fromName;
  return fallback;
}

function userScopedPath(uid: string, suffix: string): string {
  if (!uid || /[/]/.test(uid)) {
    throw new UploadValidationError('Invalid uid for storage path.');
  }
  return `users/${uid}/${suffix}`;
}

// ─── Demo mode: return object URLs instead of Firebase Storage URLs ──────────

async function demoUpload(file: File): Promise<string> {
  await new Promise((r) => setTimeout(r, 300));
  return URL.createObjectURL(file);
}

// ─── Core upload/delete ──────────────────────────────────────────────────────

async function uploadFile(file: File, path: string): Promise<string> {
  if (DEMO_MODE) return demoUpload(file);
  await awaitFirebaseAuthReady();
  const storage = getFirebaseStorage();
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file, { contentType: file.type });
  return getDownloadURL(storageRef);
}

export async function deleteFile(path: string): Promise<void> {
  if (DEMO_MODE) return;
  await awaitFirebaseAuthReady();
  const storage = getFirebaseStorage();
  try {
    await deleteObject(ref(storage, path));
  } catch (e: unknown) {
    const code = typeof e === 'object' && e !== null && 'code' in e ? String((e as { code: unknown }).code) : '';
    if (code === 'storage/object-not-found') return;
    throw e;
  }
}

// ─── Typed upload helpers (V-012: now require the owner uid) ────────────────

export function uploadProfilePhoto(uid: string, profileId: string, file: File): Promise<string> {
  validateFile(file, ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE);
  const ext = safeExt(file, 'jpg');
  return uploadFile(file, userScopedPath(uid, `profiles/${profileId}/photo.${ext}`));
}

export function uploadLogo(uid: string, profileId: string, file: File): Promise<string> {
  validateFile(file, ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE);
  const ext = safeExt(file, 'png');
  return uploadFile(file, userScopedPath(uid, `profiles/${profileId}/logo.${ext}`));
}

export function uploadBanner(uid: string, profileId: string, file: File): Promise<string> {
  validateFile(file, ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE);
  const ext = safeExt(file, 'jpg');
  return uploadFile(file, userScopedPath(uid, `profiles/${profileId}/banner.${ext}`));
}

export function uploadPolicyPdf(uid: string, profileId: string, file: File): Promise<string> {
  validateFile(file, ALLOWED_PDF_TYPES, MAX_PDF_SIZE);
  return uploadFile(file, userScopedPath(uid, `profiles/${profileId}/insurance/policy.pdf`));
}

export function uploadQrImage(uid: string, profileId: string, file: File): Promise<string> {
  validateFile(file, ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE);
  const ext = safeExt(file, 'png');
  return uploadFile(file, userScopedPath(uid, `profiles/${profileId}/qr.${ext}`));
}

export function uploadDocument(uid: string, profileId: string, docId: string, file: File): Promise<string> {
  const allTypes = new Set([...ALLOWED_IMAGE_TYPES, ...ALLOWED_PDF_TYPES]);
  validateFile(file, allTypes, MAX_PDF_SIZE);
  const ext = safeExt(file, 'pdf');
  return uploadFile(file, userScopedPath(uid, `profiles/${profileId}/documents/${docId}.${ext}`));
}

// ─── Bulk delete (used when removing a profile) ─────────────────────────────

const PROFILE_STORAGE_RELATIVE_KEYS = [
  'photo.jpg', 'photo.png', 'photo.webp',
  'logo.png', 'logo.jpg', 'logo.webp',
  'banner.jpg', 'banner.png', 'banner.webp',
  'qr.png', 'qr.jpg', 'qr.webp',
  'insurance/policy.pdf',
] as const;

/**
 * Best-effort delete of all known per-profile assets owned by `uid`. Any
 * `object-not-found` errors are swallowed — we don't know which extension
 * the user picked at upload time, so we attempt every plausible name.
 */
export async function deleteProfileFiles(uid: string, profileId: string): Promise<void> {
  if (DEMO_MODE) return;
  await Promise.allSettled(
    PROFILE_STORAGE_RELATIVE_KEYS.map((rel) =>
      deleteFile(userScopedPath(uid, `profiles/${profileId}/${rel}`)),
    ),
  );
}
