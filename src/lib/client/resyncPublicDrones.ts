/**
 * Request a server-side rebuild of public drone snapshots for a user.
 * Falls back silently — callers should not block UX on failure.
 */

import { adminFetch } from '@/lib/client/adminApi';
import { resyncUserPublicDrones } from '@/lib/firebase/dronesPublic';

export async function requestPublicDroneResync(uid: string): Promise<void> {
  if (!uid) return;

  await Promise.allSettled([
    resyncUserPublicDrones(uid),
    adminFetch('/api/admin/resync-public-drones', {
      method: 'POST',
      body: JSON.stringify({ uid }),
    }),
  ]);
}
