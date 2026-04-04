import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { readFileSync } from 'fs';

const app = initializeApp({
  apiKey: 'AIzaSyBiq0rq6m-vPzZGqRTiFtAlVYu43OtHLf4',
  authDomain: 'dronetag-e905d.firebaseapp.com',
  projectId: 'dronetag-e905d',
  storageBucket: 'dronetag-e905d.firebasestorage.app',
  messagingSenderId: '521750670087',
  appId: '1:521750670087:web:74d2ca29c435495f1533a2',
});

const db = getFirestore(app);
const storage = getStorage(app);

async function main() {
  // Upload QR image
  const bytes = readFileSync('/tmp/qr-360drone.png');
  const storageRef = ref(storage, 'profiles/michele-caffagni-001/assets/qr.png');
  await uploadBytes(storageRef, bytes, { contentType: 'image/png' });
  const qrUrl = await getDownloadURL(storageRef);
  console.log('✓ QR image uploaded:', qrUrl);

  // Find profile by slug
  const q = query(collection(db, 'profiles'), where('slug', '==', 'michele-caffagni-360drone'));
  const snap = await getDocs(q);
  if (snap.empty) { console.error('Profile not found'); process.exit(1); }

  const profileDoc = snap.docs[0];
  await updateDoc(doc(db, 'profiles', profileDoc.id), {
    'assets.qrCodeUrl': qrUrl,
    updatedAt: new Date().toISOString(),
  });

  console.log('✅ Profile updated with QR image!');
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
