/**
 * Grant the `admin: true` Firebase custom claim to a user.
 *
 * V-028 closure: replaces the deleted scripts/create-admin.ts (which
 * shipped a hardcoded password). This script uses firebase-admin with
 * server-side credentials — the password is never present anywhere,
 * and the client-side email allowlist has been removed from
 * AuthContext.
 *
 * Credentials (first match wins):
 *   1. FIREBASE_SERVICE_ACCOUNT_KEY — JSON one-liner in .env.local
 *   2. gcloud Application Default Credentials — when org policy blocks
 *      key download, run: gcloud auth application-default login
 *
 * Usage:
 *
 *   npm run grant-admin -- <email>          # promote
 *   npm run grant-admin -- <email> --revoke # demote
 *
 * The user must already exist in Firebase Auth. After promotion, the
 * user's app session will pick up the new claim within 5 minutes
 * (periodic refresh in AuthContext) or immediately on next sign-in.
 */

import { applicationDefault, cert, initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

interface Args {
  email: string;
  revoke: boolean;
}

function parseArgs(argv: string[]): Args {
  const positional = argv.filter((a) => !a.startsWith('--'));
  const flags = new Set(argv.filter((a) => a.startsWith('--')));
  const email = (positional[0] ?? '').trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error('Usage: npm run grant-admin -- <email> [--revoke]');
    process.exit(1);
  }
  return { email, revoke: flags.has('--revoke') };
}

function initAdminApp(): void {
  if (getApps().length > 0) return;

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.trim();
  if (raw) {
    try {
      initializeApp({ credential: cert(JSON.parse(raw) as Parameters<typeof cert>[0]) });
      return;
    } catch (err) {
      console.error('FIREBASE_SERVICE_ACCOUNT_KEY is not valid JSON:', err);
      process.exit(2);
    }
  }

  // Fallback when org policy blocks service-account key download.
  // Requires: gcloud auth application-default login
  try {
    initializeApp({ credential: applicationDefault() });
  } catch (err) {
    console.error(
      'No Firebase Admin credentials found.\n' +
      '  Option A: set FIREBASE_SERVICE_ACCOUNT_KEY in .env.local (JSON one-liner)\n' +
      '  Option B: gcloud auth application-default login (no key file needed)',
    );
    console.error(err);
    process.exit(2);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  initAdminApp();
  const auth = getAuth();

  const user = await auth.getUserByEmail(args.email).catch((err) => {
    console.error(`No Firebase Auth user with email "${args.email}":`, err.code ?? err.message ?? err);
    process.exit(3);
  });

  const existing = user.customClaims ?? {};
  const next = args.revoke
    ? Object.fromEntries(Object.entries(existing).filter(([k]) => k !== 'admin'))
    : { ...existing, admin: true };

  await auth.setCustomUserClaims(user.uid, next);
  // Force the user's existing tokens to be invalidated; they will re-mint
  // on next refresh and pick up the new claims.
  await auth.revokeRefreshTokens(user.uid);

  console.log('[grant-admin] OK');
  console.log(`  email:  ${args.email}`);
  console.log(`  uid:    ${user.uid}`);
  console.log(`  claims: ${JSON.stringify(next)}`);
  console.log('');
  console.log('  The user must sign out and back in (or wait up to 5 minutes for the');
  console.log('  periodic AuthContext refresh) for the new claim to take effect.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
