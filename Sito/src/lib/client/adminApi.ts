/**
 * Authenticated fetch for admin API routes (Safari-safe Bearer token).
 */

import { getCurrentUser } from '@/lib/firebase/auth';

export async function adminFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const user = getCurrentUser();
  const headers = new Headers(init.headers);
  if (!headers.has('content-type') && init.body) {
    headers.set('content-type', 'application/json');
  }
  if (user) {
    const token = await user.getIdToken(true);
    headers.set('authorization', `Bearer ${token}`);
  }
  return fetch(path, {
    ...init,
    credentials: 'same-origin',
    headers,
  });
}
