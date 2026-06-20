/**
 * URL host allowlist for user-supplied file URLs (mirrors functions/src/util.ts).
 */

import { cleanString } from '@/lib/server/strings';

const FIREBASE_STORAGE_HOSTS = [
  'firebasestorage.googleapis.com',
  'storage.googleapis.com',
];

function envTrustedHosts(): string[] {
  return (process.env.TRUSTED_PDF_HOSTS ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter((s) => /^[a-z0-9.-]+$/.test(s));
}

export function allowedFileHosts(): string[] {
  return [...FIREBASE_STORAGE_HOSTS, ...envTrustedHosts()];
}

export class UrlValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UrlValidationError';
  }
}

export function sanitizeAllowedUrl(v: unknown, fieldName: string): string {
  const s = cleanString(v, 2000);
  if (!s) return '';
  let u: URL;
  try {
    u = new URL(s);
  } catch {
    throw new UrlValidationError(`${fieldName} is not a valid URL`);
  }
  if (u.protocol !== 'https:') {
    throw new UrlValidationError(`${fieldName} must use https://`);
  }
  const host = u.hostname.toLowerCase();
  const allow = allowedFileHosts();
  if (!allow.includes(host)) {
    throw new UrlValidationError(
      `${fieldName} host "${host}" is not allowed. Allowed hosts: ${allow.join(', ')}`,
    );
  }
  return s;
}
