'use client';

import { useAuth } from '@/contexts/AuthContext';

export function useLandingAuth() {
  const { user, loading, isAdmin } = useAuth();

  const dashboardHref = user ? (isAdmin ? '/admin' : '/account') : '/login';
  const adminHref = user && isAdmin ? '/admin' : '/login?redirect=/admin';
  const accountHref = user ? '/account' : '/login?redirect=/account';

  return { user, loading, isAdmin, dashboardHref, adminHref, accountHref };
}

export function userInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
}
