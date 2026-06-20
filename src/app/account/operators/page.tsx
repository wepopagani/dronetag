'use client';

/**
 * Operators dashboard page.
 *
 * - Lists the user's operators (max MAX_OPERATORS = 3).
 * - Inline modal for create/edit, with a kind selector that swaps between
 *   the "private" and "company" sub-forms.
 * - Default-operator toggle is mutually exclusive: marking an operator as
 *   default flips the previous default to non-default in a follow-up
 *   write before persisting the new one.
 * - Delete is guarded: if the operator is the default for any public-
 *   active drone, the confirm dialog surfaces the count and asks the
 *   user to acknowledge before proceeding.
 *
 * Slot enforcement: the "New operator" CTA is disabled when the user
 * already has min(slots.operator, MAX_OPERATORS) operators.
 */

import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  createOperator,
  deleteOperator,
  listOperators,
  updateOperator,
} from '@/lib/firebase/operators';
import { listDronesByUser } from '@/lib/firebase/drones';
import { ensureSlots } from '@/lib/firebase/slots';
import {
  EMPTY_OPERATOR_COMPANY,
  EMPTY_OPERATOR_PRIVATE,
  MAX_OPERATORS,
  type Operator,
  type OperatorKind,
  type Slots,
} from '@/lib/types/entities';
import type { Address } from '@/lib/types/account';
import type { Drone } from '@/lib/types/entities';
import { operatorDisplayName } from '@/lib/utils/entities';
import { EntityListRow } from '@/components/ui/EntityListRow';
import { RowActionMenu } from '@/components/ui/RowActionMenu';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/account/ConfirmDialog';
import { EntityListShell } from '@/components/account/EntityListShell';
import { FormErrorBanner } from '@/components/account/FormErrorBanner';

const EMPTY_ADDRESS: Address = { line1: '', line2: '', city: '', postalCode: '', country: '' };
const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface OperatorFormState {
  kind: OperatorKind;
  label: string;
  isDefault: boolean;
  private: typeof EMPTY_OPERATOR_PRIVATE;
  company: typeof EMPTY_OPERATOR_COMPANY;
}

type OperatorErrors = Partial<Record<string, string>>;

function emptyForm(): OperatorFormState {
  return {
    kind: 'private',
    label: '',
    isDefault: false,
    private: { ...EMPTY_OPERATOR_PRIVATE, address: { ...EMPTY_ADDRESS } },
    company: { ...EMPTY_OPERATOR_COMPANY, address: { ...EMPTY_ADDRESS } },
  };
}

function operatorToForm(op: Operator): OperatorFormState {
  return {
    kind: op.kind,
    label: op.label,
    isDefault: op.isDefault,
    private: { ...EMPTY_OPERATOR_PRIVATE, ...op.private, address: { ...EMPTY_ADDRESS, ...op.private.address } },
    company: { ...EMPTY_OPERATOR_COMPANY, ...op.company, address: { ...EMPTY_ADDRESS, ...op.company.address } },
  };
}

export default function AccountOperatorsPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [operators, setOperators] = useState<Operator[]>([]);
  const [drones, setDrones] = useState<Drone[]>([]);
  const [slots, setSlots] = useState<Slots | null>(null);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState<Operator | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState<Operator | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const reload = useMemo(() => async () => {
    if (!user) return;
    const [opList, dList, s] = await Promise.all([
      listOperators(user.uid),
      listDronesByUser(user.uid),
      ensureSlots(user.uid),
    ]);
    setOperators(opList);
    setDrones(dList);
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

  const cap = slots ? Math.min(slots.operator, MAX_OPERATORS) : MAX_OPERATORS;
  const atCap = operators.length >= cap;
  const sortedOperators = useMemo(
    () =>
      [...operators].sort((a, b) => {
        if (a.isDefault && !b.isDefault) return -1;
        if (!a.isDefault && b.isDefault) return 1;
        return (a.createdAt || '').localeCompare(b.createdAt || '');
      }),
    [operators],
  );

  function dronesUsingOperator(opId: string): Drone[] {
    return drones.filter((d) =>
      (d.defaultOperatorId === opId || d.activeOperatorId === opId) &&
      d.status === 'active' &&
      d.visibility === 'public',
    );
  }

  async function handleSetCurrent(op: Operator) {
    if (op.isDefault) return;
    setSavingId(op.id);
    setSaveError(null);
    try {
      const prevDefault = operators.find((o) => o.isDefault);
      if (prevDefault) {
        await updateOperator(prevDefault.id, { isDefault: false });
      }
      await updateOperator(op.id, { isDefault: true });
      await reload();
    } catch (err) {
      console.error('[operators] set current failed', err);
      setSaveError(err instanceof Error ? err.message : t('account.saveError'));
    } finally {
      setSavingId(null);
    }
  }

  async function handleSave(form: OperatorFormState, target: Operator | null) {
    if (!user) return;
    setSavingId(target?.id ?? 'new');
    setSaveError(null);
    try {
      // If this operator is being marked default, demote any previous default.
      if (form.isDefault) {
        const prevDefault = operators.find((o) => o.isDefault && o.id !== target?.id);
        if (prevDefault) {
          await updateOperator(prevDefault.id, { isDefault: false });
        }
      }
      if (target) {
        await updateOperator(target.id, form);
      } else {
        await createOperator({ userId: user.uid, ...form });
      }
      await reload();
      setCreating(false);
      setEditing(null);
    } catch (err) {
      console.error('[operators] save failed', err);
      setSaveError(err instanceof Error ? err.message : t('account.saveError'));
    } finally {
      setSavingId(null);
    }
  }

  async function handleDelete() {
    if (!confirmingDelete) return;
    setSavingId(confirmingDelete.id);
    try {
      await deleteOperator(confirmingDelete.id);
      await reload();
      setConfirmingDelete(null);
    } finally {
      setSavingId(null);
    }
  }

  if (loading) {
    return (
      <div className="mt-8 flex items-center gap-3 text-sm text-gray-500">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
        {t('common.loading')}
      </div>
    );
  }

  return (
    <EntityListShell
      title={t('operator.list.title')}
      subtitle={t('operator.list.subtitle', { max: cap })}
      used={operators.length}
      max={cap}
      newLabel={t('operator.list.new')}
      onNew={() => setCreating(true)}
      newDisabled={atCap}
    >
      <FormErrorBanner show={Boolean(saveError)} message={saveError ?? undefined} />
      {operators.length === 0 ? (
        <EmptyState
          title={t('operator.list.empty')}
          description={t('operator.list.emptyDesc')}
          hints={[
            t('empty.hints.operator.1'),
            t('empty.hints.operator.2'),
            t('empty.hints.operator.3'),
          ]}
          action={
            <Button onClick={() => setCreating(true)} disabled={atCap}>
              {t('operator.list.new')}
            </Button>
          }
        />
      ) : (
        <>
          <p className="mb-3 text-xs leading-relaxed text-gray-500">
            {t('operator.current.hint')}
          </p>
          <ul className="space-y-3">
            {sortedOperators.map((op) => (
              <OperatorRow
                key={op.id}
                operator={op}
                droneUsage={dronesUsingOperator(op.id).length}
                selecting={savingId === op.id}
                onSetCurrent={() => handleSetCurrent(op)}
                onEdit={() => setEditing(op)}
                onDelete={() => setConfirmingDelete(op)}
              />
            ))}
          </ul>
        </>
      )}

      {(creating || editing) && (
        // `key` forces a fresh mount per target → form state initialises
        // from the new target and never needs a sync-in-effect.
        <OperatorFormModal
          key={editing?.id ?? 'new'}
          target={editing}
          isOpen
          saving={savingId === (editing?.id ?? 'new')}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSave={(form) => handleSave(form, editing)}
        />
      )}

      <ConfirmDialog
        isOpen={Boolean(confirmingDelete)}
        title={t('operator.delete.title')}
        loading={savingId === confirmingDelete?.id}
        message={
          confirmingDelete
            ? `${operatorDisplayName(confirmingDelete)} (${t(`operator.kind.${confirmingDelete.kind}`)})`
            : ''
        }
        extraWarning={
          confirmingDelete && dronesUsingOperator(confirmingDelete.id).length > 0
            ? t('operator.delete.warningPublic', {
                count: dronesUsingOperator(confirmingDelete.id).length,
              })
            : undefined
        }
        confirmLabel={t('common.delete')}
        onConfirm={handleDelete}
        onClose={() => setConfirmingDelete(null)}
      />
    </EntityListShell>
  );
}

// ─── Row ──────────────────────────────────────────────────────────────────

function OperatorRow({
  operator,
  droneUsage,
  selecting,
  onSetCurrent,
  onEdit,
  onDelete,
}: {
  operator: Operator;
  droneUsage: number;
  selecting: boolean;
  onSetCurrent: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { t } = useLanguage();
  const isCurrent = operator.isDefault;

  return (
    <li>
      <Card
        padding="md"
        className={isCurrent ? 'ring-2 ring-blue-600/30 ring-inset' : undefined}
      >
        <EntityListRow
          actions={
            <RowActionMenu
              actions={[
                ...(isCurrent
                  ? []
                  : [{ key: 'set', label: t('operator.current.setShort'), onClick: onSetCurrent }]),
                { key: 'edit', label: t('common.edit'), onClick: onEdit },
                { key: 'delete', label: t('common.delete'), onClick: onDelete, danger: true },
              ]}
            />
          }
        >
          <div className="flex min-w-0 items-start gap-2.5">
            <button
              type="button"
              onClick={onSetCurrent}
              disabled={isCurrent || selecting}
              aria-pressed={isCurrent}
              aria-label={
                isCurrent
                  ? t('operator.current.badge')
                  : t('operator.current.set', { name: operatorDisplayName(operator) })
              }
              className="tap-44 mt-0.5 inline-flex shrink-0 items-center justify-center rounded-full p-1 transition hover:bg-gray-100 disabled:cursor-default disabled:hover:bg-transparent"
            >
              {selecting ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
              ) : (
                <span
                  className={
                    isCurrent
                      ? 'flex h-5 w-5 items-center justify-center rounded-full border-[5px] border-blue-600 bg-white'
                      : 'h-5 w-5 rounded-full border-2 border-gray-300 bg-white'
                  }
                  aria-hidden
                />
              )}
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <h3 className="text-sm font-semibold text-gray-900 sm:text-base">
                  {operatorDisplayName(operator)}
                </h3>
                {isCurrent ? (
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-blue-700 ring-1 ring-inset ring-blue-600/20">
                    {t('operator.current.badge')}
                  </span>
                ) : null}
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gray-700">
                  {t(`operator.kind.${operator.kind}`)}
                </span>
              </div>
              <p className="mt-0.5 truncate text-[11px] text-gray-500 sm:text-xs">
                {operator.kind === 'company'
                  ? operator.company.email || ''
                  : operator.private.email || ''}
              </p>
              {droneUsage > 0 ? (
                <p className="mt-1 text-[11px] text-amber-700 sm:text-xs">
                  {t('operator.delete.warningPublic', { count: droneUsage })}
                </p>
              ) : null}
            </div>
          </div>
        </EntityListRow>
      </Card>
    </li>
  );
}

// ─── Form modal ───────────────────────────────────────────────────────────

function OperatorFormModal({
  target,
  isOpen,
  saving,
  onClose,
  onSave,
}: {
  target: Operator | null;
  isOpen: boolean;
  saving: boolean;
  onClose: () => void;
  onSave: (form: OperatorFormState) => void;
}) {
  const { t } = useLanguage();
  const [form, setForm] = useState<OperatorFormState>(() =>
    target ? operatorToForm(target) : emptyForm(),
  );
  const [errors, setErrors] = useState<OperatorErrors>({});

  function setField<K extends keyof OperatorFormState>(key: K, v: OperatorFormState[K]) {
    setForm((p) => ({ ...p, [key]: v }));
    if (errors[key as string]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function setPrivate<K extends keyof typeof EMPTY_OPERATOR_PRIVATE>(
    key: K,
    v: typeof EMPTY_OPERATOR_PRIVATE[K],
  ) {
    setForm((p) => ({ ...p, private: { ...p.private, [key]: v } }));
  }

  function setCompany<K extends keyof typeof EMPTY_OPERATOR_COMPANY>(
    key: K,
    v: typeof EMPTY_OPERATOR_COMPANY[K],
  ) {
    setForm((p) => ({ ...p, company: { ...p.company, [key]: v } }));
  }

  function setPrivateAddress<K extends keyof Address>(key: K, v: string) {
    setForm((p) => ({ ...p, private: { ...p.private, address: { ...p.private.address, [key]: v } } }));
  }
  function setCompanyAddress<K extends keyof Address>(key: K, v: string) {
    setForm((p) => ({ ...p, company: { ...p.company, address: { ...p.company.address, [key]: v } } }));
  }

  function validate(): OperatorErrors {
    const e: OperatorErrors = {};
    if (form.kind === 'private') {
      if (!form.private.firstName.trim()) e.privateFirstName = t('form.validation.required');
      if (!form.private.lastName.trim()) e.privateLastName = t('form.validation.required');
      if (form.private.email && !EMAIL_RX.test(form.private.email)) {
        e.privateEmail = t('form.errors.invalidEmail');
      }
    } else {
      if (!form.company.companyName.trim()) e.companyName = t('form.validation.required');
      if (form.company.email && !EMAIL_RX.test(form.company.email)) {
        e.companyEmail = t('form.errors.invalidEmail');
      }
    }
    return e;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const v = validate();
    setErrors(v);
    if (Object.keys(v).length > 0) return;
    onSave(form);
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={target ? t('operator.edit.title') : t('operator.create.title')}>
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <FormErrorBanner show={Object.keys(errors).length > 0} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label={t('operator.field.kind')}
            name="kind"
            value={form.kind}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              setField('kind', e.target.value as OperatorKind)
            }
            options={[
              { value: 'private', label: t('operator.kind.private') },
              { value: 'company', label: t('operator.kind.company') },
            ]}
          />
          <Input
            label={t('operator.field.label')}
            name="label"
            value={form.label}
            onChange={(e) => setField('label', e.target.value)}
          />
        </div>

        {form.kind === 'private' ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label={t('field.firstName')} name="privateFirstName" required
              value={form.private.firstName} onChange={(e) => setPrivate('firstName', e.target.value)}
              error={errors.privateFirstName}
            />
            <Input
              label={t('field.lastName')} name="privateLastName" required
              value={form.private.lastName} onChange={(e) => setPrivate('lastName', e.target.value)}
              error={errors.privateLastName}
            />
            <Input
              label={t('field.birthDate')} name="privateDob" type="date"
              value={form.private.dateOfBirth} onChange={(e) => setPrivate('dateOfBirth', e.target.value)}
            />
            <Input
              label={t('field.email')} name="privateEmail" type="email"
              value={form.private.email} onChange={(e) => setPrivate('email', e.target.value)}
              error={errors.privateEmail}
            />
            <Input
              label={t('field.phone')} name="privatePhone"
              value={form.private.phone} onChange={(e) => setPrivate('phone', e.target.value)}
              className="sm:col-span-2"
            />
            <AddressFields
              prefix="privateAddr"
              address={form.private.address}
              onChange={setPrivateAddress}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label={t('field.companyName')} name="companyName" required
              value={form.company.companyName} onChange={(e) => setCompany('companyName', e.target.value)}
              error={errors.companyName}
            />
            <Input
              label={t('field.companyContactPerson')} name="companyContact"
              value={form.company.contactPerson} onChange={(e) => setCompany('contactPerson', e.target.value)}
            />
            <Input
              label={t('field.companyVat')} name="companyVat"
              value={form.company.vatNumber} onChange={(e) => setCompany('vatNumber', e.target.value)}
            />
            <Input
              label={t('field.companyUniqueNumber')} name="companyUnique"
              value={form.company.uniqueCompanyNumber} onChange={(e) => setCompany('uniqueCompanyNumber', e.target.value)}
            />
            <Input
              label={t('field.email')} name="companyEmail" type="email"
              value={form.company.email} onChange={(e) => setCompany('email', e.target.value)}
              error={errors.companyEmail}
              className="sm:col-span-2"
            />
            <AddressFields
              prefix="companyAddr"
              address={form.company.address}
              onChange={setCompanyAddress}
            />
          </div>
        )}

        <label className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5">
          <input
            type="checkbox"
            checked={form.isDefault}
            onChange={(e) => setField('isDefault', e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="flex-1 text-sm">
            <span className="font-medium text-gray-900">{t('operator.field.isDefault')}</span>
            <span className="block text-xs text-gray-500">{t('operator.field.isDefaultHint')}</span>
          </span>
        </label>

        <div className="flex flex-wrap items-center justify-end gap-2">
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

// ─── Address subform (5 inputs) ───────────────────────────────────────────

function AddressFields({
  prefix,
  address,
  onChange,
}: {
  prefix: string;
  address: Address;
  onChange: <K extends keyof Address>(key: K, value: string) => void;
}) {
  const { t } = useLanguage();
  return (
    <>
      <Input
        label={t('field.addressLine1')} name={`${prefix}Line1`}
        value={address.line1} onChange={(e) => onChange('line1', e.target.value)}
      />
      <Input
        label={t('field.addressLine2')} name={`${prefix}Line2`}
        value={address.line2} onChange={(e) => onChange('line2', e.target.value)}
      />
      <Input
        label={t('field.city')} name={`${prefix}City`}
        value={address.city} onChange={(e) => onChange('city', e.target.value)}
      />
      <Input
        label={t('field.postalCode')} name={`${prefix}Postal`}
        value={address.postalCode} onChange={(e) => onChange('postalCode', e.target.value)}
      />
      <Input
        label={t('field.country')} name={`${prefix}Country`}
        value={address.country} onChange={(e) => onChange('country', e.target.value)}
        className="sm:col-span-2"
      />
    </>
  );
}
