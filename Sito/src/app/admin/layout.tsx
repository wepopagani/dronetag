'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading, isAdmin } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace('/login'); return; }
    if (!isAdmin) router.replace('/account');
  }, [user, loading, isAdmin, router]);

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-3 bg-gray-50">
        <div
          className="h-9 w-9 animate-spin rounded-full border-2 border-gray-200 border-t-blue-600"
          role="status"
          aria-label={t('common.loading')}
        />
        <p className="text-sm text-gray-600">{t('common.loading')}</p>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return <div className="min-h-[calc(100vh-4rem)] bg-gray-50">{children}</div>;
}
