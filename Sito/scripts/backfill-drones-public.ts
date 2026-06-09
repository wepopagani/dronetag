/**
 * Populate `dronesPublic/{slug}` snapshots for every existing
 * public-active drone. Used after deploying PR-SEC-1 because raw
 * `drones/*` documents are no longer anonymously readable; without a
 * snapshot, the public page returns "not found" until the owner saves
 * the drone again.
 *
 * Reads from .env.local. Authenticates as a user that already has the
 * `admin` custom claim so it can read every drone, pilot, operator and
 * insurance regardless of owner.
 *
 * Idempotent: re-running overwrites existing snapshots with the
 * current projection.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/backfill-drones-public.ts \
 *     [--dry-run]
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  setDoc,
  where,
  query as fsQuery,
} from 'firebase/firestore';

import {
  computePolicyStatus,
} from '../src/lib/utils';
import {
  effectiveOperatorId,
  operatorDisplayName,
  pilotDisplayName,
} from '../src/lib/utils/entities';
import { maskPolicyNumber } from '../src/lib/utils/publicProjection';
import type {
  Drone,
  DroneClass,
  DronePublicSnapshot,
  Insurance,
  Operator,
  Pilot,
} from '../src/lib/types/entities';
import type { PolicyStatus, VerificationStatus } from '../src/lib/types';

interface Args {
  dryRun: boolean;
}

function parseArgs(argv: string[]): Args {
  return { dryRun: argv.includes('--dry-run') };
}

function asString(v: unknown): string {
  return typeof v === 'string' ? v : '';
}
function asOptString(v: unknown): string | null {
  return typeof v === 'string' && v ? v : null;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? '';
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? '';
  const seedEmail = process.env.SEED_AUTH_EMAIL ?? '';
  const seedPassword = process.env.SEED_AUTH_PASSWORD ?? '';
  if (!apiKey || !projectId) {
    console.error('Missing NEXT_PUBLIC_FIREBASE_* env. Use --env-file=.env.local.');
    process.exit(1);
  }
  if (!seedEmail || !seedPassword) {
    console.error('Missing SEED_AUTH_EMAIL / SEED_AUTH_PASSWORD env (must be admin).');
    process.exit(1);
  }

  const app = initializeApp({
    apiKey,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
    projectId,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? '',
  });
  const auth = getAuth(app);
  await signInWithEmailAndPassword(auth, seedEmail, seedPassword);
  const db = getFirestore(app);

  console.log(`[backfill-drones-public] starting (dry-run=${args.dryRun})`);

  const snap = await getDocs(
    fsQuery(
      collection(db, 'drones'),
      where('status', '==', 'active'),
      where('visibility', '==', 'public'),
    ),
  );
  if (snap.empty) {
    console.log('[backfill-drones-public] no public-active drones to project.');
    return;
  }

  let written = 0;
  let skipped = 0;

  for (const droneDoc of snap.docs) {
    const raw = droneDoc.data() as Record<string, unknown>;
    const drone: Drone = {
      id: droneDoc.id,
      userId: asString(raw['userId']),
      slug: asString(raw['slug']),
      status: 'active',
      visibility: 'public',
      verificationStatus: (asString(raw['verificationStatus']) || 'unverified') as VerificationStatus,
      manufacturer: asString(raw['manufacturer']),
      model: asString(raw['model']),
      classMarking: (asString(raw['classMarking']) || 'unknown') as DroneClass,
      droneSerialNumber: asString(raw['droneSerialNumber']),
      controllerSerialNumber: asString(raw['controllerSerialNumber']),
      linkedPilotId: asString(raw['linkedPilotId']),
      defaultOperatorId: asString(raw['defaultOperatorId']),
      activeOperatorId: asOptString(raw['activeOperatorId']),
      activeOperatorUntil: asOptString(raw['activeOperatorUntil']),
      activeOperatorSetAt: asString(raw['activeOperatorSetAt']),
      activeOperatorSetBy: asString(raw['activeOperatorSetBy']),
      activeOperatorReason: asString(raw['activeOperatorReason']),
      insuranceId: asOptString(raw['insuranceId']),
      createdAt: asString(raw['createdAt']),
      updatedAt: asString(raw['updatedAt']),
      publishedAt: asString(raw['publishedAt']),
      lastVerifiedAt: asString(raw['lastVerifiedAt']),
    };
    if (!drone.slug) { skipped += 1; continue; }

    const effOpId = effectiveOperatorId(drone);

    // Resolve linked entities. Each is a doc lookup; the script runs as
    // an admin so it can read across users.
    const [opSnap, pilotSnap, insSnap, userSnap] = await Promise.all([
      effOpId ? getDoc(doc(db, 'operators', effOpId)) : Promise.resolve(null),
      drone.linkedPilotId ? getDoc(doc(db, 'pilots', drone.linkedPilotId)) : Promise.resolve(null),
      drone.insuranceId ? getDoc(doc(db, 'insurances', drone.insuranceId)) : Promise.resolve(null),
      getDoc(doc(db, 'users', drone.userId)),
    ]);
    const op = opSnap && opSnap.exists() ? (opSnap.data() as unknown as Operator) : null;
    const pilot = pilotSnap && pilotSnap.exists() ? (pilotSnap.data() as unknown as Pilot) : null;
    const insurance = insSnap && insSnap.exists() ? (insSnap.data() as unknown as Insurance) : null;
    const userRaw = userSnap?.exists() ? (userSnap.data() as Record<string, unknown>) : null;
    const userStr = (k: string) => (typeof userRaw?.[k] === 'string' ? (userRaw[k] as string) : '');

    let holderKind: DronePublicSnapshot['holderKind'] = 'pilot';
    let holderDisplayName = '—';
    if (op) {
      holderKind = op.kind === 'company' ? 'operator-company' : 'operator-private';
      holderDisplayName = operatorDisplayName(op);
    } else if (pilot) {
      holderKind = 'pilot';
      holderDisplayName = pilotDisplayName(pilot);
    }
    const insuranceStatus: PolicyStatus = insurance ? computePolicyStatus(insurance) : 'missing';

    const snapshot: DronePublicSnapshot = {
      slug: drone.slug,
      droneId: drone.id,
      verificationStatus: drone.verificationStatus,
      lastVerifiedAt: drone.lastVerifiedAt,
      publishedAt: drone.publishedAt,
      holderKind,
      holderDisplayName,
      manufacturer: drone.manufacturer,
      model: drone.model,
      classMarking: drone.classMarking,
      droneSerialNumber: drone.droneSerialNumber,
      insuranceStatus,
      insuranceProvider: insurance?.provider ?? '',
      insuranceValidUntil: insurance?.expiryDate ?? '',
      insuranceMaskedPolicyNumber: insurance?.policyNumber ? maskPolicyNumber(insurance.policyNumber) : '',
      insurancePdfUrl: insurance?.pdfUrl ?? '',
      profilePhotoUrl: userStr('profilePhotoUrl'),
      logoUrl: userStr('logoUrl'),
      bannerUrl: userStr('bannerUrl'),
      updatedAt: new Date().toISOString(),
    };

    if (args.dryRun) {
      console.log(`[backfill] DRY-RUN ${drone.slug} → kind=${holderKind} insurance=${insuranceStatus}`);
    } else {
      await setDoc(doc(db, 'dronesPublic', drone.slug), snapshot);
      console.log(`[backfill] ${drone.slug}`);
    }
    written += 1;
  }

  console.log('');
  console.log('[backfill-drones-public] summary');
  console.log(`  written:           ${args.dryRun ? `(dry-run) ${written}` : written}`);
  console.log(`  skipped (no slug): ${skipped}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
