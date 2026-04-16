'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { onAuthChange } from '@/lib/firebase/auth';

/**
 * Comma-separated list of emails allowed to act as admins.
 * Set NEXT_PUBLIC_ADMIN_EMAILS in .env.local, e.g.:
 *   NEXT_PUBLIC_ADMIN_EMAILS=admin@example.com,ops@example.com
 *
 * When empty or unset, ALL authenticated users are treated as admins
 * (backward-compatible but not recommended for production).
 */
const ADMIN_ALLOWLIST: Set<string> = (() => {
  const raw = process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? '';
  const emails = raw.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
  return new Set(emails);
})();

function isAllowedAdmin(user: User): boolean {
  if (ADMIN_ALLOWLIST.size === 0) return true;
  return ADMIN_ALLOWLIST.has((user.email ?? '').toLowerCase());
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, isAdmin: false });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange((u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const isAdmin = user ? isAllowedAdmin(user) : false;

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
