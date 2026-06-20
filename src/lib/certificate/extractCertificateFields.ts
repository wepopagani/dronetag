import { extractTextFromPdf } from '@/lib/insurance/extractPdfText';
import { ocrCertificatePdf } from '@/lib/certificate/ocrCertificatePdf';
import {
  parseCertificatePdfText,
  type ParsedCertificateFields,
} from '@/lib/certificate/parseCertificatePdf';

function needsCategoryOcr(text: string, parsed: ParsedCertificateFields): boolean {
  if (parsed.kind) return false;
  if (!/ITA-RP-/i.test(parsed.registrationNumber)) return false;
  return /pilota\s+remoto|remote\s+pilot|competenza\s+di\s+pilota|certificate\s+of\s+competency/i.test(
    text,
  );
}

function mergeParsed(
  base: ParsedCertificateFields,
  extra: ParsedCertificateFields,
): ParsedCertificateFields {
  const merged: ParsedCertificateFields = {
    kind: extra.kind ?? base.kind,
    holderName: base.holderName || extra.holderName,
    issuedBy: base.issuedBy || extra.issuedBy,
    registrationNumber: base.registrationNumber || extra.registrationNumber,
    issuedAt: base.issuedAt || extra.issuedAt,
    expiresAt: base.expiresAt || extra.expiresAt,
    partial: base.partial,
  };

  const hasKey = Boolean(
    (merged.kind || merged.issuedBy) && (merged.registrationNumber || merged.expiresAt),
  );
  merged.partial = !hasKey && Boolean(
    merged.kind || merged.holderName || merged.issuedBy
      || merged.registrationNumber || merged.issuedAt || merged.expiresAt,
  );

  return merged;
}

export async function extractCertificateFields(file: File): Promise<ParsedCertificateFields> {
  const text = await extractTextFromPdf(file);
  let parsed = parseCertificatePdfText(text);

  if (!needsCategoryOcr(text, parsed)) return parsed;

  try {
    const ocrText = await ocrCertificatePdf(file);
    if (!ocrText.trim()) return parsed;
    parsed = mergeParsed(parsed, parseCertificatePdfText(`${text}\n${ocrText}`));
  } catch {
    // OCR is best-effort; structured text fields still apply.
  }

  return parsed;
}
