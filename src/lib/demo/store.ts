/**
 * In-memory profile store for DEMO_MODE.
 * Mirrors the Firestore API surface so the rest of the app is unaware.
 */

import type { Profile, ProfileFormData } from '@/lib/types';
import { DEMO_PROFILES } from './data';

let profiles: Profile[] = [...DEMO_PROFILES];
let nextId = 100;

function delay(ms = 200): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function createProfile(data: ProfileFormData): Promise<string> {
  await delay();
  const now = new Date().toISOString();
  const id = `demo-${String(nextId++).padStart(3, '0')}`;
  profiles = [{ ...data, id, createdAt: now, updatedAt: now } as Profile, ...profiles];
  return id;
}

export async function updateProfile(id: string, data: Partial<Profile>): Promise<void> {
  await delay();
  profiles = profiles.map((p) =>
    p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p,
  );
}

export async function deleteProfile(id: string): Promise<void> {
  await delay();
  profiles = profiles.filter((p) => p.id !== id);
}

export async function getProfile(id: string): Promise<Profile | null> {
  await delay(100);
  return profiles.find((p) => p.id === id) ?? null;
}

export async function getProfileBySlug(slug: string): Promise<Profile | null> {
  await delay(100);
  return profiles.find((p) => p.slug === slug) ?? null;
}

export async function getAllProfiles(): Promise<Profile[]> {
  await delay(150);
  return [...profiles];
}
