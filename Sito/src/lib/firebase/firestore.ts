import {
  addDoc, collection, deleteDoc, doc, getDoc, getDocs,
  limit, orderBy, query, updateDoc, where,
} from 'firebase/firestore';

import { awaitFirebaseAuthReady } from '@/lib/firebase/auth';
import { DEMO_MODE, getFirebaseAuth, getFirebaseDb } from '@/lib/firebase/config';
import * as demoStore from '@/lib/demo/store';
import type { Profile, ProfileFormData, PolicyStatus, VerificationStatus, Visibility } from '@/lib/types';
import { computePolicyStatus, compareByPolicyPriority, getDisplayName } from '@/lib/utils';

const PROFILES = 'profiles';

function profileFromSnapshot(id: string, raw: Record<string, unknown>): Profile {
  const data = raw as Record<string, unknown>;
  const obj = (key: string) => (typeof data[key] === 'object' && data[key] !== null ? data[key] : {}) as Record<string, unknown>;
  const str = (key: string) => (typeof data[key] === 'string' ? data[key] : '') as string;

  return {
    id,
    slug: str('slug'),
    language: (str('language') || 'en') as Profile['language'],
    status: (str('status') || 'draft') as Profile['status'],
    visibility: (str('visibility') || 'private') as Profile['visibility'],
    verificationStatus: (str('verificationStatus') || 'unverified') as Profile['verificationStatus'],
    createdAt: str('createdAt'),
    updatedAt: str('updatedAt'),
    publishedAt: str('publishedAt'),
    lastVerifiedAt: str('lastVerifiedAt'),
    person: {
      firstName: '', lastName: '', operatorCode: '',
      ...obj('person'),
    } as Profile['person'],
    organization: {
      companyName: '', companyDetails: '',
      ...obj('organization'),
    } as Profile['organization'],
    drone: {
      droneName: '', droneModel: '', droneSerialNumber: '', droneRegistrationCode: '',
      ...obj('drone'),
    } as Profile['drone'],
    insurance: {
      provider: '', policyNumber: '', issueDate: '', expiryDate: '', notes: '', pdfUrl: '',
      ...obj('insurance'),
    } as Profile['insurance'],
    assets: {
      profilePhotoUrl: '', logoUrl: '', bannerUrl: '', qrCodeUrl: '', nfcReference: '',
      ...obj('assets'),
    } as Profile['assets'],
    documents: Array.isArray(data['documents']) ? data['documents'] as Profile['documents'] : [],
    admin: {
      internalNotes: '', lastEditedBy: '',
      ...obj('admin'),
    } as Profile['admin'],
  };
}

// ─── CRUD ────────────────────────────────────────────────────────────────────

export async function createProfile(data: ProfileFormData): Promise<string> {
  if (DEMO_MODE) return demoStore.createProfile(data);
  await awaitFirebaseAuthReady();
  const db = getFirebaseDb();
  const now = new Date().toISOString();
  const col = collection(db, PROFILES);
  const ref = await addDoc(col, { ...data, createdAt: now, updatedAt: now });
  return ref.id;
}

export async function updateProfile(id: string, data: Partial<Profile>): Promise<void> {
  if (DEMO_MODE) return demoStore.updateProfile(id, data);
  await awaitFirebaseAuthReady();
  const db = getFirebaseDb();
  const docRef = doc(db, PROFILES, id);
  const payload = Object.fromEntries(
    Object.entries(data).filter(([k, v]) => k !== 'id' && v !== undefined)
  );
  await updateDoc(docRef, { ...payload, updatedAt: new Date().toISOString() });
}

export async function deleteProfile(id: string): Promise<void> {
  if (DEMO_MODE) return demoStore.deleteProfile(id);
  await awaitFirebaseAuthReady();
  const { deleteProfileFiles } = await import('@/lib/firebase/storage');
  await deleteProfileFiles(id);
  const db = getFirebaseDb();
  await deleteDoc(doc(db, PROFILES, id));
}

// ─── Reads ───────────────────────────────────────────────────────────────────

export async function getProfile(id: string): Promise<Profile | null> {
  if (DEMO_MODE) return demoStore.getProfile(id);
  await awaitFirebaseAuthReady();
  const db = getFirebaseDb();
  const snap = await getDoc(doc(db, PROFILES, id));
  if (!snap.exists()) return null;
  return profileFromSnapshot(snap.id, snap.data() as Record<string, unknown>);
}

export async function getProfileBySlug(slug: string): Promise<Profile | null> {
  if (DEMO_MODE) return demoStore.getProfileBySlug(slug);
  await awaitFirebaseAuthReady();
  const db = getFirebaseDb();
  const loggedIn = getFirebaseAuth().currentUser != null;
  // Anonymous visitors: only published profiles (matches typical rules + avoids
  // permission-denied on mixed visibility). Requires a Firestore composite index
  // on (slug, visibility, status).
  // Logged-in users: single-field slug query (default index) — rules allow full read.
  const q = loggedIn
    ? query(collection(db, PROFILES), where('slug', '==', slug), limit(1))
    : query(
        collection(db, PROFILES),
        where('slug', '==', slug),
        where('visibility', '==', 'public'),
        where('status', '==', 'active'),
        limit(1),
      );
  const snap = await getDocs(q);
  const first = snap.docs[0];
  if (!first) return null;
  return profileFromSnapshot(first.id, first.data() as Record<string, unknown>);
}

export async function getAllProfiles(): Promise<Profile[]> {
  if (DEMO_MODE) return demoStore.getAllProfiles();
  await awaitFirebaseAuthReady();
  const db = getFirebaseDb();
  const q = query(collection(db, PROFILES), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => profileFromSnapshot(d.id, d.data() as Record<string, unknown>));
}

// ─── Search & filter ─────────────────────────────────────────────────────────

export type SortField = 'name' | 'expiry' | 'priority' | 'updated';
export type PolicyFilter = PolicyStatus | 'all';
export type VerificationFilter = VerificationStatus | 'all';
export type VisibilityFilter = Visibility | 'all';

export interface ProfileFilters {
  search?: string;
  policyStatus?: PolicyFilter;
  verificationStatus?: VerificationFilter;
  visibility?: VisibilityFilter;
  sort?: SortField;
}

export async function getFilteredProfiles(filters: ProfileFilters): Promise<Profile[]> {
  let profiles = await getAllProfiles();

  if (filters.search?.trim()) {
    const q = filters.search.trim().toLowerCase();
    profiles = profiles.filter((p) => {
      const hay = [
        p.person.firstName, p.person.lastName, p.person.operatorCode,
        p.organization.companyName, p.insurance.policyNumber,
      ].map((s) => (s || '').toLowerCase()).join(' ');
      return hay.includes(q);
    });
  }

  if (filters.policyStatus && filters.policyStatus !== 'all') {
    profiles = profiles.filter((p) => computePolicyStatus(p.insurance) === filters.policyStatus);
  }

  if (filters.verificationStatus && filters.verificationStatus !== 'all') {
    profiles = profiles.filter((p) => p.verificationStatus === filters.verificationStatus);
  }

  if (filters.visibility && filters.visibility !== 'all') {
    profiles = profiles.filter((p) => p.visibility === filters.visibility);
  }

  if (filters.sort === 'name') {
    profiles.sort((a, b) => getDisplayName(a).localeCompare(getDisplayName(b)));
  } else if (filters.sort === 'expiry') {
    profiles.sort((a, b) => (a.insurance.expiryDate || '9999').localeCompare(b.insurance.expiryDate || '9999'));
  } else if (filters.sort === 'priority') {
    profiles.sort(compareByPolicyPriority);
  } else if (filters.sort === 'updated') {
    profiles.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
  }

  return profiles;
}
