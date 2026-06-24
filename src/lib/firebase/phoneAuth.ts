import {
  linkWithCredential,
  PhoneAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from 'firebase/auth';

import { getFirebaseAuth } from '@/lib/firebase/config';

let recaptchaVerifier: RecaptchaVerifier | null = null;

export function ensurePhoneRecaptcha(containerId: string): RecaptchaVerifier {
  if (recaptchaVerifier) {
    try {
      recaptchaVerifier.clear();
    } catch {
      /* ignore */
    }
    recaptchaVerifier = null;
  }

  recaptchaVerifier = new RecaptchaVerifier(getFirebaseAuth(), containerId, {
    size: 'invisible',
  });
  return recaptchaVerifier;
}

export function clearPhoneRecaptcha(): void {
  if (!recaptchaVerifier) return;
  try {
    recaptchaVerifier.clear();
  } catch {
    /* ignore */
  }
  recaptchaVerifier = null;
}

export async function startPhoneOtp(
  phoneE164: string,
  containerId: string,
): Promise<ConfirmationResult> {
  const verifier = ensurePhoneRecaptcha(containerId);
  return signInWithPhoneNumber(getFirebaseAuth(), phoneE164, verifier);
}

export async function confirmPhoneOtp(
  confirmation: ConfirmationResult,
  code: string,
): Promise<void> {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  if (!user) throw new Error('not_signed_in');

  const credential = PhoneAuthProvider.credential(confirmation.verificationId, code.trim());
  await linkWithCredential(user, credential);
}

export function toE164Phone(raw: string, defaultCountryCode = '+39'): string {
  const trimmed = raw.trim().replace(/\s+/g, '');
  if (trimmed.startsWith('+')) return trimmed;
  if (trimmed.startsWith('00')) return `+${trimmed.slice(2)}`;
  const digits = trimmed.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('39') && digits.length >= 10) return `+${digits}`;
  return `${defaultCountryCode}${digits.replace(/^0+/, '')}`;
}
