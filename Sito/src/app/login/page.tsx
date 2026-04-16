'use client';

import { Suspense, useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { loginWithEmail } from '@/lib/firebase/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, loading: authLoading, isAdmin } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectParam = params.get('redirect');

  function resolveDestination(isAdminUser: boolean): string {
    if (redirectParam && redirectParam.startsWith('/')) return redirectParam;
    return isAdminUser ? '/admin' : '/account';
  }

  useEffect(() => {
    if (authLoading) return;
    if (user) router.replace(resolveDestination(isAdmin));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, isAdmin, router, redirectParam]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await loginWithEmail(email.trim(), password);
      // Let the effect above route based on isAdmin once AuthContext updates.
    } catch {
      setError(t('login.error'));
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
      <div className="w-full max-w-sm">
        {/* Branding */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-6 w-6 text-white">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900">{t('login.title')}</h1>
          <p className="mt-1.5 text-sm text-gray-500">{t('login.subtitle')}</p>
        </div>

        {/* Form card */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
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
              autoComplete="current-password"
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
              {t('login.submit')}
            </Button>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-5 space-y-2 text-center">
          <p className="text-xs text-gray-500">
            {t('login.noAccount')}{' '}
            <Link href="/signup" className="font-semibold text-gray-900 hover:underline">
              {t('login.signupCta')}
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
