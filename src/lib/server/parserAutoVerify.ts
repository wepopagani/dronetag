import { adminFirestore } from '@/lib/server/firebaseAdmin';
import { extractTextFromPdfBuffer } from '@/lib/insurance/extractPdfText';
import { parsePolicyPdfText } from '@/lib/insurance/parsePolicyPdf';
import { parseCertificatePdfText } from '@/lib/certificate/parseCertificatePdf';
import {
  evaluateCertificateAutoVerify,
  evaluateInsuranceAutoVerify,
} from '@/lib/parser/autoVerify';
import type { Certificate, Insurance, Operator } from '@/lib/types/entities';
import {
  EMPTY_OPERATOR_COMPANY,
  EMPTY_OPERATOR_PRIVATE,
  type OperatorKind,
} from '@/lib/types/entities';
import type { UserAccount } from '@/lib/types/account';
import type { VerificationStatus } from '@/lib/types';

function operatorFromRaw(id: string, raw: Record<string, unknown>): Operator {
  const str = (k: string) => (typeof raw[k] === 'string' ? (raw[k] as string) : '');
  const bool = (k: string) => raw[k] === true;
  const kindRaw = str('kind');
  const kind: OperatorKind = kindRaw === 'company' ? 'company' : 'private';
  const priv = (raw.private ?? {}) as Record<string, unknown>;
  const comp = (raw.company ?? {}) as Record<string, unknown>;
  return {
    id,
    userId: str('userId'),
    kind,
    label: str('label'),
    isDefault: bool('isDefault'),
    private: { ...EMPTY_OPERATOR_PRIVATE, ...priv } as Operator['private'],
    company: { ...EMPTY_OPERATOR_COMPANY, ...comp } as Operator['company'],
    createdAt: str('createdAt'),
    updatedAt: str('updatedAt'),
  };
}

function accountFromRaw(uid: string, raw: Record<string, unknown>): UserAccount {
  const str = (k: string) => (typeof raw[k] === 'string' ? (raw[k] as string) : '');
  const address = (raw.address as Record<string, unknown> | undefined) ?? {};
  return {
    uid,
    email: str('email'),
    accountType: (str('accountType') || 'private') as UserAccount['accountType'],
    firstName: str('firstName'),
    lastName: str('lastName'),
    dateOfBirth: str('dateOfBirth'),
    phone: str('phone'),
    address: {
      line1: typeof address.line1 === 'string' ? address.line1 : '',
      line2: typeof address.line2 === 'string' ? address.line2 : '',
      city: typeof address.city === 'string' ? address.city : '',
      postalCode: typeof address.postalCode === 'string' ? address.postalCode : '',
      country: typeof address.country === 'string' ? address.country : '',
    },
    companyName: str('companyName'),
    companyContactPerson: str('companyContactPerson'),
    companyVat: str('companyVat'),
    companyUniqueNumber: str('companyUniqueNumber'),
    profilePhotoUrl: str('profilePhotoUrl'),
    logoUrl: str('logoUrl'),
    bannerUrl: str('bannerUrl'),
    createdAt: str('createdAt'),
    updatedAt: str('updatedAt'),
  };
}

async function loadOperatorContext(userId: string): Promise<{
  operators: Operator[];
  account: UserAccount | null;
}> {
  const db = adminFirestore();
  const [operatorSnap, accountSnap] = await Promise.all([
    db.collection('operators').where('userId', '==', userId).get(),
    db.collection('users').doc(userId).get(),
  ]);

  const operators = operatorSnap.docs.map((doc) =>
    operatorFromRaw(doc.id, doc.data() as Record<string, unknown>),
  );
  const account = accountSnap.exists
    ? accountFromRaw(userId, accountSnap.data() as Record<string, unknown>)
    : null;

  return { operators, account };
}

export async function resolveInsuranceVerificationAfterPdfUpload(input: {
  pdfBuffer: Buffer;
  insurance: Insurance;
  parserTrustedByUser: boolean;
}): Promise<VerificationStatus> {
  const text = await extractTextFromPdfBuffer(new Uint8Array(input.pdfBuffer));
  const parsed = parsePolicyPdfText(text);
  const { operators, account } = await loadOperatorContext(input.insurance.userId);
  const decision = evaluateInsuranceAutoVerify({
    parsed,
    stored: input.insurance,
    operators,
    account,
    parserTrustedByUser: input.parserTrustedByUser,
  });

  return decision.autoVerify ? 'verified' : 'unverified';
}

export async function resolveCertificateVerificationAfterPdfUpload(input: {
  pdfBuffer: Buffer;
  certificate: Certificate;
  parserTrustedByUser: boolean;
}): Promise<VerificationStatus> {
  const text = await extractTextFromPdfBuffer(new Uint8Array(input.pdfBuffer));
  const parsed = parseCertificatePdfText(text);
  const { operators, account } = await loadOperatorContext(input.certificate.userId);
  const decision = evaluateCertificateAutoVerify({
    parsed,
    stored: input.certificate,
    operators,
    account,
    parserTrustedByUser: input.parserTrustedByUser,
  });

  return decision.autoVerify ? 'verified' : 'unverified';
}

export function insuranceFromFirestore(id: string, raw: Record<string, unknown>): Insurance {
  const str = (k: string) => (typeof raw[k] === 'string' ? (raw[k] as string) : '');
  const optStr = (k: string) => (typeof raw[k] === 'string' ? (raw[k] as string) : null);
  return {
    id,
    userId: str('userId'),
    link: (str('link') || 'drone') as Insurance['link'],
    droneId: optStr('droneId'),
    operatorId: optStr('operatorId'),
    provider: str('provider'),
    policyNumber: str('policyNumber'),
    holderName: str('holderName'),
    issueDate: str('issueDate'),
    expiryDate: str('expiryDate'),
    notes: str('notes'),
    pdfUrl: str('pdfUrl'),
    verificationStatus: (str('verificationStatus') || 'unverified') as VerificationStatus,
    createdAt: str('createdAt'),
    updatedAt: str('updatedAt'),
    dataLockedAt: str('dataLockedAt'),
  };
}

export function certificateFromFirestore(id: string, raw: Record<string, unknown>): Certificate {
  const str = (k: string) => (typeof raw[k] === 'string' ? (raw[k] as string) : '');
  const label = str('label');
  const registrationNumber = str('registrationNumber')
    || (label && !/training|coordinator|first and last/i.test(label) && /[0-9]/.test(label) ? label : '');
  return {
    id,
    userId: str('userId'),
    kind: (str('kind') || 'custom') as Certificate['kind'],
    label,
    registrationNumber,
    issuedBy: str('issuedBy'),
    issuedAt: str('issuedAt'),
    expiresAt: str('expiresAt'),
    fileUrl: str('fileUrl'),
    verificationStatus: (str('verificationStatus') || 'unverified') as VerificationStatus,
    notes: str('notes'),
    createdAt: str('createdAt'),
    updatedAt: str('updatedAt'),
    dataLockedAt: str('dataLockedAt'),
  };
}
