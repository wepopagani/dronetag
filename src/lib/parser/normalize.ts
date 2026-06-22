/** Normalize strings for parser ↔ form ↔ stored-field comparison. */
export function normalizeCompareString(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/[.'`,]/g, '');
}

export function normalizePolicyNumber(value: string): string {
  return value.trim().toUpperCase().replace(/\s+/g, '');
}

export function normalizePersonName(value: string): string {
  return normalizeCompareString(value);
}

/** True when two person/company names refer to the same holder (token order tolerant). */
export function namesMatch(a: string, b: string): boolean {
  const left = normalizePersonName(a);
  const right = normalizePersonName(b);
  if (!left || !right) return false;
  if (left === right) return true;
  if (left.includes(right) || right.includes(left)) return true;
  const sortTokens = (s: string) => s.split(' ').filter(Boolean).sort().join(' ');
  return sortTokens(left) === sortTokens(right);
}

export function fieldEquals(a: string, b: string): boolean {
  return normalizeCompareString(a) === normalizeCompareString(b);
}
