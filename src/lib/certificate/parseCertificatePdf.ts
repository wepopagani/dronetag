/**
 * Heuristic parser for Italian / EU drone pilot certificate PDFs (ENAC, etc.).
 */

import type { CertificateKind } from '@/lib/types/entities';

export interface ParsedCertificateFields {
  kind: CertificateKind | null;
  holderName: string;
  issuedBy: string;
  registrationNumber: string;
  issuedAt: string;
  expiresAt: string;
  partial: boolean;
}

function normalizePdfText(text: string): string {
  return text
    .replace(/[\u2010-\u2015\u2212\u00ad]/g, '-')
    .replace(/[\u200b-\u200d\ufeff]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function toIsoDate(day: string, month: string, year: string): string {
  let y = year;
  if (y.length === 2) y = `20${y}`;
  return `${y}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

function parseDateToken(token: string): string | null {
  const m = token.match(/^(\d{1,2})[./\-](\d{1,2})[./\-](\d{2,4})$/);
  if (!m) return null;
  return toIsoDate(m[1], m[2], m[3]);
}

const HOLDER_STOPWORDS = new Set([
  'e', 'ed', 'di', 'il', 'la', 'lo', 'del', 'della', 'dei', 'degli', 'un', 'una',
  'nome', 'cognome', 'name', 'surname', 'training', 'coordinator', 'scenario',
  'standard', 'sts', 'remoto', 'pilota', 'attestato', 'certificato', 'pratico',
  'teorico', 'enac', 'easa', 'open', 'category', 'categoria', 'sottocategoria',
]);

function isPlausibleNamePart(part: string): boolean {
  const value = part.trim();
  if (value.length < 2) return false;
  if (HOLDER_STOPWORDS.has(value.toLowerCase())) return false;
  if (/^(ita|sts|enac|easa|rp\d)/i.test(value)) return false;
  return /^[A-Za-zÀ-ÖØ-öø-ÿ'`-]+$/.test(value);
}

function isPlausibleHolderName(name: string): boolean {
  const normalized = name.trim().replace(/\s+/g, ' ');
  if (normalized.length < 5) return false;
  if (
    /training|coordinator|scenario|standard|sts[\s-]*0|enac|easa|ministero|attestato|certificato|pilota\s+remoto|remote\s+pilot|numero\s+di\s+registrazione|identification\s+number/i.test(
      normalized,
    )
  ) {
    return false;
  }

  const parts = normalized.split(/\s+/);
  if (parts.some((part) => HOLDER_STOPWORDS.has(part.toLowerCase()))) return false;

  const nameParts = parts.filter(isPlausibleNamePart);
  return nameParts.length >= 2;
}

function kindFromRegistration(registrationNumber: string): CertificateKind | null {
  if (/ITA-STS-?02/i.test(registrationNumber)) return 'STS_02';
  if (/ITA-STS-?01/i.test(registrationNumber)) return 'STS_01';
  return null;
}

function hasA2Category(text: string): boolean {
  return /\bA2\s+OPEN(?:\s+SUB\s+CATEGORY)?\b|\bA2\s+OPEN\s+SUB\b|categoria\s+A2|sottocategoria\s+A2|\bA2\b(?=\s*(?:OPEN|SUB|$))/i.test(
    text,
  );
}

function hasA1A3Category(text: string): boolean {
  return (
    /\bA1\s*\/\s*A3\b|A1\/A3\s+OPEN|A1\s*\/\s*A3\s+OPEN\s+SUB\s+CATEGORY|open\s+sub\s+category.*A1/i.test(
      text,
    )
    || (/pilota\s+remoto|remote\s+pilot\s+certificate|competenza\s+di\s+pilota/i.test(text)
      && /A1\s*\/\s*A3/i.test(text))
  );
}

function extractKind(text: string, registrationNumber = ''): CertificateKind | null {
  if (/STS[\s-]*02|scenario\s+standard[\s-]*02|sts\s*0*2\b/i.test(text)) return 'STS_02';
  if (/STS[\s-]*01|scenario\s+standard[\s-]*01|sts\s*0*1\b/i.test(text)) return 'STS_01';
  if (/STS.*teoric|scenario\s+standard.*teoric|sts\s+teoric/i.test(text)) return 'STS_THEORETICAL';
  // A2 implies A1/A3 — pick the highest open category shown on the certificate.
  if (hasA2Category(text)) return 'A2';
  if (hasA1A3Category(text)) return 'A1_A3';
  return kindFromRegistration(registrationNumber);
}

function extractHolderName(text: string): string {
  const firstMatch = text.match(
    /\bnome\s*(?:\([^)]*\))?\s*[:.]?\s*(?:\([^)]*\)\s*)?([A-Za-zÀ-ÖØ-öø-ÿ'`-]+)/i,
  );
  const lastMatch = text.match(
    /\bcognome\s*(?:\([^)]*\))?\s*[:.]?\s*(?:\([^)]*\)\s*)?([A-Za-zÀ-ÖØ-öø-ÿ'`-]+)/i,
  );
  if (firstMatch?.[1] && lastMatch?.[1]) {
    const full = `${firstMatch[1].trim()} ${lastMatch[1].trim()}`;
    if (isPlausibleHolderName(full)) return full;
  }

  const nomeCognome = text.match(
    /\bnome\s*(?:\([^)]*\))?\s*[:.]?\s*([A-Za-zÀ-ÖØ-öø-ÿ'`-]+)\s+cognome\s*(?:\([^)]*\))?\s*[:.]?\s*([A-Za-zÀ-ÖØ-öø-ÿ'`-]+)/i,
  );
  if (nomeCognome?.[1] && nomeCognome?.[2]) {
    const first = nomeCognome[1].trim();
    const last = nomeCognome[2].trim();
    const full = `${first} ${last}`;
    if (isPlausibleHolderName(full)) return full;
  }

  const patterns = [
    /rilasciato\s+a\s*[:.]?\s*(.+?)(?=\s+enac\b|\s+easa\b|\s+codice\s+fiscale|\s+data\s+di\s+nascita|\s+data\s+di\s+rilascio|\s+numero\s+di\s+registrazione|$)/i,
    /(?:titolar[eo]|nominativ[oa])\s*[:.]?\s*(.+?)(?=\s+codice\s+fiscale|\s+data\s+di\s+nascita|\s+rilasciat|\s+enac\b|$)/i,
  ];
  for (const rx of patterns) {
    const m = text.match(rx);
    if (!m?.[1]) continue;
    const name = m[1].trim().replace(/\s+/g, ' ');
    if (isPlausibleHolderName(name)) return name;
  }
  return '';
}

function extractIssuedBy(text: string, registrationNumber = ''): string {
  const upper = text.toUpperCase();
  if (upper.includes('ENAC')) return 'ENAC';
  if (upper.includes('EASA')) return 'EASA';
  if (/ITA-RP-/i.test(registrationNumber) && isItalianCertificate(text)) return 'ENAC';

  const org = text.match(
    /(?:rilasciato\s+da|emesso\s+da|ente\s+di\s+formazione|organismo)\s*[:.]?\s*(.+?)(?=\s+data|\s+numero|\s+certificat|$)/i,
  );
  if (org?.[1]) {
    const v = org[1].trim().replace(/\s+/g, ' ');
    if (v.length >= 2 && v.length <= 120 && !/training|coordinator/i.test(v)) return v;
  }
  return '';
}

function isItalianCertificate(text: string): boolean {
  return /\benac\b|numero\s+di\s+registrazione|data\s+di\s+scadenza|certificato|pilota\s+remoto|nome\s|cognome|rilasciato|scadenza/i.test(
    text,
  );
}

function cleanItaCode(code: string): string {
  return code.replace(/-+/g, '-').replace(/-$/, '').trim();
}

function normalizeSpacedItaMatch(raw: string): string {
  return cleanItaCode(raw.replace(/\s+/g, ''));
}

/**
 * Italian ENAC certificates: find "ITA-…" and capture the full registration
 * code (e.g. ITA-RP-000000522aba). Stops at whitespace before normal words.
 */
function scanItaRegistration(text: string): string {
  const source = text
    .replace(/[\u2010-\u2015\u2212\u00ad]/g, '-')
    .replace(/[\u200b-\u200d\ufeff]/g, '');

  const regexes = [
    /\bITA-RP-\d{6}[0-9a-f]{6}\b/i,
    /ITA-RP-\s*\d{6}[0-9a-f]{6}/i,
    /\bITA-STS-?\d{2}-\d{6,12}\b/i,
    /I\s+T\s+A(?:\s*-\s*|\s+)R\s+P(?:\s*-\s*|\s+)(?:\d\s*){6}[0-9a-f\s]{6}/i,
  ];

  for (const rx of regexes) {
    const match = source.match(rx);
    if (!match?.[0]) continue;
    const code = normalizeSpacedItaMatch(match[0]);
    if (code.length >= 10) return code;
  }

  const compact = source.replace(/\s+/g, '');
  const glued = compact.match(/ITARP\d{6}[0-9a-f]{6}/i);
  if (glued?.[0]) return cleanItaCode(glued[0].replace(/^ITARP/i, 'ITA-RP-'));

  const idx = source.search(/ITA-/i);
  if (idx < 0) return '';

  let code = '';
  for (let i = idx; i < source.length; i += 1) {
    const ch = source[i];
    if (/[A-Za-z0-9-]/.test(ch)) {
      code += ch;
      continue;
    }
    if (/\s/.test(ch)) {
      const rest = source.slice(i).replace(/^\s+/, '');
      // PDF line breaks often split digits from the ITA-RP- prefix.
      if (/^[\d-]/.test(rest)) continue;
      break;
    }
    break;
  }

  code = cleanItaCode(code);
  return code.length >= 10 && /^ITA-/i.test(code) ? code : '';
}

function extractRegistrationNumber(text: string): string {
  if (!isItalianCertificate(text)) return '';
  return scanItaRegistration(text);
}

function extractDateRange(text: string): { issuedAt: string; expiresAt: string } {
  const rangePatterns = [
    /data\s+di\s+emissione(?:\s*\([^)]+\))?\s*[:.]?\s*(\d{1,2}[./\-]\d{1,2}[./\-]\d{2,4}).*?data\s+di\s+scadenza(?:\s*\([^)]+\))?\s*[:.]?\s*(\d{1,2}[./\-]\d{1,2}[./\-]\d{2,4})/i,
    /data\s+di\s+rilascio\s*[:.]?\s*(\d{1,2}[./\-]\d{1,2}[./\-]\d{2,4}).*?data\s+di\s+scadenza(?:\s*\([^)]+\))?\s*[:.]?\s*(\d{1,2}[./\-]\d{1,2}[./\-]\d{2,4})/i,
    /date\s+of\s+issue\s*[:.]?\s*(\d{1,2}[./\-]\d{1,2}[./\-]\d{2,4}).*?date\s+of\s+expiry\s*[:.]?\s*(\d{1,2}[./\-]\d{1,2}[./\-]\d{2,4})/i,
    /(\d{1,2}[./\-]\d{1,2}[./\-]\d{2,4})\s*[-–]\s*(\d{1,2}[./\-]\d{1,2}[./\-]\d{2,4})/,
  ];

  for (const rx of rangePatterns) {
    const m = text.match(rx);
    if (m?.[1] && m?.[2]) {
      const issuedAt = parseDateToken(m[1]);
      const expiresAt = parseDateToken(m[2]);
      if (issuedAt && expiresAt) return { issuedAt, expiresAt };
    }
  }

  const issuePatterns = [
    /(?:data\s+di\s+(?:emissione|rilascio)|date\s+of\s+issue|rilasciato|emesso)\s*(?:\([^)]*\))?\s*(?:il\s+)?[:.]?\s*(\d{1,2}[./\-]\d{1,2}[./\-]\d{2,4})/i,
  ];
  const expiryPatterns = [
    /(?:data\s+di\s+scadenza|date\s+of\s+expiry|scade\s+il|valido\s+fino\s+al)\s*(?:\([^)]*\))?\s*[:.]?\s*(\d{1,2}[./\-]\d{1,2}[./\-]\d{2,4})/i,
  ];

  let issuedAt = '';
  let expiresAt = '';

  const expiryIdx = text.search(/data\s+di\s+scadenza|date\s+of\s+expiry/i);
  if (expiryIdx >= 0) {
    const window = text.slice(expiryIdx, expiryIdx + 120);
    const dm = window.match(/(\d{1,2}[./\-]\d{1,2}[./\-]\d{2,4})/);
    if (dm?.[1]) expiresAt = parseDateToken(dm[1]) ?? '';
  }

  for (const rx of issuePatterns) {
    const m = text.match(rx);
    if (m?.[1]) {
      issuedAt = parseDateToken(m[1]) ?? '';
      if (issuedAt) break;
    }
  }
  for (const rx of expiryPatterns) {
    if (expiresAt) break;
    const m = text.match(rx);
    if (m?.[1]) {
      expiresAt = parseDateToken(m[1]) ?? '';
      if (expiresAt) break;
    }
  }

  return { issuedAt, expiresAt };
}

export function parseCertificatePdfText(text: string): ParsedCertificateFields {
  const raw = text
    .replace(/[\u2010-\u2015\u2212\u00ad]/g, '-')
    .replace(/[\u200b-\u200d\ufeff]/g, '');
  const normalized = normalizePdfText(text);
  const flat = normalizePdfText(text.replace(/\n/g, ' '));
  // Italian certs: scan for ITA-… registration code (raw lines + normalized).
  const italian = isItalianCertificate(flat) || isItalianCertificate(raw);
  const registrationNumber = italian
    ? (scanItaRegistration(raw) || scanItaRegistration(normalized) || scanItaRegistration(flat))
    : '';
  const issuedBy = extractIssuedBy(flat, registrationNumber);
  const kind = extractKind(flat, registrationNumber);
  const holderName = extractHolderName(flat);
  const { issuedAt, expiresAt } = extractDateRange(flat);

  const extracted = [kind, holderName, issuedBy, registrationNumber, issuedAt, expiresAt].filter(Boolean);
  const hasKey = Boolean((kind || issuedBy) && (registrationNumber || expiresAt));

  return {
    kind,
    holderName,
    issuedBy,
    registrationNumber,
    issuedAt,
    expiresAt,
    partial: extracted.length > 0 && !hasKey,
  };
}
