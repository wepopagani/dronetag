/**
 * URL host allowlist for user-supplied PDF / file URLs (PR-SEC-3).
 *
 * Closes V-019 (and partially V-020): the M2 paste-a-URL flow used to
 * accept any `^https?:\/\/.+$`. After PR-SEC-3, only Firebase-hosted
 * URLs (or hosts explicitly whitelisted via env) are accepted, both
 * client-side at validation time AND server-side inside the create-*
 * Cloud Functions (see `functions/src/util.ts → sanitizeAllowedUrl`).
 *
 * The allowlist is conservative on purpose:
 *
 *   • `firebasestorage.googleapis.com` — the canonical download host.
 *   • `storage.googleapis.com`         — used when the bucket is opened
 *                                        as a regular GCS bucket (signed
 *                                        URLs use this hostname).
 *   • Anything in the `NEXT_PUBLIC_TRUSTED_PDF_HOSTS` CSV — explicit
 *     opt-in for, e.g., a corporate CDN. NEVER a generic catch-all.
 */

const FIREBASE_STORAGE_HOSTS = [
  'firebasestorage.googleapis.com',
  'storage.googleapis.com',
];

function getEnvTrustedHosts(): string[] {
  const raw = process.env.NEXT_PUBLIC_TRUSTED_PDF_HOSTS ?? '';
  return raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter((s) => /^[a-z0-9.-]+$/.test(s)); // hostname-shaped only; no schemes/paths
}

/** All currently-permitted hostnames, lowercased. Stable ordering. */
export function getAllowedFileHosts(): string[] {
  return [...FIREBASE_STORAGE_HOSTS, ...getEnvTrustedHosts()];
}

/**
 * True when `input` is a non-empty https URL whose hostname is on the
 * allowlist. `false` for empty input — callers decide whether empty is
 * allowed (e.g. optional fields).
 */
export function isAllowedFileUrl(input: string): boolean {
  if (!input) return false;
  try {
    const u = new URL(input);
    if (u.protocol !== 'https:') return false;
    const host = u.hostname.toLowerCase();
    return getAllowedFileHosts().includes(host);
  } catch {
    return false;
  }
}

/**
 * Human-readable list of allowed hosts, suitable for inclusion in a
 * validation error message.
 */
export function describeAllowedFileHosts(): string {
  return getAllowedFileHosts().join(', ');
}
