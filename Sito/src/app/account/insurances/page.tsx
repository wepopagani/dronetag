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

import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  createInsurance,
  deleteInsurance,
  listInsurances,
  updateInsurance,
  uploadInsurancePolicyPdf,
} from '@/lib/firebase/insurances';
import { listDronesByUser, updateDrone } from '@/lib/firebase/drones';
import { listOperators } from '@/lib/firebase/operators';
import { extractTextFromPdf } from '@/lib/insurance/extractPdfText';
import { parsePolicyPdfText, matchDroneFromPolicySpecs } from '@/lib/insurance/parsePolicyPdf';
import type {
  Drone,
  Insurance,
  InsuranceLink,
  Operator,
} from '@/lib/types/entities';
import { computePolicyStatus, describePolicyStatus, formatDate } from '@/lib/utils';
import { operatorDisplayName } from '@/lib/utils/entities';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { EmptyState } from '@/components/ui/EmptyState';
import { UploadField } from '@/components/ui/UploadField';
import { PolicyStatusBadge, PolicyStatusDetail } from '@/components/ui/StatusBadge';
import { ConfirmDialog } from '@/components/account/ConfirmDialog';
import { EntityListShell } from '@/components/account/EntityListShell';
import { FormErrorBanner } from '@/components/account/FormErrorBanner';
import { EntityPdfPreviewModal } from '@/components/account/EntityPdfPreviewModal';

interface InsuranceFormState {
  link: InsuranceLink;
  droneId: string;
  operatorId: string;
  provider: string;
  policyNumber: string;
  holderName: string;
  issueDate: string;
  expiryDate: string;
  pdfUrl: string;
}

const EMPTY_FORM: InsuranceFormState = {
  link: 'drone',
  droneId: '',
  operatorId: '',
  provider: '',
  policyNumber: '',
  holderName: '',
  issueDate: '',
  expiryDate: '',
  pdfUrl: '',
};

function insuranceToForm(i: Insurance): InsuranceFormState {
  return {
    link: i.link,
    droneId: i.droneId ?? '',
    operatorId: i.operatorId ?? '',
    provider: i.provider,
    policyNumber: i.policyNumber,
    holderName: i.holderName,
    issueDate: i.issueDate,
    expiryDate: i.expiryDate,
    pdfUrl: i.pdfUrl,
  };
}

function formToInsurancePreview(form: InsuranceFormState): Insurance {
  return {
    id: 'preview',
    userId: '',
    link: form.link,
    droneId: form.droneId || null,
    operatorId: form.operatorId || null,
    provider: form.provider,
    policyNumber: form.policyNumber,
    holderName: form.holderName,
    issueDate: form.issueDate,
    expiryDate: form.expiryDate,
    notes: '',
    pdfUrl: form.pdfUrl,
    verificationStatus: 'unverified',
    createdAt: '',
    updatedAt: '',
  };
}

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
  const [previewing, setPreviewing] = useState<Insurance | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

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

  async function handleSave(
    form: InsuranceFormState,
    target: Insurance | null,
    pendingPdf: File | null,
  ) {
    if (!user) return;
    setSavingId(target?.id ?? 'new');
    setSaveError(null);
    try {
      const droneId = form.link === 'drone' ? (form.droneId || null) : null;
      const operatorId = form.link === 'operator' ? (form.operatorId || null) : null;
      const payload = {
        userId: user.uid,
        link: form.link,
        droneId,
        operatorId,
        provider: form.provider,
        policyNumber: form.policyNumber,
        holderName: form.holderName,
        issueDate: form.issueDate,
        expiryDate: form.expiryDate,
        notes: target?.notes ?? '',
        pdfUrl: pendingPdf ? '' : form.pdfUrl,
        verificationStatus: target?.verificationStatus ?? 'unverified',
      } as const;

      let insuranceId = target?.id;
      if (target) {
        await updateInsurance(target.id, payload);
      } else {
        insuranceId = await createInsurance(payload);
      }

      if (pendingPdf && insuranceId) {
        await uploadInsurancePolicyPdf(insuranceId, pendingPdf);
      }

      await reload();
      setCreating(false);
      setEditing(null);
    } catch (err) {
      console.error('[insurances] save failed', err);
      setSaveError(
        err instanceof Error && err.message === 'storage_billing_required'
          ? t('account.storageBillingRequired')
          : (err instanceof Error ? err.message : t('account.saveError')),
      );
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
      <FormErrorBanner show={Boolean(saveError)} message={saveError ?? undefined} />
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
              onView={() => setPreviewing(ins)}
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
          onSubmit={(form, pendingPdf) => handleSave(form, editing, pendingPdf)}
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

      <EntityPdfPreviewModal
        isOpen={Boolean(previewing)}
        title={previewing?.provider || t('field.policyPdf')}
        url={previewing?.pdfUrl ?? ''}
        onClose={() => setPreviewing(null)}
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
  onView,
}: {
  insurance: Insurance;
  linkedLabel: string;
  publicUsage: number;
  onEdit: () => void;
  onDelete: () => void;
  onView: () => void;
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
            {insurance.holderName ? (
              <p className="mt-1 text-xs text-gray-600">{insurance.holderName}</p>
            ) : null}
            <p className="mt-1 text-xs text-gray-500">
              {t('insurance.field.link')}: <strong>{t(`insurance.link.${insurance.link}`)}</strong>
              {linkedLabel ? <> · {linkedLabel}</> : null}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              {insurance.issueDate && insurance.expiryDate ? (
                <>
                  {t('insurance.field.validity')}: {formatDate(insurance.issueDate)} – {formatDate(insurance.expiryDate)}
                </>
              ) : (
                <>
                  {t('profile.validUntil')}: {insurance.expiryDate ? formatDate(insurance.expiryDate) : '—'}
                </>
              )}
            </p>
            {publicUsage > 0 ? (
              <p className="mt-1 text-xs text-amber-700">
                {t('insurance.delete.warningPublic')}
              </p>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {insurance.pdfUrl ? (
              <Button variant="ghost" size="sm" onClick={onView}>
                {t('common.viewDocument')}
              </Button>
            ) : (
              <span className="text-xs text-gray-400">{t('entity.noPdfAttached')}</span>
            )}
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
  onSubmit: (form: InsuranceFormState, pendingPdf: File | null) => void;
}) {
  const { t } = useLanguage();
  const [form, setForm] = useState<InsuranceFormState>(() =>
    target ? insuranceToForm(target) : EMPTY_FORM,
  );
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [pendingPdf, setPendingPdf] = useState<File | null>(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string>(() => form.pdfUrl);
  const [parsing, setParsing] = useState(false);
  const [parseMessage, setParseMessage] = useState<string | null>(null);
  const [detectedDrone, setDetectedDrone] = useState<{
    manufacturer: string;
    model: string;
    registrationMark: string;
    matchedDroneId: string | null;
  } | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  useEffect(() => () => {
    if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
  }, []);

  function setField<K extends keyof InsuranceFormState>(k: K, v: InsuranceFormState[K]) {
    setForm((p) => ({ ...p, [k]: v }));
    if (errors[k as string]) setErrors((e) => ({ ...e, [k]: undefined }));
  }

  async function handlePdfUpload(file: File) {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    const blobUrl = URL.createObjectURL(file);
    blobUrlRef.current = blobUrl;
    setPendingPdf(file);
    setPdfPreviewUrl(blobUrl);
    setParseMessage(null);
    setDetectedDrone(null);
    setParsing(true);

    try {
      const text = await extractTextFromPdf(file);
      const parsed = parsePolicyPdfText(text);
      const matchedDroneId = matchDroneFromPolicySpecs(
        drones,
        parsed.droneManufacturer,
        parsed.droneModel,
      );

      if (parsed.droneManufacturer || parsed.droneModel) {
        setDetectedDrone({
          manufacturer: parsed.droneManufacturer,
          model: parsed.droneModel,
          registrationMark: parsed.droneRegistrationMark,
          matchedDroneId,
        });
      }

      setForm((prev) => ({
        ...prev,
        link: parsed.droneManufacturer || parsed.droneModel ? 'drone' : prev.link,
        droneId: matchedDroneId || prev.droneId,
        holderName: parsed.holderName || prev.holderName,
        provider: parsed.provider || prev.provider,
        policyNumber: parsed.policyNumber || prev.policyNumber,
        issueDate: parsed.issueDate || prev.issueDate,
        expiryDate: parsed.expiryDate || prev.expiryDate,
      }));
      if (parsed.partial) {
        setParseMessage(t('insurance.parse.partial'));
      } else if (parsed.provider || parsed.policyNumber || parsed.expiryDate) {
        setParseMessage(t('insurance.parse.success'));
      } else {
        setParseMessage(t('insurance.parse.failed'));
      }
    } catch {
      setParseMessage(t('insurance.parse.failed'));
    } finally {
      setParsing(false);
    }
  }

  function handlePdfRemove() {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    setPendingPdf(null);
    setPdfPreviewUrl(target?.pdfUrl ?? '');
    setParseMessage(null);
    setDetectedDrone(null);
  }

  function validate(): Record<string, string> {
    const e: Record<string, string> = {};
    if (!form.provider.trim()) e.provider = t('form.validation.required');
    if (!form.policyNumber.trim()) e.policyNumber = t('form.validation.required');
    if (form.expiryDate && form.issueDate && form.expiryDate < form.issueDate) {
      e.expiryDate = t('form.errors.expiryBeforeIssue');
    }
    return e;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const v = validate();
    setErrors(v);
    if (Object.keys(v).length > 0) return;
    onSubmit(form, pendingPdf);
  }

  const previewInsurance = formToInsurancePreview(form);
  const policySummary = describePolicyStatus(previewInsurance);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={target ? t('insurance.edit.title') : t('insurance.create.title')}
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <FormErrorBanner show={Object.keys(errors).length > 0} />

        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <UploadField
            label={t('field.policyPdf')}
            accept=".pdf,application/pdf"
            currentUrl={pdfPreviewUrl || undefined}
            onUpload={handlePdfUpload}
            onRemove={pdfPreviewUrl ? handlePdfRemove : undefined}
            preview
            className="mb-0"
          />
          {parsing ? (
            <p className="mt-2 flex items-center gap-2 text-xs text-gray-500">
              <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
              {t('insurance.parse.parsing')}
            </p>
          ) : null}
          {parseMessage ? (
            <p className="mt-2 text-xs text-blue-700">{parseMessage}</p>
          ) : null}
          <p className="mt-2 text-[11px] text-gray-400">{t('insurance.parse.hint')}</p>
        </div>

        {(form.provider || form.policyNumber || form.expiryDate) ? (
          <div className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-gray-200 px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900">
                {form.provider || t('common.notAvailable')}
              </p>
              {form.holderName ? (
                <p className="mt-0.5 text-xs text-gray-600">{form.holderName}</p>
              ) : null}
              {form.policyNumber ? (
                <p className="mt-0.5 font-mono text-xs text-gray-600">{form.policyNumber}</p>
              ) : null}
              {form.issueDate && form.expiryDate ? (
                <p className="mt-1 text-xs text-gray-500">
                  {formatDate(form.issueDate)} – {formatDate(form.expiryDate)}
                </p>
              ) : form.expiryDate ? (
                <p className="mt-1 text-xs text-gray-500">
                  {t('profile.validUntil')}: {formatDate(form.expiryDate)}
                </p>
              ) : null}
              {detectedDrone ? (
                <p className="mt-1 text-xs text-gray-500">
                  {t('insurance.parse.droneDetected')}:{' '}
                  <strong>
                    {[detectedDrone.manufacturer, detectedDrone.model].filter(Boolean).join(' ')}
                  </strong>
                  {detectedDrone.matchedDroneId ? (
                    <span className="text-emerald-700"> · {t('insurance.parse.droneMatched')}</span>
                  ) : (
                    <span className="text-amber-700"> · {t('insurance.parse.droneNotMatched')}</span>
                  )}
                </p>
              ) : null}
            </div>
            <PolicyStatusDetail summary={policySummary} />
          </div>
        ) : null}

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
            label={t('field.holderName')} name="holderName"
            value={form.holderName}
            onChange={(e) => setField('holderName', e.target.value)}
            className="sm:col-span-2"
          />
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
