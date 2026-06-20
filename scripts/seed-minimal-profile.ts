/**
 * Crea un profilo pubblico minimo (per test URL /u/<slug>).
 * Richiede un utente Firebase con permesso di scrittura su `profiles`.
 *
 * In .env.local aggiungi (oltre alle NEXT_PUBLIC_FIREBASE_*):
 *   SEED_AUTH_EMAIL=...
 *   SEED_AUTH_PASSWORD=...
 *
 * Esegui dalla cartella Sito:
 *   npx tsx --env-file=.env.local scripts/seed-minimal-profile.ts
 *   npx tsx --env-file=.env.local scripts/seed-minimal-profile.ts mio-slug-di-prova
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { addDoc, collection, getFirestore } from 'firebase/firestore';

const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? '';
const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '';
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? '';
const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '';
const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '';
const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? '';

const email = process.env.SEED_AUTH_EMAIL ?? '';
const password = process.env.SEED_AUTH_PASSWORD ?? '';

async function main() {
  const slug = (process.argv[2] || 'michele-caffagni-360drone').trim();
  if (!apiKey || !projectId) {
    console.error('Mancano NEXT_PUBLIC_FIREBASE_* in .env.local');
    process.exit(1);
  }
  if (!email || !password) {
    console.error('Imposta SEED_AUTH_EMAIL e SEED_AUTH_PASSWORD in .env.local (stesso progetto Firebase).');
    process.exit(1);
  }

  const app = initializeApp({
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
  });
  const auth = getAuth(app);
  await signInWithEmailAndPassword(auth, email, password);
  const db = getFirestore(app);
  const now = new Date().toISOString();

  const ref = await addDoc(collection(db, 'profiles'), {
    slug,
    language: 'it',
    status: 'active',
    visibility: 'public',
    verificationStatus: 'verified',
    createdAt: now,
    updatedAt: now,
    publishedAt: now,
    lastVerifiedAt: now,
    person: {
      firstName: 'Michele',
      lastName: 'Caffagni',
      birthDate: '',
      nationality: 'Italian',
      operatorCode: 'ITA-DEMO-001',
      operatorLicense: '',
      emergencyContact: '',
    },
    organization: {
      companyName: '360° Drone (demo)',
      companyDetails: 'Profilo di test da script seed-minimal-profile.',
      companyAddress: '',
      companyVatOrRegistration: '',
    },
    drone: {
      droneName: '',
      droneModel: '',
      droneSerialNumber: '',
      droneRegistrationCode: '',
    },
    insurance: {
      provider: '—',
      policyNumber: '',
      issueDate: '',
      expiryDate: '',
      notes: '',
      pdfUrl: '',
    },
    assets: {
      profilePhotoUrl: '',
      logoUrl: '',
      bannerUrl: '',
      qrCodeUrl: '',
      nfcReference: '',
    },
    documents: [],
    admin: {
      internalNotes: 'seed-minimal-profile.ts',
      lastEditedBy: 'seed-script',
    },
  });

  console.log('OK profilo creato');
  console.log('  id documento:', ref.id);
  console.log('  slug:', slug);
  console.log('  URL:', `http://localhost:3000/u/${slug}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
