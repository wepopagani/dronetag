'use client';

/**
 * Drone detail / editor page.
 *
 * Sections (top to bottom):
 *   1. Basics            — manufacturer, model, classMarking, serial numbers
 *   2. Active operator   — M4: live effective/default/override view + 24h
 *                          temporary switch with responsibility checkbox.
 *                          Lives outside the main form because its writes
 *                          go through dedicated `setActiveOperator` /
 *                          `clearActiveOperator` helpers and don't share
 *                          the form's dirty/submit lifecycle.
 *   3. Linked entities   — pilot (read-only), default operator selector,
 *                          insurance picker (drone-linked policies only)
 *   4. Publishing        — status (draft/active/...) + visibility toggle
 *                          + slug + public URL with copy-to-clipboard
 *
 * Privacy: this page only shows the user's own data and writes are
 * restricted by firestore.rules to the drone's userId. Public visitors
 * see only the projection from M1's `toPublicDroneCard`, which uses the
 * EFFECTIVE operator (lazy 24h TTL) — not the default — so a temporary
 * switch immediately propagates to the public card without further
 * mutation.
 */

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  deleteDrone,
  getDrone,
  updateDrone,
} from '@/lib/firebase/drones';
import { listOperators } from '@/lib/firebase/operators';
import { listInsurances } from '@/lib/firebase/insurances';
import { getPilot } from '@/lib/firebase/pilots';
import {
  DRONE_CLASSES,
  type Drone,
  type DroneClass,
  type DroneStatus,
  type DroneVisibility,
  type Insurance,
  type Operator,
  type Pilot,
} from '@/lib/types/entities';
import {
  operatorDisplayName,
  pilotDisplayName,
} from '@/lib/utils/entities';
import { getPublicProfileUrl } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ActiveOperatorPanel } from '@/components/account/ActiveOperatorPanel';
import { ConfirmDialog } from '@/components/account/ConfirmDialog';
import { FormErrorBanner } from '@/components/account/FormErrorBanner';

interface DroneFormState {
  manufacturer: string;
  model: string;
  classMarking: DroneClass;
  droneSerialNumber: string;
  controllerSerialNumber: string;
  defaultOperatorId: string;
  insuranceId: string;
  status: DroneStatus;
  visibility: DroneVisibility;
}

function droneToForm(d: Drone): DroneFormState {
  return {
    manufacturer: d.manufacturer,
    model: d.model,
    classMarking: d.classMarking,
    droneSerialNumber: d.droneSerialNumber,
    controllerSerialNumber: d.controllerSerialNumber,
    defaultOperatorId: d.defaultOperatorId,
    insuranceId: d.insuranceId ?? '',
    status: d.status,
    visibility: d.visibility,
  };
}

export default function DroneDetailPage() {
  const params = useParams<{ id: string | string[] }>();
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();

  const droneId = useMemo(() => {
    const raw = params?.id;
    return typeof raw === 'string' ? raw : Array.isArray(raw) ? raw[0] ?? '' : '';
  }, [params]);

  const [drone, setDrone] = useState<Drone | null>(null);
  const [pilot, setPilot] = useState<Pilot | null>(null);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [insurances, setInsurances] = useState<Insurance[]>([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState<DroneFormState | null>(null);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [dirty, setDirty] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [copied, setCopied] = useState(false);

  const reload = useCallback(async () => {
    if (!user || !droneId) return;
    const d = await getDrone(droneId);
    if (!d || d.userId !== user.uid) {
      setDrone(null);
      return;
    }
    const [opList, insList, p] = await Promise.all([
      listOperators(user.uid),
      listInsurances(user.uid),
      getPilot(user.uid),
    ]);
    setDrone(d);
    setOperators(opList);
    setInsurances(insList);
    setPilot(p);
    setForm(droneToForm(d));
    setDirty(false);
  }, [user, droneId]);

  useEffect(() => {
    if (!user || !droneId) return;
    let cancelled = false;
    (async () => {
      try {
        await reload();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user, droneId, reload]);

  if (loading) {
    return (
      <div className="mt-8 flex items-center gap-3 text-sm text-gray-500">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
        {t('common.loading')}
      </div>
    );
  }

  if (!drone || !form) {
    return (
      <div className="mt-8">
        <p className="text-sm text-gray-500">{t('profile.notFound')}</p>
        <div className="mt-4">
          <Button href="/account/drones" variant="ghost">
            {t('drone.backToList')}
          </Button>
        </div>
      </div>
    );
  }

  function setField<K extends keyof DroneFormState>(k: K, v: DroneFormState[K]) {
    setForm((p) => (p ? { ...p, [k]: v } : p));
    setDirty(true);
    if (errors[k as string]) setErrors((e) => ({ ...e, [k]: undefined }));
  }

  function validate(f: DroneFormState): Record<string, string> {
    const e: Record<string, string> = {};
    if (!f.manufacturer.trim()) e.manufacturer = t('form.validation.required');
    if (!f.model.trim()) e.model = t('form.validation.required');
    if (!f.defaultOperatorId) e.defaultOperatorId = t('form.validation.required');
    if (f.visibility === 'public' && !f.droneSerialNumber.trim()) {
      // Public drones must carry their serial: it's the only public-visible
      // identifier the verifier can cross-check against the physical drone.
      e.droneSerialNumber = t('form.validation.required');
    }
    return e;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    const v = validate(form);
    setErrors(v);
    if (Object.keys(v).length > 0) return;
    setSaving(true);
    try {
      const wasPublic = drone!.status === 'active' && drone!.visibility === 'public';
      const willBePublic = form.status === 'active' && form.visibility === 'public';
      await updateDrone(drone!.id, {
        ...form,
        insuranceId: form.insuranceId || null,
        // First-time publish stamps publishedAt so the public footer can show it.
        publishedAt: !wasPublic && willBePublic
          ? new Date().toISOString()
          : drone!.publishedAt,
      });
      await reload();
      setSavedAt(Date.now());
    } catch (err) {
      console.error('[drone detail] save failed', err);
      setErrors({ submit: t('account.saveError') });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setSaving(true);
    try {
      await deleteDrone(drone!.id);
      router.push('/account/drones');
    } finally {
      setSaving(false);
    }
  }

  async function handleCopySlug() {
    const url = getPublicProfileUrl(drone!.slug);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard may be blocked in iframes; fall back to manual copy hint.
    }
  }

  const isPublic = drone.status === 'active' && drone.visibility === 'public';
  const publicUrl = getPublicProfileUrl(drone.slug);
  const droneInsurances = insurances.filter((i) => i.link === 'drone');

  return (
    <div className="mt-6 space-y-5">
      <Link
        href="/account/drones"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5" aria-hidden>
          <path fillRule="evenodd" d="M9.78 4.22a.75.75 0 010 1.06L7.06 8h7.69a.75.75 0 010 1.5H7.06l2.72 2.72a.75.75 0 11-1.06 1.06l-4-4a.75.75 0 010-1.06l4-4a.75.75 0 011.06 0z" clipRule="evenodd" />
        </svg>
        {t('drone.backToList')}
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold text-gray-900">
            {[drone.manufacturer, drone.model].filter(Boolean).join(' ').trim() || drone.slug}
          </h2>
          <p className="mt-1 text-xs text-gray-500">
            {t('drone.field.slug')}: <code className="font-mono">{drone.slug}</code>
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {savedAt && !dirty ? (
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
              {t('account.saved')}
            </span>
          ) : null}
          <Button variant="ghost" onClick={() => setConfirmingDelete(true)}>
            {t('common.delete')}
          </Button>
        </div>
      </header>

      <ActiveOperatorPanel
        drone={drone}
        operators={operators}
        setBy={user?.uid ?? ''}
        onChanged={reload}
      />

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <FormErrorBanner show={Boolean(errors.submit) || Object.keys(errors).length > 0} message={errors.submit} />

        <Card padding="md">
          <h3 className="mb-4 text-sm font-semibold text-gray-900">{t('drone.detail.basics')}</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label={t('drone.field.manufacturer')} name="manufacturer" required
              value={form.manufacturer}
              onChange={(e) => setField('manufacturer', e.target.value)}
              error={errors.manufacturer}
            />
            <Input
              label={t('drone.field.model')} name="model" required
              value={form.model}
              onChange={(e) => setField('model', e.target.value)}
              error={errors.model}
            />
            <Select
              label={t('drone.field.classMarking')} name="classMarking"
              value={form.classMarking}
              onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                setField('classMarking', e.target.value as DroneClass)
              }
              options={DRONE_CLASSES.map((c) => ({ value: c.value, label: t(c.labelKey) }))}
            />
            <Input
              label={t('drone.field.serialNumber')} name="droneSerialNumber"
              value={form.droneSerialNumber}
              onChange={(e) => setField('droneSerialNumber', e.target.value)}
              error={errors.droneSerialNumber}
            />
            <Input
              label={t('drone.field.controllerSerial')} name="controllerSerialNumber"
              value={form.controllerSerialNumber}
              onChange={(e) => setField('controllerSerialNumber', e.target.value)}
              className="sm:col-span-2"
            />
          </div>
        </Card>

        <Card padding="md">
          <h3 className="mb-4 text-sm font-semibold text-gray-900">{t('drone.detail.linked')}</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                {t('drone.field.linkedPilot')}
              </p>
              <p className="mt-0.5 text-sm text-gray-900">{pilotDisplayName(pilot)}</p>
            </div>
            <Select
              label={t('drone.field.defaultOperator')} name="defaultOperatorId" required
              value={form.defaultOperatorId}
              onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                setField('defaultOperatorId', e.target.value)
              }
              options={operators.map((op) => ({
                value: op.id,
                label: operatorDisplayName(op),
              }))}
              error={errors.defaultOperatorId}
            />
            <Select
              label={t('drone.field.insurance')} name="insuranceId"
              value={form.insuranceId}
              onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                setField('insuranceId', e.target.value)
              }
              options={[
                { value: '', label: t('drone.field.insuranceNone') },
                ...droneInsurances.map((i) => ({
                  value: i.id,
                  label: `${i.provider || '—'} · ${i.policyNumber || '—'}`,
                })),
              ]}
              className="sm:col-span-2"
            />
          </div>
        </Card>

        <Card padding="md">
          <h3 className="mb-4 text-sm font-semibold text-gray-900">{t('drone.detail.publish')}</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label={t('drone.field.status')} name="status"
              value={form.status}
              onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                setField('status', e.target.value as DroneStatus)
              }
              options={[
                { value: 'draft', label: t('status.draft') },
                { value: 'active', label: t('status.active') },
                { value: 'suspended', label: t('status.suspended') },
                { value: 'archived', label: t('status.archived') },
              ]}
            />
            <Select
              label={t('drone.field.visibility')} name="visibility"
              value={form.visibility}
              onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                setField('visibility', e.target.value as DroneVisibility)
              }
              options={[
                { value: 'private', label: t('visibility.private') },
                { value: 'public', label: t('visibility.public') },
              ]}
            />
            <div className="sm:col-span-2">
              <p className="mb-1.5 block text-sm font-medium text-gray-700">
                {t('drone.publicUrl')}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <code className="min-w-0 flex-1 truncate rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 font-mono text-xs text-gray-700">
                  {publicUrl}
                </code>
                <Button variant="secondary" size="sm" onClick={handleCopySlug}>
                  {copied ? t('drone.slugCopied') : t('drone.copySlug')}
                </Button>
                {isPublic ? (
                  <Button href={`/u/${drone.slug}`} variant="ghost" size="sm">
                    {t('common.preview')}
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        </Card>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button type="submit" loading={saving} disabled={!dirty}>
            {t('common.save')}
          </Button>
        </div>
      </form>

      <ConfirmDialog
        isOpen={confirmingDelete}
        title={t('drone.delete.title')}
        loading={saving}
        message={[drone.manufacturer, drone.model].filter(Boolean).join(' ').trim() || drone.slug}
        extraWarning={
          isPublic ? t('drone.delete.warning', { url: publicUrl }) : undefined
        }
        confirmLabel={t('common.delete')}
        onConfirm={handleDelete}
        onClose={() => setConfirmingDelete(false)}
      />
    </div>
  );
}
