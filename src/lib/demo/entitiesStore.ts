/**
 * In-memory store for the multi-entity model used in DEMO_MODE.
 * Mirrors the Firestore data-access modules under src/lib/firebase/ so the
 * UI is unaware of which backend is active.
 *
 * Concurrency: DEMO_MODE runs single-threaded in the browser; no locking needed.
 */

import { generateDroneSlug } from '@/lib/utils/entities';
import type {
  Certificate,
  DocumentRef,
  Drone,
  DronePublicSnapshot,
  Insurance,
  Operator,
  Pilot,
  Plan,
  Report,
  Slots,
  SlotKind,
} from '@/lib/types/entities';
import { BASE_SLOTS } from '@/lib/types/entities';

// ─── Tiny utilities ─────────────────────────────────────────────────────────

let nextNumericId = 1000;
function makeId(prefix: string): string {
  nextNumericId += 1;
  return `${prefix}-${nextNumericId.toString(36)}`;
}

function delay(ms = 100): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function nowIso(): string {
  return new Date().toISOString();
}

// ─── Storage ────────────────────────────────────────────────────────────────

const pilots = new Map<string, Pilot>();           // key = userId
const operators = new Map<string, Operator>();     // key = operator id
const drones = new Map<string, Drone>();           // key = drone id
const insurances = new Map<string, Insurance>();   // key = insurance id
const certificates = new Map<string, Certificate>(); // key = certificate id
const documents = new Map<string, DocumentRef>();  // key = document id
const slots = new Map<string, Slots>();            // key = userId
const plans = new Map<string, Plan>();             // key = plan id
const reports = new Map<string, Report>();         // key = report id
const dronesPublic = new Map<string, DronePublicSnapshot>(); // key = slug

// ─── Pilot ──────────────────────────────────────────────────────────────────

export async function getPilot(userId: string): Promise<Pilot | null> {
  await delay();
  return pilots.get(userId) ?? null;
}

export async function upsertPilot(p: Pilot): Promise<void> {
  await delay();
  const existing = pilots.get(p.userId);
  pilots.set(p.userId, {
    ...p,
    createdAt: existing?.createdAt ?? p.createdAt ?? nowIso(),
    updatedAt: nowIso(),
  });
}

// ─── Operator ───────────────────────────────────────────────────────────────

export async function listOperators(userId: string): Promise<Operator[]> {
  await delay();
  return [...operators.values()]
    .filter((o) => o.userId === userId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function getOperator(id: string): Promise<Operator | null> {
  await delay();
  return operators.get(id) ?? null;
}

export async function createOperator(op: Omit<Operator, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  await delay();
  const id = makeId('op');
  operators.set(id, { ...op, id, createdAt: nowIso(), updatedAt: nowIso() });
  return id;
}

export async function updateOperator(id: string, patch: Partial<Operator>): Promise<void> {
  await delay();
  const cur = operators.get(id);
  if (!cur) return;
  operators.set(id, { ...cur, ...patch, id, updatedAt: nowIso() });
}

export async function deleteOperator(id: string): Promise<void> {
  await delay();
  operators.delete(id);
}

// ─── Drone ──────────────────────────────────────────────────────────────────

export async function listDronesByUser(userId: string): Promise<Drone[]> {
  await delay();
  return [...drones.values()]
    .filter((d) => d.userId === userId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getDrone(id: string): Promise<Drone | null> {
  await delay();
  return drones.get(id) ?? null;
}

export async function getDroneBySlug(slug: string): Promise<Drone | null> {
  await delay();
  return [...drones.values()].find((d) => d.slug === slug) ?? null;
}

export async function createDrone(d: Omit<Drone, 'id' | 'slug' | 'createdAt' | 'updatedAt'> & { slug?: string }): Promise<string> {
  await delay();
  const id = makeId('drn');
  let slug = d.slug?.trim() || generateDroneSlug();
  // Avoid collisions in the in-memory map.
  while ([...drones.values()].some((x) => x.slug === slug)) {
    slug = generateDroneSlug();
  }
  drones.set(id, { ...d, id, slug, createdAt: nowIso(), updatedAt: nowIso() });
  return id;
}

export async function updateDrone(id: string, patch: Partial<Drone>): Promise<void> {
  await delay();
  const cur = drones.get(id);
  if (!cur) return;
  drones.set(id, { ...cur, ...patch, id, updatedAt: nowIso() });
}

export async function deleteDrone(id: string): Promise<void> {
  await delay();
  drones.delete(id);
}

// ─── Insurance ──────────────────────────────────────────────────────────────

export async function listInsurances(userId: string): Promise<Insurance[]> {
  await delay();
  return [...insurances.values()]
    .filter((i) => i.userId === userId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getInsurance(id: string): Promise<Insurance | null> {
  await delay();
  return insurances.get(id) ?? null;
}

export async function createInsurance(
  i: Omit<Insurance, 'id' | 'createdAt' | 'updatedAt' | 'dataLockedAt'>,
): Promise<string> {
  await delay();
  const id = makeId('ins');
  const now = nowIso();
  insurances.set(id, { ...i, id, createdAt: now, updatedAt: now, dataLockedAt: now });
  return id;
}

export async function updateInsurance(id: string, patch: Partial<Insurance>): Promise<void> {
  await delay();
  const cur = insurances.get(id);
  if (!cur) return;
  insurances.set(id, { ...cur, ...patch, id, updatedAt: nowIso() });
}

export async function deleteInsurance(id: string): Promise<void> {
  await delay();
  insurances.delete(id);
}

// ─── Certificate ────────────────────────────────────────────────────────────

export async function listCertificates(userId: string): Promise<Certificate[]> {
  await delay();
  return [...certificates.values()]
    .filter((c) => c.userId === userId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function getCertificate(id: string): Promise<Certificate | null> {
  await delay();
  return certificates.get(id) ?? null;
}

export async function createCertificate(
  c: Omit<Certificate, 'id' | 'createdAt' | 'updatedAt' | 'dataLockedAt'>,
): Promise<string> {
  await delay();
  const id = makeId('cert');
  const now = nowIso();
  certificates.set(id, { ...c, id, createdAt: now, updatedAt: now, dataLockedAt: now });
  return id;
}

export async function updateCertificate(id: string, patch: Partial<Certificate>): Promise<void> {
  await delay();
  const cur = certificates.get(id);
  if (!cur) return;
  certificates.set(id, { ...cur, ...patch, id, updatedAt: nowIso() });
}

export async function deleteCertificate(id: string): Promise<void> {
  await delay();
  certificates.delete(id);
}

// ─── Document ───────────────────────────────────────────────────────────────

export async function listDocuments(userId: string): Promise<DocumentRef[]> {
  await delay();
  return [...documents.values()]
    .filter((d) => d.userId === userId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getDocument(id: string): Promise<DocumentRef | null> {
  await delay();
  return documents.get(id) ?? null;
}

export async function createDocument(d: Omit<DocumentRef, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  await delay();
  const id = makeId('doc');
  documents.set(id, { ...d, id, createdAt: nowIso(), updatedAt: nowIso() });
  return id;
}

export async function updateDocument(id: string, patch: Partial<DocumentRef>): Promise<void> {
  await delay();
  const cur = documents.get(id);
  if (!cur) return;
  documents.set(id, { ...cur, ...patch, id, updatedAt: nowIso() });
}

export async function deleteDocument(id: string): Promise<void> {
  await delay();
  documents.delete(id);
}

// ─── Slots ──────────────────────────────────────────────────────────────────

export async function getSlots(userId: string): Promise<Slots | null> {
  await delay();
  return slots.get(userId) ?? null;
}

export async function ensureSlots(userId: string): Promise<Slots> {
  await delay();
  const existing = slots.get(userId);
  if (existing) return existing;
  const fresh: Slots = {
    userId,
    ...BASE_SLOTS,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  slots.set(userId, fresh);
  return fresh;
}

export async function grantSlot(userId: string, kind: SlotKind, count = 1): Promise<void> {
  await delay();
  const cur = await ensureSlots(userId);
  slots.set(userId, { ...cur, [kind]: cur[kind] + count, updatedAt: nowIso() });
}

export async function setSlots(userId: string, next: Slots): Promise<void> {
  await delay();
  slots.set(userId, { ...next, userId, updatedAt: nowIso() });
}

// ─── Plan ───────────────────────────────────────────────────────────────────

export async function listPlans(): Promise<Plan[]> {
  await delay();
  return [...plans.values()].sort((a, b) => a.slotKind.localeCompare(b.slotKind));
}

export async function upsertPlan(p: Plan): Promise<string> {
  await delay();
  plans.set(p.id, { ...p, updatedAt: nowIso() });
  return p.id;
}

// ─── Report ─────────────────────────────────────────────────────────────────

export async function listReports(ownerUserId: string): Promise<Report[]> {
  await delay();
  return [...reports.values()]
    .filter((r) => r.ownerUserId === ownerUserId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listReportsForDrone(droneId: string): Promise<Report[]> {
  await delay();
  return [...reports.values()]
    .filter((r) => r.droneId === droneId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createReport(r: Omit<Report, 'id' | 'createdAt' | 'read'>): Promise<string> {
  await delay();
  const id = makeId('rep');
  reports.set(id, { ...r, id, createdAt: nowIso(), read: false });
  return id;
}

export async function markReportRead(id: string): Promise<void> {
  await delay();
  const cur = reports.get(id);
  if (!cur) return;
  reports.set(id, { ...cur, read: true });
}

// ─── DronePublic (PR-SEC-1: sanitised public snapshot) ─────────────────────

export async function getDronePublicBySlug(slug: string): Promise<DronePublicSnapshot | null> {
  await delay();
  return dronesPublic.get(slug) ?? null;
}

export async function setDronePublic(snapshot: DronePublicSnapshot): Promise<void> {
  await delay();
  dronesPublic.set(snapshot.slug, snapshot);
}

export async function deleteDronePublicBySlug(slug: string): Promise<void> {
  await delay();
  dronesPublic.delete(slug);
}

export async function listAllDronesPublic(): Promise<DronePublicSnapshot[]> {
  await delay();
  return [...dronesPublic.values()];
}

// ─── Admin-listing helpers (cross-user) ────────────────────────────────────

export async function listAllOperators(): Promise<Operator[]> {
  await delay();
  return [...operators.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function listAllDrones(): Promise<Drone[]> {
  await delay();
  return [...drones.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function listAllInsurances(): Promise<Insurance[]> {
  await delay();
  return [...insurances.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function listAllCertificates(): Promise<Certificate[]> {
  await delay();
  return [...certificates.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function listAllDocuments(): Promise<DocumentRef[]> {
  await delay();
  return [...documents.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function listAllReports(): Promise<Report[]> {
  await delay();
  return [...reports.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listAllSlots(): Promise<Slots[]> {
  await delay();
  return [...slots.values()];
}

// ─── Test/seed helpers ─────────────────────────────────────────────────────

/** Direct insertion bypassing IDs — used only by demo seed data wiring. */
export function _seedInsert(kind: 'pilot' | 'operator' | 'drone' | 'insurance' | 'certificate' | 'document' | 'slots' | 'plan' | 'report', value: unknown): void {
  switch (kind) {
    case 'pilot': { const p = value as Pilot; pilots.set(p.userId, p); return; }
    case 'operator': { const o = value as Operator; operators.set(o.id, o); return; }
    case 'drone': { const d = value as Drone; drones.set(d.id, d); return; }
    case 'insurance': { const i = value as Insurance; insurances.set(i.id, i); return; }
    case 'certificate': { const c = value as Certificate; certificates.set(c.id, c); return; }
    case 'document': { const x = value as DocumentRef; documents.set(x.id, x); return; }
    case 'slots': { const s = value as Slots; slots.set(s.userId, s); return; }
    case 'plan': { const pl = value as Plan; plans.set(pl.id, pl); return; }
    case 'report': { const r = value as Report; reports.set(r.id, r); return; }
  }
}

export function _seedClear(): void {
  pilots.clear();
  operators.clear();
  drones.clear();
  insurances.clear();
  certificates.clear();
  documents.clear();
  slots.clear();
  plans.clear();
  reports.clear();
  dronesPublic.clear();
}
