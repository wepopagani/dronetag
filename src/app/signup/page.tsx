'use client';

import { useEffect, useLayoutEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { ALLOW_PUBLIC_SIGNUP } from '@/lib/config/features';
import { DEMO_MODE } from '@/lib/firebase/config';
import { signupWithEmail } from '@/lib/firebase/auth';
import { ensureAccount } from '@/lib/firebase/account';
import { trackEvent } from '@/lib/analytics';
import { adminFetch } from '@/lib/client/adminApi';
import { AuthPageLayout } from '@/components/auth/AuthPageLayout';
import { AuthOrDivider } from '@/components/auth/AuthOrDivider';
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton';
import { SignupOtpVerification } from '@/components/auth/SignupOtpVerification';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { ContactVerificationChannel } from '@/lib/types/contactVerification';

type SignupStep = 'form' | 'verify';

export default function SignupPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();

  const [step, setStep] = useState<SignupStep>('form');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [verifyEmail, setVerifyEmail] = useState(true);
  const [verifyPhone, setVerifyPhone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const channels: ContactVerificationChannel[] = [
    ...(verifyEmail ? (['email'] as const) : []),
    ...(verifyPhone ? (['phone'] as const) : []),
  ];

  useLayoutEffect(() => {
    if (authLoading) return;
    if (!ALLOW_PUBLIC_SIGNUP && !DEMO_MODE) {
      router.replace('/login');
      return;
    }
    // Utente già loggato ma non nel flusso OTP appena avviato → vai all'account.
    if (user && step !== 'verify') {
      router.replace('/account');
    }
  }, [user, authLoading, router, step]);

  useEffect(() => {
    if (authLoading || !user) return;
    router.prefetch('/account');
  }, [user, authLoading, router]);

  async function initVerification(ch: ContactVerificationChannel[], phoneNumber: string) {
    const res = await adminFetch('/api/auth/contact-verification/init', {
      method: 'POST',
      body: JSON.stringify({ channels: ch, phone: phoneNumber }),
    });
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) throw new Error(body.error || 'init failed');
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (channels.length === 0) {
      setError(t('signup.otp.channelRequired'));
      return;
    }
    if (verifyPhone && !phone.trim()) {
      setError(t('signup.otp.phoneRequired'));
      return;
    }
    if (password.length < 6) {
      setError(t('signup.errorPasswordShort'));
      return;
    }
    if (password !== passwordConfirm) {
      setError(t('signup.errorPasswordMismatch'));
      return;
    }

    setSubmitting(true);
    try {
      const displayName = `${firstName.trim()} ${lastName.trim()}`.trim();
      const cred = await signupWithEmail(email.trim(), password, displayName);
      const u = cred.user;
      if (u) {
        await ensureAccount(u.uid, u.email ?? email.trim(), {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim(),
        });
        await initVerification(channels, phone.trim());
      }
      trackEvent('signup');
      setStep('verify');
    } catch (err) {
      const message =
        err instanceof Error && err.message.includes('email-already-in-use')
          ? t('signup.errorEmailInUse')
          : t('signup.errorGeneric');
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (user && step === 'verify') {
    return (
      <AuthPageLayout
        title={t('signup.title')}
        footer={
          <p className="text-xs text-[var(--color-text-secondary)]">
            {t('signup.haveAccount')}{' '}
            <Link href="/login" className="font-semibold text-[var(--color-action)] hover:underline">
              {t('nav.login')}
            </Link>
          </p>
        }
      >
        <SignupOtpVerification
          channels={channels.length > 0 ? channels : ['email']}
          phone={phone}
          onComplete={() => router.replace('/account')}
        />
      </AuthPageLayout>
    );
  }

  if (user) {
    return (
      <div className="flex min-h-[calc(100dvh-var(--header-height)-var(--safe-top))] items-center justify-center bg-[var(--color-app-bg)] px-4">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-action)]" />
          <p className="text-sm text-[var(--color-text-secondary)]">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <AuthPageLayout
      title={t('signup.title')}
      footer={
        <p className="text-xs text-[var(--color-text-secondary)]">
          {t('signup.haveAccount')}{' '}
          <Link href="/login" className="font-semibold text-[var(--color-action)] hover:underline">
            {t('nav.login')}
          </Link>
        </p>
      }
    >
      <div className="space-y-4">
        <GoogleAuthButton
          disabled={submitting}
          onError={setError}
          onSignedUp={() => setStep('verify')}
        />
        <AuthOrDivider />
      </div>
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            name="firstName"
            label={t('field.firstName')}
            value={firstName}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setFirstName(e.target.value)}
            required
            autoComplete="given-name"
            disabled={submitting}
          />
          <Input
            name="lastName"
            label={t('field.lastName')}
            value={lastName}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setLastName(e.target.value)}
            required
            autoComplete="family-name"
            disabled={submitting}
          />
        </div>
        <Input
          name="email"
          type="email"
          label={t('login.email')}
          value={email}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
          required
          autoComplete="email"
          disabled={submitting}
        />
        <Input
          name="phone"
          label={t('field.phone')}
          value={phone}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)}
          required={verifyPhone}
          autoComplete="tel"
          disabled={submitting}
          placeholder="+39 333 1234567"
        />

        <fieldset className="space-y-2 rounded-lg border border-[var(--color-border)] bg-gray-50 p-4">
          <legend className="px-1 text-sm font-medium text-[var(--color-text)]">
            {t('signup.otp.chooseChannels')}
          </legend>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--color-text)]">
            <input
              type="checkbox"
              checked={verifyEmail}
              onChange={(e) => setVerifyEmail(e.target.checked)}
              disabled={submitting}
              className="h-4 w-4 rounded border-gray-300"
            />
            {t('signup.otp.verifyEmailOption')}
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--color-text)]">
            <input
              type="checkbox"
              checked={verifyPhone}
              onChange={(e) => setVerifyPhone(e.target.checked)}
              disabled={submitting}
              className="h-4 w-4 rounded border-gray-300"
            />
            {t('signup.otp.verifyPhoneOption')}
          </label>
          <p className="text-xs text-[var(--color-text-secondary)]">{t('signup.otp.channelHint')}</p>
        </fieldset>

        <Input
          name="password"
          type="password"
          label={t('login.password')}
          value={password}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
          required
          autoComplete="new-password"
          disabled={submitting}
        />
        <Input
          name="passwordConfirm"
          type="password"
          label={t('signup.passwordConfirm')}
          value={passwordConfirm}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setPasswordConfirm(e.target.value)}
          required
          autoComplete="new-password"
          disabled={submitting}
        />

        {error ? (
          <div className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5" role="alert">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        ) : null}

        <Button type="submit" fullWidth size="lg" loading={submitting} disabled={submitting} className="min-h-[2.75rem]">
          {t('signup.submit')}
        </Button>
      </form>
    </AuthPageLayout>
  );
}
