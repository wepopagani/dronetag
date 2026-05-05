'use client';

import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { signupWithEmail } from '@/lib/firebase/auth';
import { ensureAccount } from '@/lib/firebase/account';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function SignupPage() {
  const router = useRouter();
  const { user, loading: authLoading, isAdmin } = useAuth();
  const { t } = useLanguage();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (user) router.replace(isAdmin ? '/admin' : '/account');
  }, [user, authLoading, isAdmin, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

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
        });
      }
      // Routing: useEffect picks /admin vs /account once AuthContext has isAdmin.
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

  if (authLoading || user) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-gray-50 px-4">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
          <p className="text-sm text-gray-500">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-6 w-6 text-white">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900">{t('signup.title')}</h1>
          <p className="mt-1.5 text-sm text-gray-500">{t('signup.subtitle')}</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
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
                <svg viewBox="0 0 20 20" fill="currentColor" className="mt-0.5 h-4 w-4 shrink-0 text-red-500">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            ) : null}

            <Button type="submit" fullWidth loading={submitting} disabled={submitting}>
              {t('signup.submit')}
            </Button>
          </form>
        </div>

        <div className="mt-5 space-y-2 text-center">
          <p className="text-xs text-gray-500">
            {t('signup.haveAccount')}{' '}
            <Link href="/login" className="font-semibold text-gray-900 hover:underline">
              {t('nav.login')}
            </Link>
          </p>
          <Link href="/" className="inline-block text-xs font-medium text-gray-400 transition hover:text-gray-600">
            {t('nav.home')}
          </Link>
        </div>
      </div>
    </div>
  );
}
