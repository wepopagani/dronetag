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
 *
 * Identity fields are editable only until the owner confirms and locks them.
 * Publication (status / visibility) is admin-only.
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
  type Insurance,
  type Operator,
  type Pilot,
} from '@/lib/types/entities';
import {
  isDroneDataLocked,
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
import { ReadOnlyField } from '@/components/account/ReadOnlyField';

interface DroneFormState {
  manufacturer: string;
  model: string;
  classMarking: DroneClass;
  droneSerialNumber: string;
  controllerSerialNumber: string;
  defaultOperatorId: string;
  insuranceId: string;
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
  const [confirmingLock, setConfirmingLock] = useState(false);

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
    return e;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form || isDroneDataLocked(drone!)) return;
    const v = validate(form);
    setErrors(v);
    if (Object.keys(v).length > 0) return;
    setConfirmingLock(true);
  }

  async function handleConfirmLock() {
    if (!form) return;
    setSaving(true);
    try {
      await updateDrone(drone!.id, {
        ...form,
        insuranceId: form.insuranceId || null,
        dataLockedAt: new Date().toISOString(),
      });
      await reload();
      setSavedAt(Date.now());
      setConfirmingLock(false);
    } catch (err) {
      console.error('[drone detail] save failed', err);
      setErrors({ submit: t('account.saveError') });
      setConfirmingLock(false);
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

  const isLocked = isDroneDataLocked(drone);
  const isPublic = drone.status === 'active' && drone.visibility === 'public';
  const droneInsurances = insurances.filter((i) => i.link === 'drone');
  const defaultOperator = operators.find((o) => o.id === drone.defaultOperatorId);
  const linkedInsurance = insurances.find((i) => i.id === drone.insuranceId);
  const classLabel = t(
    DRONE_CLASSES.find((c) => c.value === drone.classMarking)?.labelKey ?? 'drone.class.unknown',
  );

  return (
    <div className="space-y-4 sm:space-y-5">
      <Link
        href="/account/drones"
        className="tap-44 inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 sm:text-sm"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5" aria-hidden>
          <path fillRule="evenodd" d="M9.78 4.22a.75.75 0 010 1.06L7.06 8h7.69a.75.75 0 010 1.5H7.06l2.72 2.72a.75.75 0 11-1.06 1.06l-4-4a.75.75 0 010-1.06l4-4a.75.75 0 011.06 0z" clipRule="evenodd" />
        </svg>
        {t('drone.backToList')}
      </Link>

      <header className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold leading-snug text-gray-900 sm:text-xl">
            {[drone.manufacturer, drone.model].filter(Boolean).join(' ').trim() || drone.slug}
          </h2>
          <p className="mt-0.5 truncate text-[11px] text-gray-500 sm:text-xs">
            {t('drone.field.slug')}: <code className="font-mono">{drone.slug}</code>
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {!isLocked && savedAt && !dirty ? (
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20 sm:px-2.5 sm:py-1 sm:text-xs">
              {t('account.saved')}
            </span>
          ) : null}
          <Button variant="ghost" size="sm" onClick={() => setConfirmingDelete(true)}>
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

      {isLocked ? (
        <div className="space-y-5">
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-900">
            {t('drone.locked.hint')}
          </div>

          <Card padding="md">
            <h3 className="mb-4 text-sm font-semibold text-gray-900">{t('drone.detail.basics')}</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <ReadOnlyField label={t('drone.field.manufacturer')} value={drone.manufacturer} />
              <ReadOnlyField label={t('drone.field.model')} value={drone.model} />
              <ReadOnlyField label={t('drone.field.classMarking')} value={classLabel} />
              <ReadOnlyField label={t('drone.field.serialNumber')} value={drone.droneSerialNumber} />
              <ReadOnlyField
                label={t('drone.field.controllerSerial')}
                value={drone.controllerSerialNumber}
                className="sm:col-span-2"
              />
            </div>
          </Card>

          <Card padding="md">
            <h3 className="mb-4 text-sm font-semibold text-gray-900">{t('drone.detail.linked')}</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <ReadOnlyField label={t('drone.field.linkedPilot')} value={pilotDisplayName(pilot)} />
              <ReadOnlyField
                label={t('drone.field.defaultOperator')}
                value={defaultOperator ? operatorDisplayName(defaultOperator) : '—'}
              />
              <ReadOnlyField
                label={t('drone.field.insurance')}
                value={
                  linkedInsurance
                    ? `${linkedInsurance.provider || '—'} · ${linkedInsurance.policyNumber || '—'}`
                    : t('drone.field.insuranceNone')
                }
                className="sm:col-span-2"
              />
            </div>
          </Card>
        </div>
      ) : (
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

          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button type="submit" loading={saving}>
              {t('common.confirm')}
            </Button>
          </div>
        </form>
      )}

      <ConfirmDialog
        isOpen={confirmingLock}
        title={t('drone.confirmLock.title')}
        message={t('drone.confirmLock.message')}
        confirmLabel={t('common.confirm')}
        danger={false}
        loading={saving}
        onConfirm={handleConfirmLock}
        onClose={() => setConfirmingLock(false)}
      />

      <ConfirmDialog
        isOpen={confirmingDelete}
        title={t('drone.delete.title')}
        loading={saving}
        message={[drone.manufacturer, drone.model].filter(Boolean).join(' ').trim() || drone.slug}
        extraWarning={
          isPublic
            ? t('drone.delete.warning', { url: getPublicProfileUrl(drone.slug) })
            : undefined
        }
        confirmLabel={t('common.delete')}
        onConfirm={handleDelete}
        onClose={() => setConfirmingDelete(false)}
      />
    </div>
  );
}
