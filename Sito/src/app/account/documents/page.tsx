'use client';

/**
 * Documents dashboard page.
 *
 * - Slot-enforced via `slots.pdf`.
 * - Each row shows a thumbnail/preview affordance for PDFs (using the
 *   existing PDFPreview component when the user opens the inline preview).
 * - In M2 the "upload" mechanism is a URL paste; full storage upload is
 *   wired in M5 alongside the admin verification queue. The URL hint
 *   guides the user to paste a Firebase Storage / signed URL.
 */

import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  createDocument,
  deleteDocument,
  listDocuments,
  updateDocument,
} from '@/lib/firebase/documents';
import { ensureSlots } from '@/lib/firebase/slots';
import type {
  DocumentKind,
  DocumentRef,
  Slots,
} from '@/lib/types/entities';
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
import { EntityPdfPreviewModal } from '@/components/account/EntityPdfPreviewModal';

const DOCUMENT_KINDS: { value: DocumentKind; labelKey: string }[] = [
  { value: 'insurance_policy', labelKey: 'doc.kind.insurance_policy' },
  { value: 'operator_license', labelKey: 'doc.kind.operator_license' },
  { value: 'drone_registration', labelKey: 'doc.kind.drone_registration' },
  { value: 'training_certificate', labelKey: 'doc.kind.training_certificate' },
  { value: 'identity', labelKey: 'doc.kind.identity' },
  { value: 'other', labelKey: 'doc.kind.other' },
];

interface DocFormState {
  kind: DocumentKind;
  label: string;
  fileUrl: string;
  fileName: string;
  notes: string;
}

const EMPTY_FORM: DocFormState = {
  kind: 'other',
  label: '',
  fileUrl: '',
  fileName: '',
  notes: '',
};

const URL_RX = /^https?:\/\/.+$/i;

function docToForm(d: DocumentRef): DocFormState {
  return {
    kind: d.kind,
    label: d.label,
    fileUrl: d.fileUrl,
    fileName: d.fileName,
    notes: d.notes,
  };
}

export default function AccountDocumentsPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [documents, setDocuments] = useState<DocumentRef[]>([]);
  const [slots, setSlots] = useState<Slots | null>(null);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState<DocumentRef | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState<DocumentRef | null>(null);
  const [previewing, setPreviewing] = useState<DocumentRef | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const reload = useMemo(() => async () => {
    if (!user) return;
    const [list, s] = await Promise.all([
      listDocuments(user.uid),
      ensureSlots(user.uid),
    ]);
    setDocuments(list);
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

  const cap = slots?.pdf ?? 1;
  const atCap = documents.length >= cap;

  async function handleSave(form: DocFormState, target: DocumentRef | null) {
    if (!user) return;
    setSavingId(target?.id ?? 'new');
    setSaveError(null);
    try {
      const inferredMime = form.fileUrl.toLowerCase().endsWith('.pdf') ? 'application/pdf' : '';
      const payload = {
        userId: user.uid,
        kind: form.kind,
        label: form.label || t(DOCUMENT_KINDS.find((k) => k.value === form.kind)?.labelKey ?? 'doc.kind.other'),
        fileUrl: form.fileUrl,
        fileName: form.fileName || guessFileName(form.fileUrl),
        fileSize: target?.fileSize ?? 0,
        mimeType: target?.mimeType || inferredMime,
        verificationStatus: target?.verificationStatus ?? 'unverified',
        notes: form.notes,
      } as const;
      if (target) {
        await updateDocument(target.id, payload);
      } else {
        await createDocument(payload);
      }
      await reload();
      setCreating(false);
      setEditing(null);
    } catch (err) {
      console.error('[documents] save failed', err);
      setSaveError(err instanceof Error ? err.message : t('account.saveError'));
    } finally {
      setSavingId(null);
    }
  }

  async function handleDelete() {
    if (!confirmingDelete) return;
    setSavingId(confirmingDelete.id);
    try {
      await deleteDocument(confirmingDelete.id);
      await reload();
      setConfirmingDelete(null);
    } finally {
      setSavingId(null);
    }
  }

  return (
    <EntityListShell
      title={t('doc.list.title')}
      subtitle={t('doc.list.subtitle', { used: documents.length, max: cap })}
      used={documents.length}
      max={cap}
      newLabel={t('doc.list.new')}
      onNew={() => setCreating(true)}
      newDisabled={atCap}
    >
      <FormErrorBanner show={Boolean(saveError)} message={saveError ?? undefined} />
      {documents.length === 0 ? (
        <EmptyState
          title={t('doc.list.empty')}
          description={t('doc.list.emptyDesc')}
          hints={[t('empty.hints.document.1'), t('empty.hints.document.2')]}
          action={
            <Button onClick={() => setCreating(true)} disabled={atCap}>
              {t('doc.list.new')}
            </Button>
          }
        />
      ) : (
        <ul className="space-y-3">
          {documents.map((d) => (
            <li key={d.id}>
              <Card padding="md">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-gray-900">
                        {d.label || t(DOCUMENT_KINDS.find((k) => k.value === d.kind)?.labelKey ?? 'doc.kind.other')}
                      </h3>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gray-700">
                        {t(DOCUMENT_KINDS.find((k) => k.value === d.kind)?.labelKey ?? 'doc.kind.other')}
                      </span>
                    </div>
                    {d.fileName ? (
                      <p className="mt-1 truncate font-mono text-[11px] text-gray-500">{d.fileName}</p>
                    ) : null}
                    {d.fileUrl ? (
                      <p className="mt-1 truncate text-[11px] text-blue-600">{d.fileUrl}</p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {d.fileUrl ? (
                      <Button variant="ghost" size="sm" onClick={() => setPreviewing(d)}>
                        {t('common.viewDocument')}
                      </Button>
                    ) : (
                      <span className="text-xs text-gray-400">{t('entity.noPdfAttached')}</span>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => setEditing(d)}>{t('common.edit')}</Button>
                    <Button variant="ghost" size="sm" onClick={() => setConfirmingDelete(d)}>{t('common.delete')}</Button>
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      {(creating || editing) ? (
        <DocFormModal
          key={editing?.id ?? 'new'}
          isOpen
          target={editing}
          saving={savingId === (editing?.id ?? 'new')}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSubmit={(form) => handleSave(form, editing)}
        />
      ) : null}

      <EntityPdfPreviewModal
        isOpen={Boolean(previewing)}
        title={previewing?.label ?? ''}
        url={previewing?.fileUrl ?? ''}
        onClose={() => setPreviewing(null)}
      />

      <ConfirmDialog
        isOpen={Boolean(confirmingDelete)}
        title={t('doc.delete.title')}
        loading={savingId === confirmingDelete?.id}
        message={confirmingDelete?.label ?? ''}
        confirmLabel={t('common.delete')}
        onConfirm={handleDelete}
        onClose={() => setConfirmingDelete(null)}
      />
    </EntityListShell>
  );
}

function guessFileName(url: string): string {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    const last = parsed.pathname.split('/').filter(Boolean).pop() ?? '';
    return decodeURIComponent(last);
  } catch {
    return '';
  }
}

// ─── Form modal ───────────────────────────────────────────────────────────

function DocFormModal({
  isOpen,
  target,
  saving,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  target: DocumentRef | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: (form: DocFormState) => void;
}) {
  const { t } = useLanguage();
  const [form, setForm] = useState<DocFormState>(() =>
    target ? docToForm(target) : EMPTY_FORM,
  );
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  function setField<K extends keyof DocFormState>(k: K, v: DocFormState[K]) {
    setForm((p) => ({ ...p, [k]: v }));
    if (errors[k as string]) setErrors((e) => ({ ...e, [k]: undefined }));
  }

  function validate(): Record<string, string> {
    const e: Record<string, string> = {};
    if (!form.fileUrl.trim()) {
      e.fileUrl = t('form.validation.required');
    } else if (!URL_RX.test(form.fileUrl)) {
      e.fileUrl = t('form.errors.invalidUrl');
    } else if (!isAllowedFileUrl(form.fileUrl)) {
      e.fileUrl = t('form.errors.urlNotAllowed');
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
      title={target ? t('doc.edit.title') : t('doc.create.title')}
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <FormErrorBanner show={Object.keys(errors).length > 0} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label={t('doc.field.kind')} name="kind"
            value={form.kind}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              setField('kind', e.target.value as DocumentKind)
            }
            options={DOCUMENT_KINDS.map((k) => ({ value: k.value, label: t(k.labelKey) }))}
          />
          <Input
            label={t('doc.field.label')} name="label"
            value={form.label}
            onChange={(e) => setField('label', e.target.value)}
          />
          <Input
            label={t('doc.field.fileUrl')} name="fileUrl" required
            value={form.fileUrl}
            onChange={(e) => setField('fileUrl', e.target.value)}
            error={errors.fileUrl}
            className="sm:col-span-2"
          />
          <p className="text-xs text-gray-500 sm:col-span-2 -mt-2">{t('doc.urlHint')}</p>
          <Input
            label={t('doc.field.fileName')} name="fileName"
            value={form.fileName}
            onChange={(e) => setField('fileName', e.target.value)}
          />
          <Textarea
            label={t('doc.field.notes')} name="notes"
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
