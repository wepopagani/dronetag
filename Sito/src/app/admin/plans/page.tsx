'use client';

/**
 * Admin: plans & pricing CRUD.
 *
 * Plans are stored in `plans/{planId}` and read by the marketing page +
 * the user dashboard's plan/slot summary. Prices are stored in MINOR
 * units (cents) so we never lose precision in floating-point math.
 */

import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  createPlan,
  deletePlan,
  listPlans,
  updatePlan,
} from '@/lib/firebase/plans';
import {
  SLOT_KINDS,
  type Plan,
  type SlotKind,
} from '@/lib/types/entities';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Textarea } from '@/components/ui/Textarea';
import { Toggle } from '@/components/ui/Toggle';
import { ConfirmDialog } from '@/components/account/ConfirmDialog';
import { FormErrorBanner } from '@/components/account/FormErrorBanner';

interface PlanFormState {
  label: string;
  description: string;
  slotKind: SlotKind;
  priceCents: number;
  currency: string;
  active: boolean;
}

const EMPTY_FORM: PlanFormState = {
  label: '',
  description: '',
  slotKind: 'pdf',
  priceCents: 0,
  currency: 'CHF',
  active: true,
};

function planToForm(p: Plan): PlanFormState {
  return {
    label: p.label,
    description: p.description,
    slotKind: p.slotKind,
    priceCents: p.priceCents,
    currency: p.currency,
    active: p.active,
  };
}

function formatPrice(p: Plan): string {
  const amount = (p.priceCents / 100).toLocaleString('de-CH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${p.currency} ${amount}`;
}

export default function AdminPlansPage() {
  const { t } = useLanguage();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState<Plan | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState<Plan | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const reload = async () => {
    const list = await listPlans();
    setPlans(list);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await reload();
      } catch (err) {
        console.error('[admin plans] load failed', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSave(form: PlanFormState, target: Plan | null) {
    setBusyId(target?.id ?? 'new');
    try {
      if (target) {
        await updatePlan(target.id, form);
      } else {
        await createPlan(form);
      }
      await reload();
      setCreating(false);
      setEditing(null);
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete() {
    if (!confirmingDelete) return;
    setBusyId(confirmingDelete.id);
    try {
      await deletePlan(confirmingDelete.id);
      await reload();
      setConfirmingDelete(null);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <SectionHeader title={t('admin.plans.title')} description={t('admin.plans.subtitle')} />
        <Button onClick={() => setCreating(true)}>{t('admin.plans.new')}</Button>
      </div>

      {loading ? (
        <div className="mt-6 flex items-center gap-3 text-sm text-gray-500">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
          {t('common.loading')}
        </div>
      ) : plans.length === 0 ? (
        <EmptyState
          title={t('admin.plans.empty')}
          description={t('admin.plans.emptyDesc')}
          action={<Button onClick={() => setCreating(true)}>{t('admin.plans.new')}</Button>}
        />
      ) : (
        <Card className="mt-6 overflow-x-auto" padding="none">
          <table className="w-full min-w-[820px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-slate-50/80">
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  {t('admin.plans.col.label')}
                </th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  {t('admin.plans.col.kind')}
                </th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  {t('admin.plans.col.price')}
                </th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  {t('admin.plans.col.active')}
                </th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  {t('common.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {plans.map((p) => (
                <tr key={p.id} className="transition hover:bg-slate-50/60">
                  <td className="px-4 py-3.5">
                    <p className="font-medium text-gray-900">{p.label || '—'}</p>
                    {p.description ? (
                      <p className="mt-0.5 text-xs text-gray-500">{p.description}</p>
                    ) : null}
                    <p className="mt-1 text-[10px] text-gray-400">
                      {p.updatedAt ? formatDate(p.updatedAt) : '—'}
                    </p>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-gray-700">
                      {t(`admin.slots.kind.${p.slotKind}`)}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-sm text-gray-900">
                    {formatPrice(p)}
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={
                        p.active
                          ? 'rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-emerald-700 ring-1 ring-inset ring-emerald-600/20'
                          : 'rounded-full bg-gray-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-gray-600 ring-1 ring-inset ring-gray-500/20'
                      }
                    >
                      {p.active ? t('admin.plans.col.active') : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <Button variant="secondary" size="sm" onClick={() => setEditing(p)}>
                        {t('common.edit')}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setConfirmingDelete(p)}
                      >
                        {t('common.delete')}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {(creating || editing) ? (
        <PlanFormModal
          key={editing?.id ?? 'new'}
          isOpen
          target={editing}
          saving={busyId === (editing?.id ?? 'new')}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSubmit={(form) => handleSave(form, editing)}
        />
      ) : null}

      <ConfirmDialog
        isOpen={Boolean(confirmingDelete)}
        title={t('admin.plans.delete.title')}
        loading={busyId === confirmingDelete?.id}
        message={confirmingDelete?.label ?? ''}
        confirmLabel={t('common.delete')}
        onConfirm={handleDelete}
        onClose={() => setConfirmingDelete(null)}
      />
    </div>
  );
}

// ─── Form modal ───────────────────────────────────────────────────────────

function PlanFormModal({
  isOpen,
  target,
  saving,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  target: Plan | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: (form: PlanFormState) => void;
}) {
  const { t } = useLanguage();
  const [form, setForm] = useState<PlanFormState>(() =>
    target ? planToForm(target) : EMPTY_FORM,
  );
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  function setField<K extends keyof PlanFormState>(k: K, v: PlanFormState[K]) {
    setForm((p) => ({ ...p, [k]: v }));
    if (errors[k as string]) setErrors((e) => ({ ...e, [k]: undefined }));
  }

  function validate(): Record<string, string> {
    const e: Record<string, string> = {};
    if (!form.label.trim()) e.label = t('form.validation.required');
    if (!form.currency.trim()) e.currency = t('form.validation.required');
    if (!Number.isFinite(form.priceCents) || form.priceCents < 0) {
      e.priceCents = t('form.validation.required');
    }
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={target ? t('admin.plans.edit.title') : t('admin.plans.create.title')}
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <FormErrorBanner show={Object.keys(errors).length > 0} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label={t('admin.plans.field.label')}
            name="label"
            required
            value={form.label}
            onChange={(e) => setField('label', e.target.value)}
            error={errors.label}
          />
          <Select
            label={t('admin.plans.field.kind')}
            name="slotKind"
            value={form.slotKind}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              setField('slotKind', e.target.value as SlotKind)
            }
            options={SLOT_KINDS.map((k) => ({
              value: k,
              label: t(`admin.slots.kind.${k}`),
            }))}
          />
          <Input
            label={t('admin.plans.field.priceCents')}
            name="priceCents"
            type="number"
            value={String(form.priceCents)}
            onChange={(e) => setField('priceCents', parseInt(e.target.value, 10) || 0)}
            error={errors.priceCents}
          />
          <Input
            label={t('admin.plans.field.currency')}
            name="currency"
            required
            value={form.currency}
            onChange={(e) => setField('currency', e.target.value.toUpperCase())}
            error={errors.currency}
          />
          <Textarea
            label={t('admin.plans.field.description')}
            name="description"
            rows={3}
            value={form.description}
            onChange={(e) => setField('description', e.target.value)}
            className="sm:col-span-2"
          />
          <div className="sm:col-span-2">
            <Toggle
              label={t('admin.plans.field.active')}
              checked={form.active}
              onChange={(v) => setField('active', v)}
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" loading={saving}>
            {target ? t('common.save') : t('common.create')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
