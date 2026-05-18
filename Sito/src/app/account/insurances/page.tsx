'use client';

/**
 * Insurances dashboard page.
 *
 * - Lists policies belonging to the user.
 * - Each policy is linked to either a drone or an operator (mutually
 *   exclusive). The link picker shows only entities the user owns.
 * - Delete is guarded: if the policy is referenced by a public-active
 *   drone (`drone.insuranceId === policy.id`), the confirm dialog warns
 *   that the public profile will lose its insurance status.
 */

import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  createInsurance,
  deleteInsurance,
  listInsurances,
  updateInsurance,
} from '@/lib/firebase/insurances';
import { listDronesByUser, updateDrone } from '@/lib/firebase/drones';
import { listOperators } from '@/lib/firebase/operators';
import type {
  Drone,
  Insurance,
  InsuranceLink,
  Operator,
} from '@/lib/types/entities';
import { computePolicyStatus, formatDate } from '@/lib/utils';
import { operatorDisplayName } from '@/lib/utils/entities';
import { isAllowedFileUrl } from '@/lib/utils/urlAllowlist';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { EmptyState } from '@/components/ui/EmptyState';
import { PolicyStatusBadge } from '@/components/ui/StatusBadge';
import { ConfirmDialog } from '@/components/account/ConfirmDialog';
import { EntityListShell } from '@/components/account/EntityListShell';
import { FormErrorBanner } from '@/components/account/FormErrorBanner';

interface InsuranceFormState {
  link: InsuranceLink;
  droneId: string;
  operatorId: string;
  provider: string;
  policyNumber: string;
  issueDate: string;
  expiryDate: string;
  notes: string;
  pdfUrl: string;
}

const EMPTY_FORM: InsuranceFormState = {
  link: 'drone',
  droneId: '',
  operatorId: '',
  provider: '',
  policyNumber: '',
  issueDate: '',
  expiryDate: '',
  notes: '',
  pdfUrl: '',
};

function insuranceToForm(i: Insurance): InsuranceFormState {
  return {
    link: i.link,
    droneId: i.droneId ?? '',
    operatorId: i.operatorId ?? '',
    provider: i.provider,
    policyNumber: i.policyNumber,
    issueDate: i.issueDate,
    expiryDate: i.expiryDate,
    notes: i.notes,
    pdfUrl: i.pdfUrl,
  };
}

// V-019: URL_RX kept as a defensive sanity check, but the real
// validation is `isAllowedFileUrl` (host allowlist, https-only).
const URL_RX = /^https?:\/\/.+$/i;

export default function AccountInsurancesPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [insurances, setInsurances] = useState<Insurance[]>([]);
  const [drones, setDrones] = useState<Drone[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState<Insurance | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState<Insurance | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const reload = useMemo(() => async () => {
    if (!user) return;
    const [iList, dList, oList] = await Promise.all([
      listInsurances(user.uid),
      listDronesByUser(user.uid),
      listOperators(user.uid),
    ]);
    setInsurances(iList);
    setDrones(dList);
    setOperators(oList);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try { await reload(); } finally { if (!cancelled) setLoading(false); }
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

  function publicDronesUsingInsurance(insId: string): Drone[] {
    return drones.filter((d) =>
      d.insuranceId === insId && d.status === 'active' && d.visibility === 'public',
    );
  }

  async function handleSave(form: InsuranceFormState, target: Insurance | null) {
    if (!user) return;
    setSavingId(target?.id ?? 'new');
    try {
      // Normalise: only the field matching `link` is meaningful; clear the other.
      const droneId = form.link === 'drone' ? (form.droneId || null) : null;
      const operatorId = form.link === 'operator' ? (form.operatorId || null) : null;
      const payload = {
        userId: user.uid,
        link: form.link,
        droneId,
        operatorId,
        provider: form.provider,
        policyNumber: form.policyNumber,
        issueDate: form.issueDate,
        expiryDate: form.expiryDate,
        notes: form.notes,
        pdfUrl: form.pdfUrl,
        verificationStatus: target?.verificationStatus ?? 'unverified',
      } as const;
      if (target) {
        await updateInsurance(target.id, payload);
      } else {
        await createInsurance(payload);
      }
      await reload();
      setCreating(false);
      setEditing(null);
    } finally {
      setSavingId(null);
    }
  }

  async function handleDelete() {
    if (!confirmingDelete) return;
    setSavingId(confirmingDelete.id);
    try {
      // Detach from any drone(s) that reference this policy so they don't
      // hold a dangling insuranceId.
      const dependents = drones.filter((d) => d.insuranceId === confirmingDelete.id);
      await Promise.all(dependents.map((d) => updateDrone(d.id, { insuranceId: null })));
      await deleteInsurance(confirmingDelete.id);
      await reload();
      setConfirmingDelete(null);
    } finally {
      setSavingId(null);
    }
  }

  return (
    <EntityListShell
      title={t('insurance.list.title')}
      subtitle={t('insurance.list.subtitle')}
      newLabel={t('insurance.list.new')}
      onNew={() => setCreating(true)}
    >
      {insurances.length === 0 ? (
        <EmptyState
          title={t('insurance.list.empty')}
          description={t('insurance.list.emptyDesc')}
          hints={[t('empty.hints.insurance.1'), t('empty.hints.insurance.2')]}
          action={<Button onClick={() => setCreating(true)}>{t('insurance.list.new')}</Button>}
        />
      ) : (
        <ul className="space-y-3">
          {insurances.map((ins) => (
            <InsuranceRow
              key={ins.id}
              insurance={ins}
              linkedLabel={
                ins.link === 'drone'
                  ? droneLabel(drones.find((d) => d.id === ins.droneId))
                  : operators.find((o) => o.id === ins.operatorId)
                    ? operatorDisplayName(operators.find((o) => o.id === ins.operatorId)!)
                    : '—'
              }
              publicUsage={publicDronesUsingInsurance(ins.id).length}
              onEdit={() => setEditing(ins)}
              onDelete={() => setConfirmingDelete(ins)}
            />
          ))}
        </ul>
      )}

      {(creating || editing) ? (
        <InsuranceFormModal
          key={editing?.id ?? 'new'}
          isOpen
          target={editing}
          drones={drones}
          operators={operators}
          saving={savingId === (editing?.id ?? 'new')}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSubmit={(form) => handleSave(form, editing)}
        />
      ) : null}

      <ConfirmDialog
        isOpen={Boolean(confirmingDelete)}
        title={t('insurance.delete.title')}
        loading={savingId === confirmingDelete?.id}
        message={confirmingDelete
          ? `${confirmingDelete.provider || '—'} · ${confirmingDelete.policyNumber || '—'}`
          : ''}
        extraWarning={
          confirmingDelete && publicDronesUsingInsurance(confirmingDelete.id).length > 0
            ? t('insurance.delete.warningPublic')
            : undefined
        }
        confirmLabel={t('common.delete')}
        onConfirm={handleDelete}
        onClose={() => setConfirmingDelete(null)}
      />
    </EntityListShell>
  );
}

function droneLabel(d: Drone | undefined): string {
  if (!d) return '—';
  return [d.manufacturer, d.model].filter(Boolean).join(' ').trim() || d.slug;
}

// ─── Row ──────────────────────────────────────────────────────────────────

function InsuranceRow({
  insurance,
  linkedLabel,
  publicUsage,
  onEdit,
  onDelete,
}: {
  insurance: Insurance;
  linkedLabel: string;
  publicUsage: number;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { t } = useLanguage();
  const status = computePolicyStatus(insurance);
  return (
    <li>
      <Card padding="md">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold text-gray-900">
                {insurance.provider || t('common.notAvailable')}
              </h3>
              <PolicyStatusBadge status={status} />
            </div>
            <p className="mt-1 font-mono text-xs text-gray-600">{insurance.policyNumber || '—'}</p>
            <p className="mt-1 text-xs text-gray-500">
              {t('insurance.field.link')}: <strong>{t(`insurance.link.${insurance.link}`)}</strong>
              {linkedLabel ? <> · {linkedLabel}</> : null}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              {t('profile.validUntil')}: {insurance.expiryDate ? formatDate(insurance.expiryDate) : '—'}
            </p>
            {publicUsage > 0 ? (
              <p className="mt-1 text-xs text-amber-700">
                {t('insurance.delete.warningPublic')}
              </p>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onEdit}>{t('common.edit')}</Button>
            <Button variant="ghost" size="sm" onClick={onDelete}>{t('common.delete')}</Button>
          </div>
        </div>
      </Card>
    </li>
  );
}

// ─── Form modal ───────────────────────────────────────────────────────────

function InsuranceFormModal({
  isOpen,
  target,
  drones,
  operators,
  saving,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  target: Insurance | null;
  drones: Drone[];
  operators: Operator[];
  saving: boolean;
  onClose: () => void;
  onSubmit: (form: InsuranceFormState) => void;
}) {
  const { t } = useLanguage();
  const [form, setForm] = useState<InsuranceFormState>(() =>
    target ? insuranceToForm(target) : EMPTY_FORM,
  );
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  function setField<K extends keyof InsuranceFormState>(k: K, v: InsuranceFormState[K]) {
    setForm((p) => ({ ...p, [k]: v }));
    if (errors[k as string]) setErrors((e) => ({ ...e, [k]: undefined }));
  }

  function validate(): Record<string, string> {
    const e: Record<string, string> = {};
    if (!form.provider.trim()) e.provider = t('form.validation.required');
    if (!form.policyNumber.trim()) e.policyNumber = t('form.validation.required');
    if (form.expiryDate && form.issueDate && form.expiryDate < form.issueDate) {
      e.expiryDate = t('form.errors.expiryBeforeIssue');
    }
    if (form.pdfUrl) {
      if (!URL_RX.test(form.pdfUrl)) {
        e.pdfUrl = t('form.errors.invalidUrl');
      } else if (!isAllowedFileUrl(form.pdfUrl)) {
        e.pdfUrl = t('form.errors.urlNotAllowed');
      }
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
      title={target ? t('insurance.edit.title') : t('insurance.create.title')}
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <FormErrorBanner show={Object.keys(errors).length > 0} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label={t('insurance.field.link')} name="link"
            value={form.link}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              setField('link', e.target.value as InsuranceLink)
            }
            options={[
              { value: 'drone', label: t('insurance.link.drone') },
              { value: 'operator', label: t('insurance.link.operator') },
            ]}
          />
          {form.link === 'drone' ? (
            <Select
              label={t('insurance.field.drone')} name="droneId"
              value={form.droneId}
              onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                setField('droneId', e.target.value)
              }
              options={[
                { value: '', label: '—' },
                ...drones.map((d) => ({
                  value: d.id,
                  label: [d.manufacturer, d.model].filter(Boolean).join(' ').trim() || d.slug,
                })),
              ]}
            />
          ) : (
            <Select
              label={t('insurance.field.operator')} name="operatorId"
              value={form.operatorId}
              onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                setField('operatorId', e.target.value)
              }
              options={[
                { value: '', label: '—' },
                ...operators.map((op) => ({ value: op.id, label: operatorDisplayName(op) })),
              ]}
            />
          )}
          <Input
            label={t('field.insuranceProvider')} name="provider" required
            value={form.provider}
            onChange={(e) => setField('provider', e.target.value)}
            error={errors.provider}
          />
          <Input
            label={t('field.policyNumber')} name="policyNumber" required
            value={form.policyNumber}
            onChange={(e) => setField('policyNumber', e.target.value)}
            error={errors.policyNumber}
          />
          <Input
            label={t('field.issuedAt')} name="issueDate" type="date"
            value={form.issueDate}
            onChange={(e) => setField('issueDate', e.target.value)}
          />
          <Input
            label={t('field.expiresAt')} name="expiryDate" type="date"
            value={form.expiryDate}
            onChange={(e) => setField('expiryDate', e.target.value)}
            error={errors.expiryDate}
          />
          <Input
            label={t('field.policyPdf')} name="pdfUrl"
            value={form.pdfUrl}
            onChange={(e) => setField('pdfUrl', e.target.value)}
            error={errors.pdfUrl}
            className="sm:col-span-2"
          />
          <Textarea
            label={t('field.insuranceNotes')} name="notes"
            value={form.notes}
            onChange={(e) => setField('notes', e.target.value)}
            className="sm:col-span-2"
          />
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
