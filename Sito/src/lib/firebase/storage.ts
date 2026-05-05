import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { awaitFirebaseAuthReady } from '@/lib/firebase/auth';
import { DEMO_MODE, getFirebaseStorage } from '@/lib/firebase/config';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;   // 5 MB
const MAX_PDF_SIZE   = 20 * 1024 * 1024;   // 20 MB

const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
]);
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
  await uploadBytes(storageRef, file);
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

// ─── Typed upload helpers ─────────────────────────────────────────────────────

export function uploadProfilePhoto(pid: string, file: File): Promise<string> {
  validateFile(file, ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE);
  return uploadFile(file, `profiles/${pid}/assets/photo`);
}

export function uploadLogo(pid: string, file: File): Promise<string> {
  validateFile(file, ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE);
  return uploadFile(file, `profiles/${pid}/assets/logo`);
}

export function uploadBanner(pid: string, file: File): Promise<string> {
  validateFile(file, ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE);
  return uploadFile(file, `profiles/${pid}/assets/banner`);
}

export function uploadPolicyPdf(pid: string, file: File): Promise<string> {
  validateFile(file, ALLOWED_PDF_TYPES, MAX_PDF_SIZE);
  const ext = file.name.split('.').pop() || 'pdf';
  return uploadFile(file, `profiles/${pid}/insurance/policy.${ext}`);
}

export function uploadQrImage(pid: string, file: File): Promise<string> {
  validateFile(file, ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE);
  const ext = file.name.split('.').pop() || 'png';
  return uploadFile(file, `profiles/${pid}/assets/qr.${ext}`);
}

export function uploadDocument(pid: string, docId: string, file: File): Promise<string> {
  const allTypes = new Set([...ALLOWED_IMAGE_TYPES, ...ALLOWED_PDF_TYPES]);
  validateFile(file, allTypes, MAX_PDF_SIZE);
  const ext = file.name.split('.').pop() || 'pdf';
  return uploadFile(file, `profiles/${pid}/documents/${docId}.${ext}`);
}

// ─── Bulk delete (used when removing a profile) ─────────────────────────────

const PROFILE_STORAGE_PATHS = [
  'assets/photo', 'assets/logo', 'assets/banner', 'assets/qr',
  'insurance/policy.pdf',
] as const;

export async function deleteProfileFiles(pid: string): Promise<void> {
  if (DEMO_MODE) return;
  await Promise.allSettled(
    PROFILE_STORAGE_PATHS.map((p) => deleteFile(`profiles/${pid}/${p}`)),
  );
}
