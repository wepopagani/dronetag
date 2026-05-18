/**
 * Grant the `admin: true` Firebase custom claim to a user.
 *
 * V-028 closure: replaces the deleted scripts/create-admin.ts (which
 * shipped a hardcoded password). This script uses firebase-admin with
 * server-side credentials — the password is never present anywhere,
 * and the client-side email allowlist has been removed from
 * AuthContext.
 *
 * Usage (after configuring FIREBASE_SERVICE_ACCOUNT_KEY in .env.local):
 *
 *   npm run grant-admin -- <email>          # promote
 *   npm run grant-admin -- <email> --revoke # demote
 *
 * The user must already exist in Firebase Auth. After promotion, the
 * user's app session will pick up the new claim within 5 minutes
 * (periodic refresh in AuthContext) or immediately on next sign-in.
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
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

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) {
    console.error(
      'Missing FIREBASE_SERVICE_ACCOUNT_KEY env. Add the JSON of a Firebase ' +
      'service-account key file to .env.local (single-line) and re-run.',
    );
    process.exit(2);
  }
  let sa: Parameters<typeof cert>[0];
  try {
    sa = JSON.parse(raw);
  } catch (err) {
    console.error('FIREBASE_SERVICE_ACCOUNT_KEY is not valid JSON:', err);
    process.exit(2);
  }

  if (getApps().length === 0) {
    initializeApp({ credential: cert(sa) });
  }
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
