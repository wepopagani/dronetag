import type { AccountType } from '@/lib/types/account';

export type AdminCreateUserField =
  | 'email'
  | 'password'
  | 'firstName'
  | 'lastName'
  | 'companyName'
  | 'companyContactPerson';

export type AdminCreateUserFieldErrors = Partial<Record<AdminCreateUserField, string>>;

export type AdminCreateUserInput = {
  email: string;
  password: string;
  accountType: AccountType;
  firstName: string;
  lastName: string;
  companyName: string;
  companyContactPerson: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Machine-readable codes; mapped to i18n on the client. */
export type AdminCreateUserErrorCode =
  | 'email_required'
  | 'email_invalid'
  | 'password_required'
  | 'password_too_short'
  | 'firstName_required'
  | 'lastName_required'
  | 'companyName_required'
  | 'companyContactPerson_required';

export const CODE_TO_FIELD: Record<AdminCreateUserErrorCode, AdminCreateUserField> = {
  email_required: 'email',
  email_invalid: 'email',
  password_required: 'password',
  password_too_short: 'password',
  firstName_required: 'firstName',
  lastName_required: 'lastName',
  companyName_required: 'companyName',
  companyContactPerson_required: 'companyContactPerson',
};

export function validateAdminCreateUserInput(
  input: AdminCreateUserInput,
): AdminCreateUserErrorCode[] {
  const codes: AdminCreateUserErrorCode[] = [];
  const email = input.email.trim();
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();

  if (!email) codes.push('email_required');
  else if (!EMAIL_RE.test(email)) codes.push('email_invalid');

  if (!input.password) codes.push('password_required');
  else if (input.password.length < 6) codes.push('password_too_short');

  if (!firstName) codes.push('firstName_required');
  if (!lastName) codes.push('lastName_required');

  if (input.accountType === 'company') {
    if (!input.companyName.trim()) codes.push('companyName_required');
    if (!input.companyContactPerson.trim()) codes.push('companyContactPerson_required');
  }

  return codes;
}

export function apiFieldsFromCodes(
  codes: AdminCreateUserErrorCode[],
): Record<string, AdminCreateUserErrorCode> {
  const fields: Partial<Record<AdminCreateUserField, AdminCreateUserErrorCode>> = {};
  for (const code of codes) {
    const field = CODE_TO_FIELD[code];
    fields[field] = code;
  }
  return fields as Record<string, AdminCreateUserErrorCode>;
}

export function codesFromApiFields(
  fields: Record<string, string> | undefined,
): AdminCreateUserErrorCode[] {
  if (!fields) return [];
  return Object.values(fields).filter(isErrorCode);
}

function isErrorCode(v: string): v is AdminCreateUserErrorCode {
  return v in CODE_TO_FIELD;
}
