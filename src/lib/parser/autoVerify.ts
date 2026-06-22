import type { Certificate, Insurance, Operator } from '@/lib/types/entities';
import type { UserAccount } from '@/lib/types/account';
import type { ParsedCertificateFields } from '@/lib/certificate/parseCertificatePdf';
import type { ParsedPolicyFields } from '@/lib/insurance/parsePolicyPdf';
import { holderMatchesRegisteredOperator } from '@/lib/parser/holderMatch';
import {
  fieldEquals,
  normalizeCompareString,
  normalizePolicyNumber,
} from '@/lib/parser/normalize';

export type ParserAutoVerifyResult =
  | { autoVerify: true; reason: 'parser_trusted' }
  | { autoVerify: false; reason: string };

function insuranceFieldsMatchStored(parsed: ParsedPolicyFields, stored: Insurance): boolean {
  return (
    fieldEquals(parsed.holderName, stored.holderName)
    && fieldEquals(parsed.provider, stored.provider)
    && normalizePolicyNumber(parsed.policyNumber) === normalizePolicyNumber(stored.policyNumber)
    && fieldEquals(parsed.issueDate, stored.issueDate)
    && fieldEquals(parsed.expiryDate, stored.expiryDate)
  );
}

export function insuranceHasAutoVerifyFields(parsed: ParsedPolicyFields): boolean {
  return Boolean(
    parsed.holderName.trim()
    && parsed.provider.trim()
    && parsed.policyNumber.trim()
    && parsed.issueDate.trim()
    && parsed.expiryDate.trim(),
  );
}

export function evaluateInsuranceAutoVerify(input: {
  parsed: ParsedPolicyFields;
  stored: Insurance;
  operators: Operator[];
  account: UserAccount | null;
  parserTrustedByUser: boolean;
}): ParserAutoVerifyResult {
  const { parsed, stored, operators, account, parserTrustedByUser } = input;

  if (!parserTrustedByUser) {
    return { autoVerify: false, reason: 'user_edited_parser_fields' };
  }
  if (!insuranceHasAutoVerifyFields(parsed)) {
    return { autoVerify: false, reason: 'parser_incomplete' };
  }
  if (!insuranceFieldsMatchStored(parsed, stored)) {
    return { autoVerify: false, reason: 'stored_fields_differ_from_parser' };
  }
  if (!holderMatchesRegisteredOperator(parsed.holderName, operators, account)) {
    return { autoVerify: false, reason: 'holder_not_registered_operator' };
  }

  return { autoVerify: true, reason: 'parser_trusted' };
}

function certificateFieldsMatchStored(parsed: ParsedCertificateFields, stored: Certificate): boolean {
  const kind = parsed.kind ?? stored.kind;
  return (
    kind === stored.kind
    && normalizeCompareString(parsed.registrationNumber) === normalizeCompareString(stored.registrationNumber)
    && fieldEquals(parsed.issuedBy, stored.issuedBy)
    && fieldEquals(parsed.issuedAt, stored.issuedAt)
    && fieldEquals(parsed.expiresAt, stored.expiresAt)
  );
}

export function certificateHasAutoVerifyFields(parsed: ParsedCertificateFields): boolean {
  return Boolean(
    parsed.kind
    && parsed.holderName.trim()
    && parsed.registrationNumber.trim()
    && parsed.issuedAt.trim()
    && parsed.expiresAt.trim(),
  );
}

export function evaluateCertificateAutoVerify(input: {
  parsed: ParsedCertificateFields;
  stored: Certificate;
  operators: Operator[];
  account: UserAccount | null;
  parserTrustedByUser: boolean;
}): ParserAutoVerifyResult {
  const { parsed, stored, operators, account, parserTrustedByUser } = input;

  if (!parserTrustedByUser) {
    return { autoVerify: false, reason: 'user_edited_parser_fields' };
  }
  if (!certificateHasAutoVerifyFields(parsed)) {
    return { autoVerify: false, reason: 'parser_incomplete' };
  }
  if (!certificateFieldsMatchStored(parsed, stored)) {
    return { autoVerify: false, reason: 'stored_fields_differ_from_parser' };
  }
  if (!holderMatchesRegisteredOperator(parsed.holderName, operators, account)) {
    return { autoVerify: false, reason: 'holder_not_registered_operator' };
  }

  return { autoVerify: true, reason: 'parser_trusted' };
}

/** Client-side: user kept all parser-filled key fields unchanged. */
export function insuranceFormMatchesParser(
  form: {
    holderName: string;
    provider: string;
    policyNumber: string;
    issueDate: string;
    expiryDate: string;
  },
  parsed: Pick<
    ParsedPolicyFields,
    'holderName' | 'provider' | 'policyNumber' | 'issueDate' | 'expiryDate' | 'partial'
  > | null,
): boolean {
  if (!parsed || parsed.partial || !insuranceHasAutoVerifyFields(parsed as ParsedPolicyFields)) {
    return false;
  }
  return (
    fieldEquals(form.holderName, parsed.holderName)
    && fieldEquals(form.provider, parsed.provider)
    && normalizePolicyNumber(form.policyNumber) === normalizePolicyNumber(parsed.policyNumber)
    && fieldEquals(form.issueDate, parsed.issueDate)
    && fieldEquals(form.expiryDate, parsed.expiryDate)
  );
}

export function certificateFormMatchesParser(
  form: {
    kind: string;
    registrationNumber: string;
    issuedBy: string;
    issuedAt: string;
    expiresAt: string;
  },
  parsed: Pick<
    ParsedCertificateFields,
    'kind' | 'registrationNumber' | 'issuedBy' | 'issuedAt' | 'expiresAt' | 'partial' | 'holderName'
  > | null,
): boolean {
  if (!parsed || parsed.partial || !parsed.kind || !parsed.holderName.trim()) return false;
  if (!parsed.registrationNumber.trim() || !parsed.issuedAt.trim() || !parsed.expiresAt.trim()) {
    return false;
  }
  return (
    form.kind === parsed.kind
    && fieldEquals(form.registrationNumber, parsed.registrationNumber)
    && fieldEquals(form.issuedBy, parsed.issuedBy)
    && fieldEquals(form.issuedAt, parsed.issuedAt)
    && fieldEquals(form.expiresAt, parsed.expiresAt)
  );
}
