'use client';

import { Suspense, useEffect, useLayoutEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { loginWithEmail } from '@/lib/firebase/auth';
import { ALLOW_PUBLIC_SIGNUP } from '@/lib/config/features';
import { DEMO_MODE } from '@/lib/firebase/config';
import { trackEvent } from '@/lib/analytics';
import { AuthPageLayout } from '@/components/auth/AuthPageLayout';
import { AuthOrDivider } from '@/components/auth/AuthOrDivider';
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';

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

  useLayoutEffect(() => {
    if (authLoading || !user) return;
    router.replace(resolveDestination(isAdmin));
  }, [user, authLoading, isAdmin, router, redirectParam]);

  useEffect(() => {
    if (authLoading || !user) return;
    router.prefetch(resolveDestination(isAdmin));
  }, [user, authLoading, isAdmin, router, redirectParam]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await loginWithEmail(email.trim(), password);
      trackEvent('login');
    } catch {
      setError(t('login.error'));
    } finally {
      setSubmitting(false);
    }
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
      title={t('login.title')}
      subtitle={t('login.subtitle')}
      footer={
        ALLOW_PUBLIC_SIGNUP || DEMO_MODE ? (
          <p className="text-xs text-[var(--color-text-secondary)]">
            {t('login.noAccount')}{' '}
            <Link href="/signup" className="font-semibold text-[var(--color-action)] hover:underline">
              {t('nav.signup')}
            </Link>
          </p>
        ) : (
          <p className="text-xs text-[var(--color-text-secondary)]">{t('login.adminProvisioned')}</p>
        )
      }
    >
      <div className="space-y-4">
        <GoogleAuthButton disabled={submitting} onError={setError} />
        <AuthOrDivider />
      </div>
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
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
        <PasswordInput
          name="password"
          label={t('login.password')}
          value={password}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          disabled={submitting}
        />
        {error ? (
          <div className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5" role="alert">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        ) : null}
        <Button type="submit" fullWidth size="lg" loading={submitting} disabled={submitting} className="min-h-[2.75rem]">
          {t('login.submit')}
        </Button>
      </form>
    </AuthPageLayout>
  );
}
