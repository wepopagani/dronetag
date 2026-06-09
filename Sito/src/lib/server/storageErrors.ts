/**
 * Map Firebase / GCS storage failures to API-friendly responses.
 */

import { NextResponse } from 'next/server';

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

function errorCode(err: unknown): string | number | undefined {
  if (typeof err !== 'object' || err === null) return undefined;
  if ('code' in err) return (err as { code: unknown }).code as string | number;
  return undefined;
}

/** True when Cloud Storage rejects requests because billing is required (402). */
export function isStorageBillingError(err: unknown): boolean {
  const msg = errorMessage(err).toLowerCase();
  const code = errorCode(err);
  return (
    code === 402
    || msg.includes('402')
    || msg.includes('spark pricing plan')
    || msg.includes('blaze pricing plan')
    || msg.includes('no longer supports firebase projects')
  );
}

export function storageErrorResponse(err: unknown, context: string): NextResponse {
  console.error(`[storage] ${context} failed`, err);
  if (isStorageBillingError(err)) {
    return NextResponse.json(
      {
        error: 'storage_billing_required',
        message:
          'Cloud Storage requires the Firebase Blaze plan. Upgrade billing in the Firebase console, then retry.',
      },
      { status: 503 },
    );
  }
  const message = errorMessage(err) || `${context} failed`;
  return NextResponse.json({ error: message }, { status: 500 });
}
