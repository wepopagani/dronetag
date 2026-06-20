/**
 * Migrate legacy `profiles/*` documents into the multi-entity model.
 *
 * For each profile, this script creates (idempotently):
 *   • users/{ownerUid}              — only if ownerUid is provided / inferred
 *   • pilots/{ownerUid}             — pilot identity from profile.person
 *   • operators/{newOpId}           — one default operator (kind chosen from
 *                                      profile shape: company if companyName,
 *                                      else private)
 *   • drones/{newDroneId}           — slug PRESERVED so existing QR/NFC
 *                                      cards keep working
 *   • insurances/{newInsId}         — when profile.insurance has data
 *   • documents/{newDocId} per      — for each item in profile.documents[]
 *     legacy embedded document
 *   • slots/{ownerUid}              — base plan caps
 *
 * Idempotency:
 *   The drone document records `migration.sourceProfileId` on first write.
 *   Subsequent runs query for that field and skip already-migrated profiles.
 *
 * Owner uid:
 *   Legacy profiles have no `userId` field. Pass the owner via either:
 *     • CLI arg #2 — single uid applied to ALL unowned profiles, OR
 *     • a JSON map file at ./scripts/migration-owners.json shaped as
 *       { "<profileId>": "<uid>", "<slug>": "<uid>", ... }
 *   Profiles whose owner can't be resolved are listed and skipped.
 *
 * Env (.env.local):
 *   NEXT_PUBLIC_FIREBASE_*       — Firebase web config
 *   SEED_AUTH_EMAIL              — admin user (must satisfy firestore.rules)
 *   SEED_AUTH_PASSWORD
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/migrate-profiles-to-entities.ts \
 *     [--dry-run] [--default-uid <uid>] [--owners ./scripts/migration-owners.json]
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  limit,
  query,
  setDoc,
  where,
} from 'firebase/firestore';
import { readFileSync } from 'fs';
import { resolve } from 'path';

import { BASE_SLOTS } from '../src/lib/types/entities';

// ─── CLI parsing ────────────────────────────────────────────────────────────

interface Args {
  dryRun: boolean;
  defaultUid: string | null;
  ownersFile: string | null;
}

function parseArgs(argv: string[]): Args {
  const out: Args = { dryRun: false, defaultUid: null, ownersFile: null };
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--dry-run') out.dryRun = true;
    else if (a === '--default-uid') { out.defaultUid = argv[++i] ?? null; }
    else if (a === '--owners') { out.ownersFile = argv[++i] ?? null; }
  }
  return out;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function loadOwnersMap(path: string | null): Record<string, string> {
  if (!path) return {};
  try {
    const buf = readFileSync(resolve(path), 'utf-8');
    const json = JSON.parse(buf);
    if (json && typeof json === 'object') return json as Record<string, string>;
  } catch (e) {
    console.warn(`[migrate] could not read owners file ${path}:`, e);
  }
  return {};
}

function isStrObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function str(o: Record<string, unknown> | undefined, k: string): string {
  if (!o) return '';
  return typeof o[k] === 'string' ? (o[k] as string) : '';
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs(process.argv);
  const ownersMap = loadOwnersMap(args.ownersFile);

  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? '';
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? '';
  const seedEmail = process.env.SEED_AUTH_EMAIL ?? '';
  const seedPassword = process.env.SEED_AUTH_PASSWORD ?? '';

  if (!apiKey || !projectId) {
    console.error('Missing NEXT_PUBLIC_FIREBASE_* env. Use --env-file=.env.local.');
    process.exit(1);
  }
  if (!seedEmail || !seedPassword) {
    console.error('Missing SEED_AUTH_EMAIL / SEED_AUTH_PASSWORD env. Required to satisfy firestore.rules.');
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

  console.log(`[migrate] starting (dry-run=${args.dryRun})`);

  // Collision check on slugs.
  const profilesSnap = await getDocs(collection(db, 'profiles'));
  const slugCounts = new Map<string, number>();
  for (const p of profilesSnap.docs) {
    const s = String((p.data() as { slug?: unknown }).slug ?? '').trim();
    if (!s) continue;
    slugCounts.set(s, (slugCounts.get(s) ?? 0) + 1);
  }
  const dupes = [...slugCounts.entries()].filter(([, n]) => n > 1);
  if (dupes.length > 0) {
    console.error('[migrate] aborting: duplicate slugs detected:');
    for (const [s, n] of dupes) console.error(`  ${s} → ${n} profiles`);
    process.exit(2);
  }

  let migrated = 0;
  let skippedAlready = 0;
  let skippedNoOwner = 0;
  const unresolved: string[] = [];

  for (const profileSnap of profilesSnap.docs) {
    const id = profileSnap.id;
    const data = profileSnap.data() as Record<string, unknown>;
    const slug = str(data, 'slug');
    if (!slug) {
      console.warn(`[migrate] profile ${id}: missing slug, skipping`);
      continue;
    }

    // Resolve owner uid.
    const inferredUid: string =
      ownersMap[id] ?? ownersMap[slug] ?? args.defaultUid ?? '';
    if (!inferredUid) {
      unresolved.push(`${id} (slug=${slug})`);
      skippedNoOwner += 1;
      continue;
    }

    // Idempotency: skip if a drone already references this profile.
    const existing = await getDocs(query(
      collection(db, 'drones'),
      where('migration.sourceProfileId', '==', id),
      limit(1),
    ));
    if (!existing.empty) {
      skippedAlready += 1;
      continue;
    }

    const person = isStrObj(data['person']) ? (data['person'] as Record<string, unknown>) : {};
    const org = isStrObj(data['organization']) ? (data['organization'] as Record<string, unknown>) : {};
    const droneOld = isStrObj(data['drone']) ? (data['drone'] as Record<string, unknown>) : {};
    const insOld = isStrObj(data['insurance']) ? (data['insurance'] as Record<string, unknown>) : {};
    const docsOld = Array.isArray(data['documents']) ? (data['documents'] as Record<string, unknown>[]) : [];

    const hasCompany = Boolean(str(org, 'companyName'));
    const operatorKind: 'private' | 'company' = hasCompany ? 'company' : 'private';
    const now = new Date().toISOString();

    if (args.dryRun) {
      console.log(`[migrate] DRY-RUN profile ${id} → uid=${inferredUid} kind=${operatorKind} slug=${slug}`);
      migrated += 1;
      continue;
    }

    // 1) users/{uid} — only create if missing.
    const userRef = doc(db, 'users', inferredUid);
    const existingUser = await getDoc(userRef);
    if (!existingUser.exists()) {
      await setDoc(userRef, {
        uid: inferredUid,
        email: str(person, 'email'),
        accountType: hasCompany ? 'company' : 'private',
        firstName: str(person, 'firstName'),
        lastName: str(person, 'lastName'),
        dateOfBirth: str(person, 'birthDate'),
        phone: '',
        address: { line1: '', line2: '', city: '', postalCode: '', country: '' },
        companyName: str(org, 'companyName'),
        companyContactPerson: '',
        companyVat: str(org, 'companyVatOrRegistration'),
        companyUniqueNumber: '',
        createdAt: now,
        updatedAt: now,
        migration: { sourceProfileId: id },
      });
    }

    // 2) pilots/{uid} — singleton per user.
    const pilotRef = doc(db, 'pilots', inferredUid);
    const existingPilot = await getDoc(pilotRef);
    if (!existingPilot.exists()) {
      await setDoc(pilotRef, {
        userId: inferredUid,
        firstName: str(person, 'firstName'),
        lastName: str(person, 'lastName'),
        dateOfBirth: str(person, 'birthDate'),
        nationality: str(person, 'nationality'),
        email: str(person, 'email'),
        phone: '',
        address: { line1: '', line2: '', city: '', postalCode: '', country: '' },
        operatorCode: str(person, 'operatorCode'),
        operatorLicense: str(person, 'operatorLicense'),
        emergencyContact: str(person, 'emergencyContact'),
        createdAt: now,
        updatedAt: now,
        migration: { sourceProfileId: id },
      });
    }

    // 3) operators/{newOpId}
    const operatorRef = await addDoc(collection(db, 'operators'), {
      userId: inferredUid,
      kind: operatorKind,
      label: hasCompany
        ? str(org, 'companyName')
        : `${str(person, 'firstName')} ${str(person, 'lastName')}`.trim() || 'Operator',
      isDefault: true,
      private: {
        firstName: str(person, 'firstName'),
        lastName: str(person, 'lastName'),
        dateOfBirth: str(person, 'birthDate'),
        email: str(person, 'email'),
        phone: '',
        address: { line1: '', line2: '', city: '', postalCode: '', country: '' },
      },
      company: {
        companyName: str(org, 'companyName'),
        contactPerson: '',
        vatNumber: str(org, 'companyVatOrRegistration'),
        uniqueCompanyNumber: '',
        email: str(person, 'email'),
        address: { line1: '', line2: '', city: '', postalCode: '', country: '' },
      },
      createdAt: now,
      updatedAt: now,
      migration: { sourceProfileId: id },
    });

    // 4) insurances/{newInsId} — only if there's anything to record.
    let insuranceId: string | null = null;
    if (str(insOld, 'provider') || str(insOld, 'policyNumber') || str(insOld, 'expiryDate')) {
      const insRef = await addDoc(collection(db, 'insurances'), {
        userId: inferredUid,
        link: 'drone',
        droneId: null, // backfilled below
        operatorId: null,
        provider: str(insOld, 'provider'),
        policyNumber: str(insOld, 'policyNumber'),
        issueDate: str(insOld, 'issueDate'),
        expiryDate: str(insOld, 'expiryDate'),
        notes: str(insOld, 'notes'),
        pdfUrl: str(insOld, 'pdfUrl'),
        verificationStatus: 'unverified',
        createdAt: now,
        updatedAt: now,
        migration: { sourceProfileId: id },
      });
      insuranceId = insRef.id;
    }

    // 5) drones/{newDroneId} with PRESERVED slug.
    const droneRef = await addDoc(collection(db, 'drones'), {
      userId: inferredUid,
      slug,
      status: str(data, 'status') || 'active',
      visibility: str(data, 'visibility') || 'public',
      verificationStatus: str(data, 'verificationStatus') || 'unverified',
      manufacturer: '',  // legacy didn't split manufacturer / model
      model: str(droneOld, 'droneModel'),
      classMarking: 'unknown',
      droneSerialNumber: str(droneOld, 'droneSerialNumber'),
      controllerSerialNumber: '',
      linkedPilotId: inferredUid,
      defaultOperatorId: operatorRef.id,
      activeOperatorId: null,
      activeOperatorUntil: null,
      activeOperatorSetAt: '',
      activeOperatorSetBy: '',
      activeOperatorReason: '',
      insuranceId,
      createdAt: str(data, 'createdAt') || now,
      updatedAt: now,
      publishedAt: str(data, 'publishedAt'),
      lastVerifiedAt: str(data, 'lastVerifiedAt'),
      migration: { sourceProfileId: id, sourceSlug: slug },
    });

    // 5b) backfill insurance.droneId.
    if (insuranceId) {
      await setDoc(
        doc(db, 'insurances', insuranceId),
        { droneId: droneRef.id, updatedAt: new Date().toISOString() },
        { merge: true },
      );
    }

    // 6) documents/* per legacy embedded entry.
    for (const docOld of docsOld) {
      if (!isStrObj(docOld)) continue;
      await addDoc(collection(db, 'documents'), {
        userId: inferredUid,
        kind: str(docOld, 'type') || 'other',
        label: str(docOld, 'label'),
        fileUrl: str(docOld, 'fileUrl'),
        fileName: '',
        fileSize: 0,
        mimeType: '',
        verificationStatus: 'unverified',
        notes: str(docOld, 'notes'),
        createdAt: now,
        updatedAt: now,
        migration: { sourceProfileId: id, sourceDocumentId: str(docOld, 'id') },
      });
    }

    // 7) slots/{uid} — base plan if missing.
    const slotsRef = doc(db, 'slots', inferredUid);
    const existingSlots = await getDoc(slotsRef);
    if (!existingSlots.exists()) {
      await setDoc(slotsRef, {
        userId: inferredUid,
        ...BASE_SLOTS,
        createdAt: now,
        updatedAt: now,
      });
    }

    migrated += 1;
    console.log(`[migrate] ${id} → drone ${droneRef.id} (slug=${slug}, op=${operatorRef.id})`);
  }

  console.log('');
  console.log('[migrate] summary');
  console.log(`  migrated:        ${migrated}`);
  console.log(`  skipped (done):  ${skippedAlready}`);
  console.log(`  skipped (owner): ${skippedNoOwner}`);
  if (unresolved.length > 0) {
    console.log('');
    console.log('[migrate] profiles missing an owner mapping:');
    for (const u of unresolved) console.log(`  ${u}`);
    console.log('');
    console.log('Provide --default-uid <uid> or --owners <map.json> to migrate them.');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
