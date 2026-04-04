/**
 * One-off script to create an admin user in Firebase Authentication.
 * Run with: npx tsx scripts/create-admin.ts
 */

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyBiq0rq6m-vPzZGqRTiFtAlVYu43OtHLf4',
  authDomain: 'dronetag-e905d.firebaseapp.com',
  projectId: 'dronetag-e905d',
  storageBucket: 'dronetag-e905d.firebasestorage.app',
  messagingSenderId: '521750670087',
  appId: '1:521750670087:web:74d2ca29c435495f1533a2',
};

const ADMIN_EMAIL = 'admin@dronetag.io';
const ADMIN_PASSWORD = 'DroneTag2026!';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function main() {
  try {
    console.log(`Creating admin user: ${ADMIN_EMAIL}`);
    const cred = await createUserWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
    await updateProfile(cred.user, { displayName: 'DroneTag Admin' });
    console.log('Admin user created successfully!');
    console.log(`  UID:   ${cred.user.uid}`);
    console.log(`  Email: ${ADMIN_EMAIL}`);
    console.log(`  Pass:  ${ADMIN_PASSWORD}`);
    process.exit(0);
  } catch (err: unknown) {
    const e = err as { code?: string; message?: string };
    if (e.code === 'auth/email-already-in-use') {
      console.log('Admin user already exists. Use these credentials to log in:');
      console.log(`  Email: ${ADMIN_EMAIL}`);
      console.log(`  Pass:  ${ADMIN_PASSWORD}`);
      process.exit(0);
    }
    console.error('Failed to create admin:', e.message);
    process.exit(1);
  }
}

main();
