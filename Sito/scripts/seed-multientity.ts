/**
 * Seed a single demo user into the new multi-entity model.
 *
 * Creates:
 *   • users/{uid}                — one private-individual account
 *   • pilots/{uid}               — pilot identity
 *   • operators/{opId} × 2       — one default (private) + one company
 *   • drones/{droneId}           — one C2 drone with random slug
 *   • insurances/{insId}         — linked to the drone
 *   • certificates/{certId}      — A1/A3
 *   • documents/{docId}          — one PDF stub
 *   • slots/{uid}                — base plan caps
 *
 * Idempotent: re-running with the same uid + slug input returns early if a
 * drone with `migration.sourceSeed === 'seed-multientity'` already exists
 * for that user.
 *
 * Env (.env.local):
 *   NEXT_PUBLIC_FIREBASE_*
 *   SEED_AUTH_EMAIL / SEED_AUTH_PASSWORD
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/seed-multientity.ts [<uid>]
 *
 * If no uid is passed, defaults to the signed-in user's uid.
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

import { BASE_SLOTS } from '../src/lib/types/entities';
import { generateDroneSlug } from '../src/lib/utils/entities';

async function main() {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? '';
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? '';
  const seedEmail = process.env.SEED_AUTH_EMAIL ?? '';
  const seedPassword = process.env.SEED_AUTH_PASSWORD ?? '';

  if (!apiKey || !projectId) {
    console.error('Missing NEXT_PUBLIC_FIREBASE_* env. Use --env-file=.env.local.');
    process.exit(1);
  }
  if (!seedEmail || !seedPassword) {
    console.error('Missing SEED_AUTH_EMAIL / SEED_AUTH_PASSWORD env.');
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
  const cred = await signInWithEmailAndPassword(auth, seedEmail, seedPassword);
  const db = getFirestore(app);

  const uid = (process.argv[2] || cred.user.uid).trim();
  if (!uid) {
    console.error('Could not determine target uid.');
    process.exit(1);
  }

  // ─── Idempotency check ────────────────────────────────────────────────────
  const existing = await getDocs(query(
    collection(db, 'drones'),
    where('userId', '==', uid),
    where('migration.sourceSeed', '==', 'seed-multientity'),
    limit(1),
  ));
  if (!existing.empty) {
    const d = existing.docs[0];
    console.log(`[seed] already seeded; existing drone ${d.id} slug=${(d.data() as { slug?: string }).slug ?? ''}`);
    process.exit(0);
  }

  const now = new Date().toISOString();
  const slug = generateDroneSlug();

  // 1) users/{uid}
  const userRef = doc(db, 'users', uid);
  if (!(await getDoc(userRef)).exists()) {
    await setDoc(userRef, {
      uid,
      email: seedEmail,
      accountType: 'private',
      firstName: 'Demo',
      lastName: 'Pilot',
      dateOfBirth: '1990-04-15',
      phone: '+39 320 0000000',
      address: { line1: 'Via Demo 1', line2: '', city: 'Milano', postalCode: '20100', country: 'Italy' },
      companyName: '',
      companyContactPerson: '',
      companyVat: '',
      companyUniqueNumber: '',
      createdAt: now,
      updatedAt: now,
      migration: { sourceSeed: 'seed-multientity' },
    });
  }

  // 2) pilots/{uid}
  await setDoc(doc(db, 'pilots', uid), {
    userId: uid,
    firstName: 'Demo',
    lastName: 'Pilot',
    dateOfBirth: '1990-04-15',
    nationality: 'Italian',
    email: seedEmail,
    phone: '+39 320 0000000',
    address: { line1: 'Via Demo 1', line2: '', city: 'Milano', postalCode: '20100', country: 'Italy' },
    operatorCode: 'IT-OP-DEMO-0001',
    operatorLicense: 'IT-RPL-A2-DEMO',
    emergencyContact: '+39 320 0000001',
    createdAt: now,
    updatedAt: now,
    migration: { sourceSeed: 'seed-multientity' },
  }, { merge: true });

  // 3) operators × 2 (default private + company)
  const op1Ref = await addDoc(collection(db, 'operators'), {
    userId: uid,
    kind: 'private',
    label: 'Demo Pilot (default)',
    isDefault: true,
    private: {
      firstName: 'Demo',
      lastName: 'Pilot',
      dateOfBirth: '1990-04-15',
      email: seedEmail,
      phone: '+39 320 0000000',
      address: { line1: 'Via Demo 1', line2: '', city: 'Milano', postalCode: '20100', country: 'Italy' },
    },
    company: {
      companyName: '',
      contactPerson: '',
      vatNumber: '',
      uniqueCompanyNumber: '',
      email: '',
      address: { line1: '', line2: '', city: '', postalCode: '', country: '' },
    },
    createdAt: now,
    updatedAt: now,
    migration: { sourceSeed: 'seed-multientity' },
  });
  const op2Ref = await addDoc(collection(db, 'operators'), {
    userId: uid,
    kind: 'company',
    label: 'Demo Aerial Services SRL',
    isDefault: false,
    private: {
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      email: '',
      phone: '',
      address: { line1: '', line2: '', city: '', postalCode: '', country: '' },
    },
    company: {
      companyName: 'Demo Aerial Services SRL',
      contactPerson: 'Demo Pilot',
      vatNumber: 'IT01234567890',
      uniqueCompanyNumber: 'REA MI-1234567',
      email: 'ops@demo-aerial.example',
      address: { line1: 'Via Aziende 7', line2: '', city: 'Milano', postalCode: '20121', country: 'Italy' },
    },
    createdAt: now,
    updatedAt: now,
    migration: { sourceSeed: 'seed-multientity' },
  });

  // 4) insurance
  const insRef = await addDoc(collection(db, 'insurances'), {
    userId: uid,
    link: 'drone',
    droneId: null,
    operatorId: null,
    provider: 'Allianz Aviation',
    policyNumber: 'AV-DEMO-78901-IT',
    issueDate: '2026-01-01',
    expiryDate: '2026-12-31',
    notes: '',
    pdfUrl: '',
    verificationStatus: 'verified',
    createdAt: now,
    updatedAt: now,
    migration: { sourceSeed: 'seed-multientity' },
  });

  // 5) drone
  const droneRef = await addDoc(collection(db, 'drones'), {
    userId: uid,
    slug,
    status: 'active',
    visibility: 'public',
    verificationStatus: 'verified',
    manufacturer: 'DJI',
    model: 'Mavic 3 Pro',
    classMarking: 'C2',
    droneSerialNumber: '1ZNDEMOSERIAL00',
    controllerSerialNumber: 'CTRL-DEMO-001',
    linkedPilotId: uid,
    defaultOperatorId: op1Ref.id,
    activeOperatorId: null,
    activeOperatorUntil: null,
    activeOperatorSetAt: '',
    activeOperatorSetBy: '',
    activeOperatorReason: '',
    insuranceId: insRef.id,
    createdAt: now,
    updatedAt: now,
    publishedAt: now,
    lastVerifiedAt: now,
    migration: { sourceSeed: 'seed-multientity' },
  });

  // 5b) backfill droneId on the insurance
  await setDoc(doc(db, 'insurances', insRef.id), {
    droneId: droneRef.id,
    updatedAt: new Date().toISOString(),
  }, { merge: true });

  // 6) certificate (A1/A3)
  const certRef = await addDoc(collection(db, 'certificates'), {
    userId: uid,
    kind: 'A1_A3',
    label: 'Open Category A1/A3',
    issuedBy: 'ENAC',
    issuedAt: '2025-06-01',
    expiresAt: '2030-06-01',
    fileUrl: '',
    verificationStatus: 'verified',
    notes: '',
    createdAt: now,
    updatedAt: now,
    migration: { sourceSeed: 'seed-multientity' },
  });

  // 7) document
  const docRef = await addDoc(collection(db, 'documents'), {
    userId: uid,
    kind: 'training_certificate',
    label: 'A2 training certificate (PDF)',
    fileUrl: '',
    fileName: 'a2-training.pdf',
    fileSize: 0,
    mimeType: 'application/pdf',
    verificationStatus: 'unverified',
    notes: 'Demo placeholder uploaded by seed-multientity.',
    createdAt: now,
    updatedAt: now,
    migration: { sourceSeed: 'seed-multientity' },
  });

  // 8) slots
  await setDoc(doc(db, 'slots', uid), {
    userId: uid,
    ...BASE_SLOTS,
    createdAt: now,
    updatedAt: now,
  }, { merge: true });

  console.log('[seed] OK');
  console.log(`  uid:           ${uid}`);
  console.log(`  drone slug:    ${slug}`);
  console.log(`  drone id:      ${droneRef.id}`);
  console.log(`  default op:    ${op1Ref.id}`);
  console.log(`  alt op:        ${op2Ref.id}`);
  console.log(`  insurance:     ${insRef.id}`);
  console.log(`  certificate:   ${certRef.id}`);
  console.log(`  document:      ${docRef.id}`);
  console.log('');
  console.log(`  Public URL: http://localhost:3000/u/${slug}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
