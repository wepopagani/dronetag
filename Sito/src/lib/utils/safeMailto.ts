/**
 * Strict mailto link builder (PR-SEC-3 V-021).
 *
 * The risk: `<a href={`mailto:${user.contactEmail}`}>` lets a hostile
 * input inject `?subject=...&body=...&cc=...` query parameters. The
 * server-side validator (`functions/src/util.ts asEmail`) and the
 * client-side regex below both reject anything that doesn't match a
 * conservative email pattern, so by the time we're rendering the link
 * the value is known to be `<local>@<domain>` only.
 *
 * The regex is intentionally narrower than RFC 5322 — we trade a tiny
 * fraction of exotic but valid emails for safety. If a real user ever
 * has `(weird)+example@host`-style addresses, this is the place to
 * relax the regex.
 */

const STRICT_EMAIL_RX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export function isStrictEmail(value: string | null | undefined): value is string {
  if (typeof value !== 'string') return false;
  const t = value.trim();
  if (t.length === 0 || t.length > 320) return false;
  return STRICT_EMAIL_RX.test(t);
}

/**
 * Returns `mailto:<email>` if `value` matches the strict regex, else
 * `null`. Callers should render the `<a>` only when the result is
 * truthy.
 */
export function safeMailto(value: string | null | undefined): string | null {
  if (!isStrictEmail(value)) return null;
  return `mailto:${value.trim()}`;
}
