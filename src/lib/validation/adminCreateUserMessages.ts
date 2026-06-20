import type { TranslationKey } from '@/lib/i18n/schema';
import {
  CODE_TO_FIELD,
  type AdminCreateUserErrorCode,
  type AdminCreateUserFieldErrors,
} from './adminCreateUser';

/** Build per-field error strings and a short summary for the banner. */
export function adminCreateUserMessages(
  codes: AdminCreateUserErrorCode[],
  t: (key: TranslationKey, vars?: Record<string, string>) => string,
): { fieldErrors: AdminCreateUserFieldErrors; summary: string } {
  const fieldErrors: AdminCreateUserFieldErrors = {};
  for (const code of codes) {
    const field = CODE_TO_FIELD[code];
    fieldErrors[field] = t(`admin.users.create.errors.${code}` as TranslationKey);
  }

  if (codes.length === 0) {
    return { fieldErrors, summary: '' };
  }
  if (codes.length === 1) {
    return { fieldErrors, summary: fieldErrors[CODE_TO_FIELD[codes[0]!]] ?? '' };
  }
  return {
    fieldErrors,
    summary: t('admin.users.create.errors.summary', { count: String(codes.length) }),
  };
}
