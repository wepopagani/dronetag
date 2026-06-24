export type ContactVerificationChannel = 'email' | 'phone';

export interface ContactVerificationState {
  /** Channels the user chose to verify at signup. */
  channels: ContactVerificationChannel[];
  emailVerifiedAt: string;
  phoneVerifiedAt: string;
}

export const EMPTY_CONTACT_VERIFICATION: ContactVerificationState = {
  channels: [],
  emailVerifiedAt: '',
  phoneVerifiedAt: '',
};

export function isContactVerificationSatisfied(
  state: ContactVerificationState | undefined,
  firebaseEmailVerified = false,
): boolean {
  if (!state) return firebaseEmailVerified;
  const emailOk = Boolean(state.emailVerifiedAt) || firebaseEmailVerified;
  const phoneOk = Boolean(state.phoneVerifiedAt);
  return emailOk || phoneOk;
}
