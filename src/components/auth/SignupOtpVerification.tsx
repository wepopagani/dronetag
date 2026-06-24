'use client';

import { useEffect, useRef, useState } from 'react';
import type { ConfirmationResult } from 'firebase/auth';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { adminFetch } from '@/lib/client/adminApi';
import { getAccount } from '@/lib/firebase/account';
import { DEMO_MODE } from '@/lib/firebase/config';
import {
  clearPhoneRecaptcha,
  confirmPhoneOtp,
  startPhoneOtp,
  toE164Phone,
} from '@/lib/firebase/phoneAuth';
import type { ContactVerificationChannel } from '@/lib/types/contactVerification';
import { isContactVerificationSatisfied } from '@/lib/types/contactVerification';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

type SignupOtpVerificationProps = {
  channels: ContactVerificationChannel[];
  phone: string;
  onComplete: () => void;
};

export function SignupOtpVerification({ channels, phone, onComplete }: SignupOtpVerificationProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const recaptchaRef = useRef<HTMLDivElement>(null);

  const wantsEmail = channels.includes('email');
  const wantsPhone = channels.includes('phone');

  const [emailCode, setEmailCode] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [phoneStarted, setPhoneStarted] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [devEmailCode, setDevEmailCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const phoneConfirmationRef = useRef<ConfirmationResult | null>(null);

  const phoneE164 = toE164Phone(phone);

  useEffect(() => {
    if (DEMO_MODE) {
      setEmailVerified(true);
      setPhoneVerified(true);
      return;
    }
    if (user?.emailVerified) setEmailVerified(true);
    if (!user) return;
    void getAccount(user.uid).then((account) => {
      if (account?.contactVerification?.emailVerifiedAt) setEmailVerified(true);
      if (account?.contactVerification?.phoneVerifiedAt) setPhoneVerified(true);
    });
  }, [user]);

  useEffect(() => () => clearPhoneRecaptcha(), []);

  async function sendEmailOtp() {
    setError(null);
    setBusy('email-send');
    try {
      const res = await adminFetch('/api/auth/otp/email/send', { method: 'POST' });
      const body = (await res.json().catch(() => ({}))) as { devCode?: string; error?: string };
      if (!res.ok) {
        throw new Error(body.error || 'send failed');
      }
      setEmailSent(true);
      if (body.devCode) setDevEmailCode(body.devCode);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('signup.otp.errorSend'));
    } finally {
      setBusy(null);
    }
  }

  async function verifyEmailOtp() {
    setError(null);
    setBusy('email-verify');
    try {
      const res = await adminFetch('/api/auth/otp/email/verify', {
        method: 'POST',
        body: JSON.stringify({ code: emailCode }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(body.error || 'verify failed');
      setEmailVerified(true);
    } catch {
      setError(t('signup.otp.errorCode'));
    } finally {
      setBusy(null);
    }
  }

  async function sendPhoneOtp() {
    if (!recaptchaRef.current) return;
    setError(null);
    setBusy('phone-send');
    try {
      recaptchaRef.current.id = recaptchaRef.current.id || 'signup-phone-recaptcha';
      phoneConfirmationRef.current = await startPhoneOtp(phoneE164, recaptchaRef.current.id);
      setPhoneStarted(true);
    } catch (err) {
      const code = err && typeof err === 'object' && 'code' in err ? String(err.code) : '';
      setError(code === 'auth/invalid-phone-number' ? t('signup.otp.errorPhone') : t('signup.otp.errorSend'));
    } finally {
      setBusy(null);
    }
  }

  async function verifyPhoneOtp() {
    if (!phoneConfirmationRef.current) return;
    setError(null);
    setBusy('phone-verify');
    try {
      await confirmPhoneOtp(phoneConfirmationRef.current, phoneCode);
      const res = await adminFetch('/api/auth/contact-verification/phone', {
        method: 'POST',
        body: JSON.stringify({ phone: phoneE164 }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(body.error || 'record failed');
      setPhoneVerified(true);
    } catch {
      setError(t('signup.otp.errorCode'));
    } finally {
      setBusy(null);
    }
  }

  const emailDone = !wantsEmail || emailVerified;
  const phoneDone = !wantsPhone || phoneVerified;
  const canFinish = emailDone && phoneDone;

  async function tryComplete() {
    if (DEMO_MODE) {
      onComplete();
      return;
    }
    if (!canFinish) {
      setError(t('signup.otp.errorIncomplete'));
      return;
    }
    const account = user ? await getAccount(user.uid) : null;
    if (
      !isContactVerificationSatisfied(account?.contactVerification, user?.emailVerified ?? emailVerified)
    ) {
      setError(t('signup.otp.errorIncomplete'));
      return;
    }
    onComplete();
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold text-[var(--color-navy)]">{t('signup.otp.title')}</p>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{t('signup.otp.subtitle')}</p>
      </div>

      {wantsEmail ? (
        <section className="space-y-3 rounded-lg border border-[var(--color-border)] bg-gray-50 p-4">
          <p className="text-sm font-medium text-[var(--color-text)]">{t('signup.otp.emailSection')}</p>
          <p className="text-xs text-[var(--color-text-secondary)]">{user?.email}</p>
          {!emailVerified ? (
            <>
              <Button
                type="button"
                variant="secondary"
                fullWidth
                loading={busy === 'email-send'}
                disabled={Boolean(busy)}
                onClick={() => void sendEmailOtp()}
              >
                {emailSent ? t('signup.otp.resend') : t('signup.otp.sendEmail')}
              </Button>
              {devEmailCode ? (
                <p className="text-xs text-amber-700">{t('signup.otp.devCode', { code: devEmailCode })}</p>
              ) : null}
              {emailSent ? (
                <div className="flex gap-2">
                  <Input
                    name="emailOtp"
                    label={t('signup.otp.codeLabel')}
                    value={emailCode}
                    onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    disabled={Boolean(busy)}
                  />
                  <div className="flex shrink-0 items-end">
                    <Button
                      type="button"
                      loading={busy === 'email-verify'}
                      disabled={emailCode.length !== 6 || Boolean(busy)}
                      onClick={() => void verifyEmailOtp()}
                    >
                      {t('signup.otp.verify')}
                    </Button>
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <p className="text-sm text-emerald-700">{t('signup.otp.verified')}</p>
          )}
        </section>
      ) : null}

      {wantsPhone ? (
        <section className="space-y-3 rounded-lg border border-[var(--color-border)] bg-gray-50 p-4">
          <p className="text-sm font-medium text-[var(--color-text)]">{t('signup.otp.phoneSection')}</p>
          <p className="text-xs text-[var(--color-text-secondary)]">{phoneE164}</p>
          {!phoneVerified ? (
            <>
              <Button
                type="button"
                variant="secondary"
                fullWidth
                loading={busy === 'phone-send'}
                disabled={Boolean(busy)}
                onClick={() => void sendPhoneOtp()}
              >
                {phoneStarted ? t('signup.otp.resend') : t('signup.otp.sendPhone')}
              </Button>
              {phoneStarted ? (
                <div className="flex gap-2">
                  <Input
                    name="phoneOtp"
                    label={t('signup.otp.codeLabel')}
                    value={phoneCode}
                    onChange={(e) => setPhoneCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    disabled={Boolean(busy)}
                  />
                  <div className="flex shrink-0 items-end">
                    <Button
                      type="button"
                      loading={busy === 'phone-verify'}
                      disabled={phoneCode.length !== 6 || Boolean(busy)}
                      onClick={() => void verifyPhoneOtp()}
                    >
                      {t('signup.otp.verify')}
                    </Button>
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <p className="text-sm text-emerald-700">{t('signup.otp.verified')}</p>
          )}
        </section>
      ) : null}

      <div ref={recaptchaRef} id="signup-phone-recaptcha" className="hidden" aria-hidden />

      {error ? (
        <div className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700" role="alert">
          {error}
        </div>
      ) : null}

      <Button
        type="button"
        fullWidth
        size="lg"
        className="min-h-[2.75rem]"
        disabled={!canFinish || Boolean(busy)}
        onClick={() => void tryComplete()}
      >
        {t('signup.otp.continue')}
      </Button>
    </div>
  );
}
