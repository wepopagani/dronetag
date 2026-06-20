'use client';

/**
 * Certificates dashboard page.
 *
 * Supports the fixed PRD kinds (A1/A3, A2, STS-theoretical, STS-01,
 * STS-02) plus a `custom` slot for everything else. PDF upload auto-fills
 * kind, issuer, dates and holder from ENAC / EU certificate documents.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  createCertificate,
  deleteCertificate,
  listCertificates,
  uploadCertificatePdf,
} from '@/lib/firebase/certificates';
import { ensureSlots } from '@/lib/firebase/slots';
import { extractCertificateFields } from '@/lib/certificate/extractCertificateFields';
import {
  CERTIFICATE_KINDS,
  type Certificate,
  type CertificateKind,
  type Slots,
} from '@/lib/types/entities';
import { computeCertificateStatus, formatDate } from '@/lib/utils';
import { EntityListRow } from '@/components/ui/EntityListRow';
import { RowActionMenu } from '@/components/ui/RowActionMenu';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { EmptyState } from '@/components/ui/EmptyState';
import { UploadField } from '@/components/ui/UploadField';
import { PolicyStatusBadge } from '@/components/ui/StatusBadge';
import { ConfirmDialog } from '@/components/account/ConfirmDialog';
import { EntityListShell } from '@/components/account/EntityListShell';
import { FormErrorBanner } from '@/components/account/FormErrorBanner';
import { ReadOnlyField } from '@/components/account/ReadOnlyField';
import { EntityPdfPreviewModal } from '@/components/account/EntityPdfPreviewModal';

interface CertFormState {
  kind: CertificateKind;
  registrationNumber: string;
  issuedBy: string;
  issuedAt: string;
  expiresAt: string;
  fileUrl: string;
}

const EMPTY_FORM: CertFormState = {
  kind: 'A1_A3',
  registrationNumber: '',
  issuedBy: '',
  issuedAt: '',
  expiresAt: '',
  fileUrl: '',
};

function kindLabelKey(k: CertificateKind): string {
  return CERTIFICATE_KINDS.find((c) => c.value === k)?.labelKey ?? 'cert.kind.custom';
}

export default function AccountCertificatesPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [slots, setSlots] = useState<Slots | null>(null);
  const [loading, setLoading] = useState(true);

  const [viewing, setViewing] = useState<Certificate | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirmingCreate, setConfirmingCreate] = useState(false);
  const [pendingCreate, setPendingCreate] = useState<{
    form: CertFormState;
    pendingPdf: File | null;
  } | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState<Certificate | null>(null);
  const [previewing, setPreviewing] = useState<Certificate | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

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

  async function handleCreate(form: CertFormState, pendingPdf: File | null) {
    if (!user) return;
    setSavingId('new');
    setSaveError(null);
    try {
      const certificateId = await createCertificate({
        userId: user.uid,
        kind: form.kind,
        label: '',
        registrationNumber: form.registrationNumber,
        issuedBy: form.issuedBy,
        issuedAt: form.issuedAt,
        expiresAt: form.expiresAt,
        fileUrl: pendingPdf ? '' : form.fileUrl,
        verificationStatus: 'unverified',
        notes: '',
      });

      if (pendingPdf) {
        await uploadCertificatePdf(certificateId, pendingPdf);
      }

      await reload();
      setCreating(false);
    } catch (err) {
      console.error('[certificates] create failed', err);
      const msg = err instanceof Error ? err.message : '';
      setSaveError(
        msg === 'storage_billing_required' ? t('account.storageBillingRequired') : (msg || t('account.saveError')),
      );
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
      <FormErrorBanner show={Boolean(saveError)} message={saveError ?? undefined} />
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
                <EntityListRow
                  actions={
                    <RowActionMenu
                      actions={[
                        { key: 'view', label: t('common.view'), onClick: () => setViewing(c) },
                        { key: 'delete', label: t('common.delete'), onClick: () => setConfirmingDelete(c), danger: true },
                      ]}
                      extra={
                        !c.fileUrl ? (
                          <span className="text-[11px] text-gray-400">{t('entity.noPdfAttached')}</span>
                        ) : null
                      }
                    />
                  }
                >
                  <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                    <h3 className="text-sm font-semibold text-gray-900 sm:text-base">
                      {t(kindLabelKey(c.kind))}
                    </h3>
                    <PolicyStatusBadge status={computeCertificateStatus(c)} />
                  </div>
                  {c.registrationNumber ? (
                    <p className="mt-1 truncate font-mono text-[11px] text-gray-700 sm:text-xs">{c.registrationNumber}</p>
                  ) : null}
                  <p className="mt-1 text-[11px] leading-snug text-gray-500 sm:text-xs">
                    {c.issuedBy ? <>{t('cert.field.issuedBy')}: {c.issuedBy}</> : null}
                    {c.issuedAt && c.expiresAt ? (
                      <>
                        {c.issuedBy ? ' · ' : null}
                        {formatDate(c.issuedAt)} – {formatDate(c.expiresAt)}
                      </>
                    ) : c.expiresAt ? (
                      <>
                        {c.issuedBy ? ' · ' : null}
                        {t('profile.validUntil')}: {formatDate(c.expiresAt)}
                      </>
                    ) : c.issuedAt ? (
                      <>
                        {c.issuedBy ? ' · ' : null}
                        {t('field.issuedAt')}: {formatDate(c.issuedAt)}
                      </>
                    ) : null}
                  </p>
                </EntityListRow>
              </Card>
            </li>
          ))}
        </ul>
      )}

      {creating ? (
        <CertFormModal
          isOpen
          saving={savingId === 'new'}
          onClose={() => setCreating(false)}
          onSubmit={(form, pendingPdf) => {
            setPendingCreate({ form, pendingPdf });
            setConfirmingCreate(true);
          }}
        />
      ) : null}

      {viewing ? (
        <CertViewModal
          certificate={viewing}
          onClose={() => setViewing(null)}
          onViewPdf={() => setPreviewing(viewing)}
        />
      ) : null}

      <ConfirmDialog
        isOpen={confirmingCreate}
        title={t('cert.confirmCreate.title')}
        message={t('cert.confirmCreate.message')}
        confirmLabel={t('common.confirm')}
        danger={false}
        loading={savingId === 'new'}
        onConfirm={() => {
          if (!pendingCreate) return;
          void handleCreate(pendingCreate.form, pendingCreate.pendingPdf).finally(() => {
            setConfirmingCreate(false);
            setPendingCreate(null);
          });
        }}
        onClose={() => {
          setConfirmingCreate(false);
          setPendingCreate(null);
        }}
      />

      <ConfirmDialog
        isOpen={Boolean(confirmingDelete)}
        title={t('cert.delete.title')}
        loading={savingId === confirmingDelete?.id}
        message={
          confirmingDelete
            ? [t(kindLabelKey(confirmingDelete.kind)), confirmingDelete.registrationNumber]
                .filter(Boolean)
                .join(' · ')
            : ''
        }
        confirmLabel={t('common.delete')}
        onConfirm={handleDelete}
        onClose={() => setConfirmingDelete(null)}
      />

      <EntityPdfPreviewModal
        isOpen={Boolean(previewing)}
        title={previewing ? t(kindLabelKey(previewing.kind)) : ''}
        url={previewing?.fileUrl ?? ''}
        onClose={() => setPreviewing(null)}
      />
    </EntityListShell>
  );
}

// ─── Form modal ───────────────────────────────────────────────────────────

function CertFormModal({
  isOpen,
  saving,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  saving: boolean;
  onClose: () => void;
  onSubmit: (form: CertFormState, pendingPdf: File | null) => void;
}) {
  const { t } = useLanguage();
  const [form, setForm] = useState<CertFormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [pendingPdf, setPendingPdf] = useState<File | null>(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string>(() => form.fileUrl);
  const [parsing, setParsing] = useState(false);
  const [parseMessage, setParseMessage] = useState<string | null>(null);
  const [parsedHolder, setParsedHolder] = useState<string | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  useEffect(() => () => {
    if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
  }, []);

  function setField<K extends keyof CertFormState>(k: K, v: CertFormState[K]) {
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
    setParsedHolder(null);
    setParsing(true);

    try {
      const parsed = await extractCertificateFields(file);

      if (parsed.holderName) setParsedHolder(parsed.holderName);

      setForm((prev) => ({
        ...prev,
        kind: parsed.kind ?? prev.kind,
        registrationNumber: parsed.registrationNumber || prev.registrationNumber,
        issuedBy: parsed.issuedBy || prev.issuedBy,
        issuedAt: parsed.issuedAt || prev.issuedAt,
        expiresAt: parsed.expiresAt || prev.expiresAt,
      }));

      if (parsed.partial) {
        setParseMessage(t('cert.parse.partial'));
      } else if (
        parsed.kind || parsed.registrationNumber || parsed.issuedBy || parsed.issuedAt || parsed.expiresAt
      ) {
        setParseMessage(t('cert.parse.success'));
      } else {
        setParseMessage(t('cert.parse.failed'));
      }
    } catch {
      setParseMessage(t('cert.parse.failed'));
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
    setPdfPreviewUrl('');
    setParseMessage(null);
    setParsedHolder(null);
  }

  function validate(): Record<string, string> {
    const e: Record<string, string> = {};
    if (form.expiresAt && form.issuedAt && form.expiresAt < form.issuedAt) {
      e.expiresAt = t('form.errors.expiryBeforeIssue');
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

  const status = computeCertificateStatus(form);
  const showPreview = form.kind || form.registrationNumber || form.issuedBy || form.issuedAt || form.expiresAt;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('cert.create.title')}
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <FormErrorBanner show={Object.keys(errors).length > 0} />

        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <UploadField
            label={t('cert.field.filePdf')}
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
              {t('cert.parse.parsing')}
            </p>
          ) : null}
          {parseMessage ? (
            <p className="mt-2 text-xs text-blue-700">{parseMessage}</p>
          ) : null}
          <p className="mt-2 text-[11px] text-gray-400">{t('cert.parse.hint')}</p>
        </div>

        {showPreview ? (
          <div className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-gray-200 px-4 py-3">
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-medium text-gray-900">
                {t(kindLabelKey(form.kind))}
              </p>
              {form.registrationNumber ? (
                <p className="font-mono text-xs text-gray-700">{form.registrationNumber}</p>
              ) : null}
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-600">
                {form.issuedBy ? (
                  <span>{t('cert.field.issuedBy')}: {form.issuedBy}</span>
                ) : null}
                {form.issuedAt && form.expiresAt ? (
                  <span>
                    {formatDate(form.issuedAt)} – {formatDate(form.expiresAt)}
                  </span>
                ) : form.expiresAt ? (
                  <span>{t('profile.validUntil')}: {formatDate(form.expiresAt)}</span>
                ) : form.issuedAt ? (
                  <span>{t('field.issuedAt')}: {formatDate(form.issuedAt)}</span>
                ) : null}
              </div>
              {parsedHolder ? (
                <p className="text-xs text-gray-500">
                  {t('field.holderName')}: {parsedHolder}
                </p>
              ) : null}
            </div>
            <PolicyStatusBadge status={status} />
          </div>
        ) : null}

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
            label={t('cert.field.registrationNumber')} name="registrationNumber"
            value={form.registrationNumber}
            onChange={(e) => setField('registrationNumber', e.target.value)}
            className="sm:col-span-2"
            placeholder={t('cert.field.registrationNumberHint')}
          />
          <Input
            label={t('cert.field.issuedBy')} name="issuedBy"
            value={form.issuedBy}
            onChange={(e) => setField('issuedBy', e.target.value)}
            className="sm:col-span-2"
          />
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" loading={saving}>
            {t('common.confirm')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function CertViewModal({
  certificate,
  onClose,
  onViewPdf,
}: {
  certificate: Certificate;
  onClose: () => void;
  onViewPdf: () => void;
}) {
  const { t } = useLanguage();
  const status = computeCertificateStatus(certificate);

  return (
    <Modal isOpen onClose={onClose} title={t('cert.view.title')}>
      <div className="space-y-4">
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-900">
          {t('cert.locked.hint')}
        </div>

        <div className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-gray-200 px-4 py-3">
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-medium text-gray-900">{t(kindLabelKey(certificate.kind))}</p>
            {certificate.registrationNumber ? (
              <p className="font-mono text-xs text-gray-700">{certificate.registrationNumber}</p>
            ) : null}
          </div>
          <PolicyStatusBadge status={status} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ReadOnlyField label={t('cert.field.kind')} value={t(kindLabelKey(certificate.kind))} />
          <ReadOnlyField
            label={t('cert.field.registrationNumber')}
            value={certificate.registrationNumber}
          />
          <ReadOnlyField
            label={t('cert.field.issuedBy')}
            value={certificate.issuedBy}
            className="sm:col-span-2"
          />
          <ReadOnlyField
            label={t('field.issuedAt')}
            value={certificate.issuedAt ? formatDate(certificate.issuedAt) : ''}
          />
          <ReadOnlyField
            label={t('field.expiresAt')}
            value={certificate.expiresAt ? formatDate(certificate.expiresAt) : ''}
          />
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
          {certificate.fileUrl ? (
            <Button variant="secondary" onClick={onViewPdf}>
              {t('common.viewDocument')}
            </Button>
          ) : null}
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
