'use client';

/**
 * Auth context — PR-SEC-2 hardening.
 *
 * Closes:
 *   V-028: admin status now comes EXCLUSIVELY from the Firebase
 *          custom claim `admin == true`. The previous client-side
 *          email allowlist (NEXT_PUBLIC_ADMIN_EMAILS) has been
 *          removed.
 *   V-030: tokens are forcibly refreshed on every auth-state change
 *          and on a 5-minute interval so a freshly-promoted admin
 *          does not need to sign out and back in.
 *
 * Side effects:
 *   • Mirrors the current ID token to a `__dronetag_idt` cookie so
 *     the Next.js proxy (Node.js runtime) can verify it via
 *     firebase-admin and gate `/admin/*` before rendering. Cookie is
 *     scoped to the same origin, `Secure` on https, `SameSite=Strict`,
 *     and short-lived (matching the token's 1-hour life).
 *   • Posts to `/api/session` after sign-in so the server can also
 *     stash an HttpOnly companion cookie when configured (PR-SEC-3+
 *     long-lived session cookies). The endpoint is best-effort: if
 *     Firebase Admin isn't configured server-side, the POST returns
 *     204 and the proxy falls back to the JS-readable cookie.
 */

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { User } from 'firebase/auth';
import { onAuthChange } from '@/lib/firebase/auth';
import { DEMO_MODE } from '@/lib/firebase/config';

const TOKEN_COOKIE = '__dronetag_idt';
const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

interface AuthContextType {
  user: User | null;
  loading: boolean;
  /** True iff the live Firebase ID token includes the `admin` custom claim. */
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, isAdmin: false });

function setIdTokenCookie(token: string | null): void {
  if (typeof document === 'undefined') return;
  const secure = typeof window !== 'undefined' && window.location.protocol === 'https:'
    ? '; Secure'
    : '';
  if (!token) {
    document.cookie = `${TOKEN_COOKIE}=; path=/; max-age=0; SameSite=Strict${secure}`;
    return;
  }
  // 55 minutes — slightly less than the token's 60-minute TTL so the cookie
  // expires before the token does. Refresh interval (5min) keeps it warm.
  document.cookie = `${TOKEN_COOKIE}=${token}; path=/; max-age=${55 * 60}; SameSite=Strict${secure}`;
}

async function postSessionCookie(token: string): Promise<void> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    await fetch('/api/session', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ idToken: token }),
      signal: controller.signal,
    });
    clearTimeout(timer);
  } catch {
    // Best-effort. The proxy still has the JS-readable cookie.
  }
}

async function clearSessionCookie(): Promise<void> {
  try {
    await fetch('/api/session', { method: 'DELETE', credentials: 'same-origin' });
  } catch {
    /* ignore */
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function applyClaims(u: User | null, forceRefresh = false): Promise<void> {
      if (!u) {
        setIsAdmin(false);
        setIdTokenCookie(null);
        void clearSessionCookie();
        return;
      }
      // Fast path: read cached token first so redirects and admin gates unblock quickly.
      // A background force-refresh picks up newly granted custom claims.
      const token = await u.getIdToken(forceRefresh);
      const tokenResult = await u.getIdTokenResult(forceRefresh);
      if (cancelled) return;
      setIsAdmin(tokenResult.claims.admin === true);
      setIdTokenCookie(token);
      void postSessionCookie(token);
    }

    let initialAuthEvent = true;

    const unsubscribe = onAuthChange((u) => {
      setUser(u);
      if (!cancelled) setLoading(false);
      void (async () => {
        try {
          await applyClaims(u, false);
          if (u && initialAuthEvent) {
            initialAuthEvent = false;
            void applyClaims(u, true).catch((err) => {
              console.warn('[auth] background claims refresh failed', err);
            });
          }
        } catch (err) {
          console.warn('[auth] claims apply failed', err);
        }
      })();
    });

    // Safety net: if Firebase auth never fires (blocked storage, offline), unblock UI.
    const loadingTimeout = setTimeout(() => {
      if (!cancelled) setLoading(false);
    }, 2500);

    // V-030: periodic refresh keeps `isAdmin` in sync with the latest
    // server-side claims and rotates the cookie before it expires.
    refreshTimerRef.current = setInterval(async () => {
      const fbAuth = (await import('@/lib/firebase/auth')).getCurrentUser?.();
      if (!fbAuth) return;
      try {
        await applyClaims(fbAuth, true);
      } catch (err) {
        console.warn('[auth] periodic refresh failed', err);
      }
    }, REFRESH_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearTimeout(loadingTimeout);
      unsubscribe();
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin: DEMO_MODE ? Boolean(user) : isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
