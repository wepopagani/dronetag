/**
 * Server-side slot quota checks (mirrors functions/src/util.ts).
 */

import { adminFirestore } from '@/lib/server/firebaseAdmin';

export const MAX_OPERATORS_PER_USER = 3;

export type QuotaSlot = 'drone' | 'operator' | 'certificate' | 'pdf';

const QUOTA_COLLECTIONS: Record<QuotaSlot, string> = {
  drone: 'drones',
  operator: 'operators',
  certificate: 'certificates',
  pdf: 'documents',
};

const SLOT_DEFAULTS: Record<QuotaSlot, number> = {
  drone: 1,
  operator: 1,
  certificate: 1,
  pdf: 1,
};

export class QuotaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'QuotaError';
  }
}

export async function enforceQuota(uid: string, kind: QuotaSlot): Promise<void> {
  const db = adminFirestore();
  const slotsSnap = await db.collection('slots').doc(uid).get();
  const slotsData = slotsSnap.exists ? (slotsSnap.data() as Record<string, unknown>) : {};
  const granted =
    typeof slotsData[kind] === 'number' ? (slotsData[kind] as number) : SLOT_DEFAULTS[kind];
  const cap = kind === 'operator' ? Math.min(granted, MAX_OPERATORS_PER_USER) : granted;

  const usageSnap = await db.collection(QUOTA_COLLECTIONS[kind]).where('userId', '==', uid).get();
  const used = usageSnap.size;

  if (used >= cap) {
    throw new QuotaError(`Quota reached for ${kind}: ${used}/${cap}.`);
  }
}
