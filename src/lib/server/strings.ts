/** Trim and cap string fields on server-side entity creates. */

export function cleanString(v: unknown, max: number): string {
  if (typeof v !== 'string') return '';
  return v.trim().slice(0, max);
}
