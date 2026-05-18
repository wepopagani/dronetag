'use client';

/**
 * Certificates dashboard page.
 *
 * Supports the fixed PRD kinds (A1/A3, A2, STS-theoretical, STS-01,
 * STS-02) plus a `custom` slot for everything else. The display label is
 * derived from the kind for fixed kinds and free-text for custom.
 *
 * Slot enforcement reads `slots.certificate`. The PRD's base plan grants
 * 1 slot; admins can grant more.
 */

import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  createCertificate,
  deleteCertificate,
  listCertificates,
  updateCertificate,
} from '@/lib/firebase/certificates';
import { ensureSlots } from '@/lib/firebase/slots';
import {
  CERTIFICATE_KINDS,
  type Certificate,
  type CertificateKind,
  type Slots,
} from '@/lib/types/entities';
import { formatDate } from '@/lib/utils';
import { isAllowedFileUrl } from '@/lib/utils/urlAllowlist';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/account/ConfirmDialog';
import { EntityListShell } from '@/components/account/EntityListShell';
import { FormErrorBanner } from '@/components/account/FormErrorBanner';

interface CertFormState {
  kind: CertificateKind;
  label: string;
  issuedBy: string;
  issuedAt: string;
  expiresAt: string;
  fileUrl: string;
  notes: string;
}

const EMPTY_FORM: CertFormState = {
  kind: 'A1_A3',
  label: '',
  issuedBy: '',
  issuedAt: '',
  expiresAt: '',
  fileUrl: '',
  notes: '',
};

const URL_RX = /^https?:\/\/.+$/i;

function certToForm(c: Certificate): CertFormState {
  return {
    kind: c.kind,
    label: c.label,
    issuedBy: c.issuedBy,
    issuedAt: c.issuedAt,
    expiresAt: c.expiresAt,
    fileUrl: c.fileUrl,
    notes: c.notes,
  };
}

export default function AccountCertificatesPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [slots, setSlots] = useState<Slots | null>(null);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState<Certificate | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState<Certificate | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const reload = useMemo(() => async () => {
    if (!user) return;
    const [list, s] = await Promise.all([
      listCertificates(user.uid),
      ensureSlots(user.uid),
    ]);
    setCertificates(list);
    setSlots(s);
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

  const cap = slots?.certificate ?? 1;
  const atCap = certificates.length >= cap;

  async function handleSave(form: CertFormState, target: Certificate | null) {
    if (!user) return;
    setSavingId(target?.id ?? 'new');
    try {
      const payload = {
        userId: user.uid,
        kind: form.kind,
        label: form.label || defaultLabelForKind(form.kind),
        issuedBy: form.issuedBy,
        issuedAt: form.issuedAt,
        expiresAt: form.expiresAt,
        fileUrl: form.fileUrl,
        verificationStatus: target?.verificationStatus ?? 'unverified',
        notes: form.notes,
      } as const;
      if (target) {
        await updateCertificate(target.id, payload);
      } else {
        await createCertificate(payload);
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
      await deleteCertificate(confirmingDelete.id);
      await reload();
      setConfirmingDelete(null);
    } finally {
      setSavingId(null);
    }
  }

  function defaultLabelForKind(k: CertificateKind): string {
    return t(CERTIFICATE_KINDS.find((c) => c.value === k)?.labelKey ?? 'cert.kind.custom');
  }

  return (
    <EntityListShell
      title={t('cert.list.title')}
      subtitle={t('cert.list.subtitle')}
      used={certificates.length}
      max={cap}
      newLabel={t('cert.list.new')}
      onNew={() => setCreating(true)}
      newDisabled={atCap}
    >
      {certificates.length === 0 ? (
        <EmptyState
          title={t('cert.list.empty')}
          description={t('cert.list.emptyDesc')}
          hints={[t('empty.hints.certificate.1'), t('empty.hints.certificate.2')]}
          action={
            <Button onClick={() => setCreating(true)} disabled={atCap}>
              {t('cert.list.new')}
            </Button>
          }
        />
      ) : (
        <ul className="space-y-3">
          {certificates.map((c) => (
            <li key={c.id}>
              <Card padding="md">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-gray-900">
                        {c.label || t(CERTIFICATE_KINDS.find((k) => k.value === c.kind)?.labelKey ?? 'cert.kind.custom')}
                      </h3>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gray-700">
                        {t(CERTIFICATE_KINDS.find((k) => k.value === c.kind)?.labelKey ?? 'cert.kind.custom')}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      {c.issuedBy ? <>{t('cert.field.issuedBy')}: <strong>{c.issuedBy}</strong> · </> : null}
                      {c.issuedAt ? <>{t('field.issuedAt')}: {formatDate(c.issuedAt)}</> : null}
                      {c.expiresAt ? <> · {t('field.expiresAt')}: {formatDate(c.expiresAt)}</> : null}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setEditing(c)}>{t('common.edit')}</Button>
                    <Button variant="ghost" size="sm" onClick={() => setConfirmingDelete(c)}>{t('common.delete')}</Button>
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      {(creating || editing) ? (
        <CertFormModal
          key={editing?.id ?? 'new'}
          isOpen
          target={editing}
          saving={savingId === (editing?.id ?? 'new')}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSubmit={(form) => handleSave(form, editing)}
        />
      ) : null}

      <ConfirmDialog
        isOpen={Boolean(confirmingDelete)}
        title={t('cert.delete.title')}
        loading={savingId === confirmingDelete?.id}
        message={confirmingDelete?.label ?? ''}
        confirmLabel={t('common.delete')}
        onConfirm={handleDelete}
        onClose={() => setConfirmingDelete(null)}
      />
    </EntityListShell>
  );
}

// ─── Form modal ───────────────────────────────────────────────────────────

function CertFormModal({
  isOpen,
  target,
  saving,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  target: Certificate | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: (form: CertFormState) => void;
}) {
  const { t } = useLanguage();
  const [form, setForm] = useState<CertFormState>(() =>
    target ? certToForm(target) : EMPTY_FORM,
  );
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  function setField<K extends keyof CertFormState>(k: K, v: CertFormState[K]) {
    setForm((p) => ({ ...p, [k]: v }));
    if (errors[k as string]) setErrors((e) => ({ ...e, [k]: undefined }));
  }

  function validate(): Record<string, string> {
    const e: Record<string, string> = {};
    if (form.kind === 'custom' && !form.label.trim()) {
      e.label = t('form.validation.required');
    }
    if (form.expiresAt && form.issuedAt && form.expiresAt < form.issuedAt) {
      e.expiresAt = t('form.errors.expiryBeforeIssue');
    }
    if (form.fileUrl) {
      if (!URL_RX.test(form.fileUrl)) {
        e.fileUrl = t('form.errors.invalidUrl');
      } else if (!isAllowedFileUrl(form.fileUrl)) {
        e.fileUrl = t('form.errors.urlNotAllowed');
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
      title={target ? t('cert.edit.title') : t('cert.create.title')}
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <FormErrorBanner show={Object.keys(errors).length > 0} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label={t('cert.field.kind')} name="kind"
            value={form.kind}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              setField('kind', e.target.value as CertificateKind)
            }
            options={CERTIFICATE_KINDS.map((k) => ({ value: k.value, label: t(k.labelKey) }))}
          />
          <Input
            label={t('cert.field.label')} name="label"
            value={form.label}
            onChange={(e) => setField('label', e.target.value)}
            error={errors.label}
            required={form.kind === 'custom'}
          />
          <Input
            label={t('cert.field.issuedBy')} name="issuedBy"
            value={form.issuedBy}
            onChange={(e) => setField('issuedBy', e.target.value)}
          />
          <Input
            label={t('field.issuedAt')} name="issuedAt" type="date"
            value={form.issuedAt}
            onChange={(e) => setField('issuedAt', e.target.value)}
          />
          <Input
            label={t('field.expiresAt')} name="expiresAt" type="date"
            value={form.expiresAt}
            onChange={(e) => setField('expiresAt', e.target.value)}
            error={errors.expiresAt}
          />
          <Input
            label={t('cert.field.fileUrl')} name="fileUrl"
            value={form.fileUrl}
            onChange={(e) => setField('fileUrl', e.target.value)}
            error={errors.fileUrl}
            className="sm:col-span-2"
          />
          <Textarea
            label={t('cert.field.notes')} name="notes"
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
