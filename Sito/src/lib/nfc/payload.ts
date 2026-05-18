/**
 * NFC / QR payload tooling (PR-SEC-4 — architecture only).
 *
 * DroneTag badges encode an NDEF URI record pointing at the public
 * profile page (`/u/<slug>`). The tag itself is not authoritative —
 * the slug must always resolve through `dronesPublic/{slug}`. These
 * helpers therefore stay deliberately simple:
 *
 *   • buildPublicUrl(slug, baseUrl) — canonical public URL for a slug
 *   • validateNfcUrl(url, baseHost) — accepts only the canonical shape
 *   • exportNfcCsv(rows)            — RFC 4180 CSV for an external NFC
 *                                     writer (Zebra, NXP TagWriter, …)
 *
 * Future hardware integration (Zebra, NXP, Sony FeliCa) plugs in as a
 * separate module and consumes `buildPublicUrl()` directly.
 */

import { isValidSlug } from '@/lib/utils/entities';

export interface NfcPayloadRow {
  slug: string;
  url: string;
  /** Optional human label, e.g. drone model — never includes PII. */
  label?: string;
}

/**
 * Returns the canonical public URL for a slug.
 *
 * `baseUrl` is the deployment origin (e.g. `https://dronetag.example`).
 * Trailing slashes are tolerated. The slug is encoded with
 * `encodeURIComponent`, but slugs are constrained to `[a-z0-9-]` by
 * `isValidSlug`, so encoding is a defence-in-depth no-op.
 */
export function buildPublicUrl(slug: string, baseUrl: string): string {
  if (!isValidSlug(slug)) {
    throw new Error(`Invalid slug: ${slug}`);
  }
  const trimmed = baseUrl.replace(/\/+$/, '');
  return `${trimmed}/u/${encodeURIComponent(slug)}`;
}

export interface NfcUrlValidationResult {
  valid: boolean;
  reason?: string;
  slug?: string;
}

/**
 * Validates that `url` is a canonical public profile URL.
 *
 *   • protocol must be https
 *   • host must equal `baseHost` (case-insensitive)
 *   • path must match `/u/<slug>` with a slug-shaped slug
 *
 * Used by the admin batch encoder to reject manually-edited rows
 * before they get written onto a tag.
 */
export function validateNfcUrl(url: string, baseHost: string): NfcUrlValidationResult {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { valid: false, reason: 'invalid_url' };
  }
  if (parsed.protocol !== 'https:') {
    return { valid: false, reason: 'protocol_not_https' };
  }
  if (parsed.host.toLowerCase() !== baseHost.toLowerCase()) {
    return { valid: false, reason: 'unexpected_host' };
  }
  const m = /^\/u\/([^/]+)\/?$/.exec(parsed.pathname);
  if (!m) return { valid: false, reason: 'unexpected_path' };
  const slug = decodeURIComponent(m[1]);
  if (!isValidSlug(slug)) return { valid: false, reason: 'invalid_slug' };
  return { valid: true, slug };
}

function csvEscape(s: string): string {
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/**
 * Builds an RFC 4180 CSV: header row + one data row per payload.
 * Compatible with NXP TagWriter "Batch encode" import and Zebra ZPL
 * data merging.
 */
export function exportNfcCsv(rows: NfcPayloadRow[]): string {
  const header = 'slug,url,label\n';
  if (rows.length === 0) return header;
  const body = rows
    .map((r) => `${csvEscape(r.slug)},${csvEscape(r.url)},${csvEscape(r.label ?? '')}`)
    .join('\n');
  return `${header}${body}\n`;
}
