'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { onAuthChange } from '@/lib/firebase/auth';
import { DEMO_MODE } from '@/lib/firebase/config';
import { parseAdminEmailSet } from '@/lib/auth/adminAllowlist';

/**
 * Admins = `SUPER_ADMIN_EMAILS` (see adminAllowlist.ts) ∪ NEXT_PUBLIC_ADMIN_EMAILS.
 * Example: NEXT_PUBLIC_ADMIN_EMAILS=ops@example.com,analyst@example.com
 */
const ADMIN_ALLOWLIST = parseAdminEmailSet(process.env.NEXT_PUBLIC_ADMIN_EMAILS);

function isAllowedAdmin(user: User): boolean {
  if (DEMO_MODE) return true;
  const email = (user.email ?? '').toLowerCase();
  return email !== '' && ADMIN_ALLOWLIST.has(email);
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
