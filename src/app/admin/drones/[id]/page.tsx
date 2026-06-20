'use client';

/**
 * Admin: edit any drone.
 *
 * Mirrors the user-facing /account/drones/[id] form but does not require
 * the drone's userId to match the current uid (admins can edit anything).
 * Reuses ActiveOperatorPanel so admins also have the temporary override
 * controls and the audit trail at hand.
 *
 * The lookup tables (operators / pilots / insurances) are pulled for the
 * drone's owner so the selectors are populated correctly.
 */

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getAccount } from '@/lib/firebase/account';
import { deleteDrone, getDrone, updateDrone } from '@/lib/firebase/drones';
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
import type { UserAccount } from '@/lib/types/account';
import type { VerificationStatus } from '@/lib/types';
import {
  accountDisplayName,
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
  verificationStatus: VerificationStatus;
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
    verificationStatus: d.verificationStatus,
  };
}

export default function AdminDroneDetailPage() {
  const params = useParams<{ id: string | string[] }>();
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();

  const droneId = useMemo(() => {
    const raw = params?.id;
    return typeof raw === 'string' ? raw : Array.isArray(raw) ? raw[0] ?? '' : '';
  }, [params]);

  const [drone, setDrone] = useState<Drone | null>(null);
  const [owner, setOwner] = useState<UserAccount | null>(null);
  const [pilot, setPilot] = useState<Pilot | null>(null);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [insurances, setInsurances] = useState<Insurance[]>([]);
  const [form, setForm] = useState<DroneFormState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const reload = useCallback(async () => {
    if (!droneId) return;
    const d = await getDrone(droneId);
    if (!d) {
      setDrone(null);
      return;
    }
    const [a, p, opList, insList] = await Promise.all([
      getAccount(d.userId),
      getPilot(d.linkedPilotId || d.userId),
      listOperators(d.userId),
      listInsurances(d.userId),
    ]);
    setDrone(d);
    setOwner(a);
    setPilot(p);
    setOperators(opList);
    setInsurances(insList);
    setForm(droneToForm(d));
    setDirty(false);
  }, [droneId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await reload();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reload]);

  if (loading) {
    return (
      <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
          {t('common.loading')}
        </div>
      </div>
    );
  }

  if (!drone || !form) {
    return (
      <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/admin/drones" className="text-sm text-gray-500 hover:text-gray-700">
          ← {t('admin.drones.title')}
        </Link>
        <p className="mt-4 text-sm text-gray-500">{t('profile.notFound')}</p>
      </div>
    );
  }

  function setField<K extends keyof DroneFormState>(k: K, v: DroneFormState[K]) {
    setForm((p) => (p ? { ...p, [k]: v } : p));
    setDirty(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form || !drone) return;
    setSaving(true);
    setError(null);
    try {
      const wasPublic = drone.status === 'active' && drone.visibility === 'public';
      const willBePublic = form.status === 'active' && form.visibility === 'public';
      await updateDrone(drone.id, {
        ...form,
        insuranceId: form.insuranceId || null,
        publishedAt: !wasPublic && willBePublic
          ? new Date().toISOString()
          : drone.publishedAt,
      });
      await reload();
      setSavedAt(Date.now());
    } catch (err) {
      console.error('[admin drone] save failed', err);
      setError(t('account.saveError'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!drone) return;
    setSaving(true);
    try {
      await deleteDrone(drone.id);
      router.push('/admin/drones');
    } finally {
      setSaving(false);
    }
  }

  const isPublic = drone.status === 'active' && drone.visibility === 'public';
  const droneInsurances = insurances.filter((i) => i.link === 'drone');

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8 space-y-5">
      <Link
        href="/admin/drones"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
      >
        ← {t('admin.drones.title')}
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold text-gray-900">
            {[drone.manufacturer, drone.model].filter(Boolean).join(' ').trim() || drone.slug}
          </h2>
          <p className="mt-1 text-xs text-gray-500">
            {t('drone.field.slug')}: <code className="font-mono">{drone.slug}</code>
            {owner ? (
              <>
                {' '}
                · {t('admin.drones.col.owner')}:{' '}
                <Link href={`/admin/users/${owner.uid}`} className="text-blue-600 hover:underline">
                  {accountDisplayName(owner)}
                </Link>
              </>
            ) : null}
            {pilot ? <> · {t('drone.field.linkedPilot')}: {pilotDisplayName(pilot)}</> : null}
          </p>
          <p className="mt-1 text-xs text-gray-400">{t('admin.drones.adminEdit.subtitle')}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {savedAt && !dirty ? (
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
              {t('account.saved')}
            </span>
          ) : null}
          {isPublic ? (
            <Button href={`/u/${drone.slug}`} variant="ghost">
              {t('common.preview')}
            </Button>
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
        <FormErrorBanner show={Boolean(error)} message={error ?? undefined} />

        <Card padding="md">
          <h3 className="mb-4 text-sm font-semibold text-gray-900">{t('drone.detail.basics')}</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label={t('drone.field.manufacturer')} name="manufacturer"
              value={form.manufacturer} onChange={(e) => setField('manufacturer', e.target.value)} />
            <Input label={t('drone.field.model')} name="model"
              value={form.model} onChange={(e) => setField('model', e.target.value)} />
            <Select
              label={t('drone.field.classMarking')} name="classMarking"
              value={form.classMarking}
              onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                setField('classMarking', e.target.value as DroneClass)}
              options={DRONE_CLASSES.map((c) => ({ value: c.value, label: t(c.labelKey) }))}
            />
            <Input label={t('drone.field.serialNumber')} name="droneSerialNumber"
              value={form.droneSerialNumber}
              onChange={(e) => setField('droneSerialNumber', e.target.value)} />
            <Input label={t('drone.field.controllerSerial')} name="controllerSerialNumber"
              value={form.controllerSerialNumber}
              onChange={(e) => setField('controllerSerialNumber', e.target.value)}
              className="sm:col-span-2" />
          </div>
        </Card>

        <Card padding="md">
          <h3 className="mb-4 text-sm font-semibold text-gray-900">{t('drone.detail.linked')}</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label={t('drone.field.defaultOperator')} name="defaultOperatorId"
              value={form.defaultOperatorId}
              onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                setField('defaultOperatorId', e.target.value)}
              options={operators.map((op) => ({ value: op.id, label: operatorDisplayName(op) }))}
            />
            <Select
              label={t('drone.field.insurance')} name="insuranceId"
              value={form.insuranceId}
              onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                setField('insuranceId', e.target.value)}
              options={[
                { value: '', label: t('drone.field.insuranceNone') },
                ...droneInsurances.map((i) => ({
                  value: i.id,
                  label: `${i.provider || '—'} · ${i.policyNumber || '—'}`,
                })),
              ]}
            />
          </div>
        </Card>

        <Card padding="md">
          <h3 className="mb-4 text-sm font-semibold text-gray-900">{t('drone.detail.publish')}</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Select
              label={t('drone.field.status')} name="status"
              value={form.status}
              onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                setField('status', e.target.value as DroneStatus)}
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
                setField('visibility', e.target.value as DroneVisibility)}
              options={[
                { value: 'private', label: t('visibility.private') },
                { value: 'public', label: t('visibility.public') },
              ]}
            />
            <Select
              label={t('verification.status')} name="verificationStatus"
              value={form.verificationStatus}
              onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                setField('verificationStatus', e.target.value as VerificationStatus)}
              options={[
                { value: 'unverified', label: t('verification.unverified') },
                { value: 'pending', label: t('verification.pending') },
                { value: 'verified', label: t('verification.verified') },
                { value: 'rejected', label: t('verification.rejected') },
              ]}
            />
            <div className="sm:col-span-3">
              <p className="mb-1.5 text-sm font-medium text-gray-700">{t('drone.publicUrl')}</p>
              <code className="block overflow-x-auto rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 font-mono text-xs text-gray-700">
                {getPublicProfileUrl(drone.slug)}
              </code>
            </div>
          </div>
        </Card>

        <div className="flex justify-end">
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
        extraWarning={isPublic ? t('drone.delete.warning', { url: getPublicProfileUrl(drone.slug) }) : undefined}
        confirmLabel={t('common.delete')}
        onConfirm={handleDelete}
        onClose={() => setConfirmingDelete(false)}
      />
    </div>
  );
}
