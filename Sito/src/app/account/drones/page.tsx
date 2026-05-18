'use client';

/**
 * Drones list page.
 *
 * - Lists the user's drones with status / visibility / public URL preview.
 * - "New drone" launches a quick-create modal that captures the minimum
 *   required fields (manufacturer, model, classMarking, default operator)
 *   then routes the user to the drone detail page for the rest.
 * - Slot enforcement reads `slots.drone`.
 *
 * Detail editing (insurance link, controller serial, status / visibility,
 * active operator UI in M4) lives in `[id]/page.tsx`.
 */

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  createDrone,
  deleteDrone,
  listDronesByUser,
} from '@/lib/firebase/drones';
import { listOperators } from '@/lib/firebase/operators';
import { ensureSlots } from '@/lib/firebase/slots';
import { trackEvent } from '@/lib/analytics';
import {
  DRONE_CLASSES,
  type Drone,
  type DroneClass,
  type Operator,
  type Slots,
} from '@/lib/types/entities';
import { operatorDisplayName } from '@/lib/utils/entities';
import { getPublicProfileUrl } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/account/ConfirmDialog';
import { EntityListShell } from '@/components/account/EntityListShell';
import { FormErrorBanner } from '@/components/account/FormErrorBanner';

interface CreateFormState {
  manufacturer: string;
  model: string;
  classMarking: DroneClass;
  defaultOperatorId: string;
  droneSerialNumber: string;
}

const EMPTY_FORM: CreateFormState = {
  manufacturer: '',
  model: '',
  classMarking: 'unknown',
  defaultOperatorId: '',
  droneSerialNumber: '',
};

export default function AccountDronesPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [drones, setDrones] = useState<Drone[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [slots, setSlots] = useState<Slots | null>(null);
  const [loading, setLoading] = useState(true);

  const [creating, setCreating] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState<Drone | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const reload = useMemo(() => async () => {
    if (!user) return;
    const [dList, oList, s] = await Promise.all([
      listDronesByUser(user.uid),
      listOperators(user.uid),
      ensureSlots(user.uid),
    ]);
    setDrones(dList);
    setOperators(oList);
    setSlots(s);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        await reload();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user, reload]);

  if (loading) {
    return (
      <div className="mt-8 flex items-center gap-3 text-sm text-gray-500">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
        {t('common.loading')}
      </div>
    );
  }

  const cap = slots?.drone ?? 1;
  const atCap = drones.length >= cap;
  const noOperators = operators.length === 0;

  async function handleCreate(form: CreateFormState) {
    if (!user) return;
    setSavingId('new');
    try {
      const { id } = await createDrone({
        userId: user.uid,
        status: 'draft',
        visibility: 'private',
        verificationStatus: 'unverified',
        manufacturer: form.manufacturer,
        model: form.model,
        classMarking: form.classMarking,
        droneSerialNumber: form.droneSerialNumber,
        controllerSerialNumber: '',
        linkedPilotId: user.uid,
        defaultOperatorId: form.defaultOperatorId,
        activeOperatorId: null,
        activeOperatorUntil: null,
        activeOperatorSetAt: '',
        activeOperatorSetBy: '',
        activeOperatorReason: '',
        insuranceId: null,
        publishedAt: '',
        lastVerifiedAt: '',
      });
      trackEvent('drone_created', { classMarking: form.classMarking });
      setCreating(false);
      router.push(`/account/drones/${id}`);
    } finally {
      setSavingId(null);
    }
  }

  async function handleDelete() {
    if (!confirmingDelete) return;
    setSavingId(confirmingDelete.id);
    try {
      await deleteDrone(confirmingDelete.id);
      await reload();
      setConfirmingDelete(null);
    } finally {
      setSavingId(null);
    }
  }

  return (
    <EntityListShell
      title={t('drone.list.title')}
      used={drones.length}
      max={cap}
      newLabel={t('drone.list.new')}
      onNew={() => setCreating(true)}
      newDisabled={atCap || noOperators}
    >
      {noOperators && drones.length === 0 ? (
        <EmptyState
          title={t('drone.list.empty')}
          description={t('drone.list.emptyDesc')}
          hints={[
            t('empty.hints.operator.1'),
            t('empty.hints.operator.2'),
            t('empty.hints.operator.3'),
          ]}
          action={<Button href="/account/operators">{t('account.tab.operators')}</Button>}
        />
      ) : drones.length === 0 ? (
        <EmptyState
          title={t('drone.list.empty')}
          description={t('drone.list.emptyDesc')}
          hints={[
            t('empty.hints.drone.1'),
            t('empty.hints.drone.2'),
            t('empty.hints.drone.3'),
          ]}
          action={
            <Button onClick={() => setCreating(true)} disabled={atCap}>
              {t('drone.list.new')}
            </Button>
          }
        />
      ) : (
        <ul className="space-y-3">
          {drones.map((d) => {
            const op = operators.find((o) => o.id === d.defaultOperatorId);
            return (
              <DroneRow
                key={d.id}
                drone={d}
                operatorName={op ? operatorDisplayName(op) : '—'}
                onDelete={() => setConfirmingDelete(d)}
              />
            );
          })}
        </ul>
      )}

      {creating ? (
        <CreateDroneModal
          isOpen
          saving={savingId === 'new'}
          operators={operators}
          onClose={() => setCreating(false)}
          onSubmit={handleCreate}
        />
      ) : null}

      <ConfirmDialog
        isOpen={Boolean(confirmingDelete)}
        title={t('drone.delete.title')}
        loading={savingId === confirmingDelete?.id}
        message={
          confirmingDelete
            ? `${confirmingDelete.manufacturer} ${confirmingDelete.model || confirmingDelete.slug}`.trim()
            : ''
        }
        extraWarning={
          confirmingDelete && confirmingDelete.status === 'active' && confirmingDelete.visibility === 'public'
            ? t('drone.delete.warning', { url: getPublicProfileUrl(confirmingDelete.slug) })
            : undefined
        }
        confirmLabel={t('common.delete')}
        onConfirm={handleDelete}
        onClose={() => setConfirmingDelete(null)}
      />
    </EntityListShell>
  );
}

// ─── Drone row ────────────────────────────────────────────────────────────

function DroneRow({
  drone,
  operatorName,
  onDelete,
}: {
  drone: Drone;
  operatorName: string;
  onDelete: () => void;
}) {
  const { t } = useLanguage();
  const isPublic = drone.status === 'active' && drone.visibility === 'public';
  return (
    <li>
      <Card padding="md">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <Link
              href={`/account/drones/${drone.id}`}
              className="text-base font-semibold text-gray-900 hover:underline"
            >
              {[drone.manufacturer, drone.model].filter(Boolean).join(' ').trim() || drone.slug}
            </Link>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full bg-gray-100 px-2 py-0.5 font-mono uppercase text-gray-700">
                {drone.classMarking}
              </span>
              <span
                className={
                  isPublic
                    ? 'rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20'
                    : 'rounded-full bg-gray-50 px-2 py-0.5 font-medium text-gray-600 ring-1 ring-inset ring-gray-500/20'
                }
              >
                {isPublic ? t('visibility.public') : t('visibility.private')} · {t(`status.${drone.status}`)}
              </span>
              <span className="text-gray-500">
                {t('drone.field.defaultOperator')}: <strong>{operatorName}</strong>
              </span>
            </div>
            {isPublic ? (
              <p className="mt-2 truncate font-mono text-[11px] text-gray-400">
                {getPublicProfileUrl(drone.slug)}
              </p>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button href={`/account/drones/${drone.id}`} variant="secondary" size="sm">
              {t('common.edit')}
            </Button>
            <Button variant="ghost" size="sm" onClick={onDelete}>
              {t('common.delete')}
            </Button>
          </div>
        </div>
      </Card>
    </li>
  );
}

// ─── Quick-create modal ───────────────────────────────────────────────────

function CreateDroneModal({
  isOpen,
  saving,
  operators,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  saving: boolean;
  operators: Operator[];
  onClose: () => void;
  onSubmit: (form: CreateFormState) => void;
}) {
  const { t } = useLanguage();
  const [form, setForm] = useState<CreateFormState>(() => ({
    ...EMPTY_FORM,
    defaultOperatorId: operators.find((o) => o.isDefault)?.id ?? operators[0]?.id ?? '',
  }));
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  function setField<K extends keyof CreateFormState>(k: K, v: CreateFormState[K]) {
    setForm((p) => ({ ...p, [k]: v }));
    if (errors[k as string]) setErrors((e) => ({ ...e, [k]: undefined }));
  }

  function validate(): Record<string, string> {
    const e: Record<string, string> = {};
    if (!form.manufacturer.trim()) e.manufacturer = t('form.validation.required');
    if (!form.model.trim()) e.model = t('form.validation.required');
    if (!form.defaultOperatorId) e.defaultOperatorId = t('form.validation.required');
    return e;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const v = validate();
    setErrors(v);
    if (Object.keys(v).length > 0) return;
    onSubmit(form);
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('drone.create.title')}>
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <FormErrorBanner show={Object.keys(errors).length > 0} />
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
          />
          <Select
            label={t('drone.field.defaultOperator')} name="defaultOperatorId" required
            value={form.defaultOperatorId}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              setField('defaultOperatorId', e.target.value)
            }
            options={operators.map((op) => ({ value: op.id, label: operatorDisplayName(op) }))}
            error={errors.defaultOperatorId}
            className="sm:col-span-2"
          />
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" loading={saving}>
            {t('common.create')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
