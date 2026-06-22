'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

/** Warm common post-login routes so client navigations feel instant. */
export function AuthRoutePrefetch() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading || !user) return;
    router.prefetch('/account');
    router.prefetch('/admin');
  }, [user, loading, router]);

  return null;
}
