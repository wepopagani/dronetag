/**
 * One-off: upload a QR PNG to Firebase Storage and stamp the URL onto a
 * legacy profile document.
 *
 * Reads Firebase config + an admin login from the environment (.env.local).
 * Never commit credentials. Run with:
 *
 *   npx tsx --env-file=.env.local scripts/upload-qr.ts \
 *     <slug> [<local-png-path>]
 *
 * Required env vars:
 *   NEXT_PUBLIC_FIREBASE_*
 *   SEED_AUTH_EMAIL / SEED_AUTH_PASSWORD  (a user with admin custom claim)
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import {
  collection,
  doc,
  getDocs,
  getFirestore,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';
import { readFileSync } from 'fs';

async function main() {
  const slug = (process.argv[2] || '').trim();
  const localPath = (process.argv[3] || '/tmp/qr.png').trim();
  if (!slug) {
    console.error('Usage: npx tsx --env-file=.env.local scripts/upload-qr.ts <slug> [<local-png>]');
    process.exit(1);
  }

  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? '';
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? '';
  const seedEmail = process.env.SEED_AUTH_EMAIL ?? '';
  const seedPassword = process.env.SEED_AUTH_PASSWORD ?? '';

  if (!apiKey || !projectId) {
    console.error('Missing NEXT_PUBLIC_FIREBASE_* env. Use --env-file=.env.local.');
    process.exit(1);
  }
  if (!seedEmail || !seedPassword) {
    console.error('Missing SEED_AUTH_EMAIL / SEED_AUTH_PASSWORD env (admin user).');
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
  const storage = getStorage(app);

  const bytes = readFileSync(localPath);
  const path = `users/${cred.user.uid}/profiles/${slug}/qr.png`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, bytes, { contentType: 'image/png' });
  const qrUrl = await getDownloadURL(storageRef);
  console.log(`[upload-qr] uploaded → ${path}`);

  const snap = await getDocs(query(collection(db, 'profiles'), where('slug', '==', slug)));
  if (snap.empty) {
    console.error(`[upload-qr] No profile with slug "${slug}".`);
    process.exit(2);
  }
  const profileDoc = snap.docs[0]!;
  await updateDoc(doc(db, 'profiles', profileDoc.id), {
    'assets.qrCodeUrl': qrUrl,
    updatedAt: new Date().toISOString(),
  });

  console.log(`[upload-qr] profile ${profileDoc.id} updated with QR URL.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
