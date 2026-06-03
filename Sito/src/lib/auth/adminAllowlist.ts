/**
 * Super-admin emails (always `/admin` + badge), merged with NEXT_PUBLIC_ADMIN_EMAILS.
 * Demo mode skips this (every logged-in user is treated as admin).
 */

export const SUPER_ADMIN_EMAILS_LOWER = new Set(['info@3dmakes.ch']);

export function parseAdminEmailSet(envCsv: string | undefined): Set<string> {
  const merged = new Set(SUPER_ADMIN_EMAILS_LOWER);
  const raw = envCsv ?? '';
  for (const part of raw.split(',')) {
    const e = part.trim().toLowerCase();
    if (e) merged.add(e);
  }
  return merged;
}
