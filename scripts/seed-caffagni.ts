/**
 * One-off script to seed Michele Caffagni's operator profile.
 * Run with: npx tsx scripts/seed-caffagni.ts
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const firebaseConfig = {
  apiKey: 'AIzaSyBiq0rq6m-vPzZGqRTiFtAlVYu43OtHLf4',
  authDomain: 'dronetag-e905d.firebaseapp.com',
  projectId: 'dronetag-e905d',
  storageBucket: 'dronetag-e905d.firebasestorage.app',
  messagingSenderId: '521750670087',
  appId: '1:521750670087:web:74d2ca29c435495f1533a2',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

const PDF_BASE = '/Users/wepopagani/Library/Application Support/Cursor/User/workspaceStorage/91ffa2bc6d12b1b60aab2971e1696e1e/pdfs';

async function uploadPdf(localPath: string, storagePath: string): Promise<string> {
  const bytes = readFileSync(localPath);
  const storageRef = ref(storage, storagePath);
  await uploadBytes(storageRef, bytes, { contentType: 'application/pdf' });
  const url = await getDownloadURL(storageRef);
  console.log(`  ✓ Uploaded: ${storagePath}`);
  return url;
}

async function main() {
  console.log('Creating Michele Caffagni profile...\n');

  const profileId = 'michele-caffagni-001';
  const now = new Date().toISOString();

  // Upload insurance PDF
  console.log('Uploading documents to Firebase Storage...');
  const policyPdfUrl = await uploadPdf(
    resolve(PDF_BASE, 'fbeb32b9-e95a-410c-9a0f-3030d7d6d214/Evidence_of_Cover_360 Drone.pdf'),
    `profiles/${profileId}/insurance/policy.pdf`,
  );

  // Upload QR code
  const qrPdfUrl = await uploadPdf(
    resolve(PDF_BASE, 'a369540c-4c93-486d-a68a-b2dd9125c7d9/QR operatore - 360 Drone.pdf'),
    `profiles/${profileId}/assets/qr-operatore.pdf`,
  );

  // Upload additional documents
  const stsEasaUrl = await uploadPdf(
    resolve(PDF_BASE, '30faad93-4fa3-4d48-9f86-8180aa94044f/Atttestato STS EASA - Michele Caffagni.pdf'),
    `profiles/${profileId}/documents/attestato-sts-easa.pdf`,
  );

  const stsPraticoUrl = await uploadPdf(
    resolve(PDF_BASE, 'e505d635-20d1-497d-99bd-5df80c558c8a/Attestato_pratico_STS01_CFFMHL90L04D442O.pdf'),
    `profiles/${profileId}/documents/attestato-pratico-sts01.pdf`,
  );

  const a2Url = await uploadPdf(
    resolve(PDF_BASE, '0d16d9f3-a3c0-42af-9dff-73979498d76e/Attestato A2 - Michele Caffagni.pdf'),
    `profiles/${profileId}/documents/attestato-a2.pdf`,
  );

  const qrDflightUrl = await uploadPdf(
    resolve(PDF_BASE, 'd3ac8f61-adca-4a1c-902c-45d27a1ccdd4/QR operatore D-Flight - 360 Drone.pdf'),
    `profiles/${profileId}/documents/qr-dflight.pdf`,
  );

  // Create profile document
  console.log('\nCreating Firestore profile...');
  const profileData = {
    slug: 'michele-caffagni-360drone',
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
      operatorCode: 'ITA532aojeuto7j9',
      operatorLicense: 'ITA-RP-000000522aba',
      emergencyContact: '',
    },

    organization: {
      companyName: '360° Drone di Michele Caffagni',
      companyDetails: 'Proprietario e operatore di sistemi aerei senza pilota (UAS). Uso commerciale con copertura mondiale.',
      companyAddress: 'Salita della Resistenza 1, Deiva Marina (SP), 19013, Italy',
      companyVatOrRegistration: '',
    },

    drone: {
      droneName: 'DJI Mini 4 Pro',
      droneModel: 'DJI Mini 4 Pro',
      droneSerialNumber: '',
      droneRegistrationCode: '',
    },

    insurance: {
      provider: 'Coverdrone (Starr Europe Insurance 75% / Travelers Insurance 25%)',
      policyNumber: 'CDA22360114EUR',
      issueDate: '2025-09-09',
      expiryDate: '2026-09-08',
      notes: 'Responsabilità verso terzi: €1.300.000 per evento. Copertura mondiale. Conforme a Regolamento UE (EC) N. 785/2004. Franchigia danni proprietà: €110.',
      pdfUrl: policyPdfUrl,
    },

    assets: {
      profilePhotoUrl: '',
      logoUrl: '',
      bannerUrl: '',
      qrCodeUrl: qrPdfUrl,
      nfcReference: '',
    },

    documents: [
      {
        id: 'doc-sts-easa',
        type: 'training_certificate',
        label: 'Certificato conoscenza teorica STS (EASA)',
        fileUrl: stsEasaUrl,
        issuedAt: '',
        expiresAt: '2030-04-03',
        notes: 'ITA-RP-000000766aeb',
      },
      {
        id: 'doc-sts01-pratico',
        type: 'training_certificate',
        label: 'Attestato pratico STS-01',
        fileUrl: stsPraticoUrl,
        issuedAt: '2024-12-29',
        expiresAt: '',
        notes: 'ITA-STS01-000001023 — Training Coordinator: Marco Rapolla',
      },
      {
        id: 'doc-a2',
        type: 'operator_license',
        label: 'Certificato di competenza A2',
        fileUrl: a2Url,
        issuedAt: '',
        expiresAt: '2026-10-25',
        notes: 'ITA-RP-000000522aba',
      },
      {
        id: 'doc-qr-dflight',
        type: 'drone_registration',
        label: 'QR Operatore D-Flight',
        fileUrl: qrDflightUrl,
        issuedAt: '',
        expiresAt: '',
        notes: 'Registrazione D-Flight operatore UAS',
      },
    ],

    admin: {
      internalNotes: 'Profilo reale. Documenti caricati da PDF originali.',
      lastEditedBy: 'system-seed',
    },
  };

  const docRef = await addDoc(collection(db, 'profiles'), profileData);
  console.log(`\n✅ Profile created successfully!`);
  console.log(`   ID: ${docRef.id}`);
  console.log(`   Slug: ${profileData.slug}`);
  console.log(`   Name: ${profileData.person.firstName} ${profileData.person.lastName}`);
  console.log(`   Organization: ${profileData.organization.companyName}`);
  console.log(`   Policy: ${profileData.insurance.policyNumber}`);
  console.log(`   Documents: ${profileData.documents.length} uploaded`);
  console.log(`\n   Public page: http://localhost:3000/u/${profileData.slug}`);

  process.exit(0);
}

main().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});
