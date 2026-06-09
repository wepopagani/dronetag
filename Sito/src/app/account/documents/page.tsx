'use client';

/**
 * Documents dashboard page — upload PDFs/images via drag-and-drop (Admin SDK).
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  createDocument,
  deleteDocument,
  listDocuments,
  updateDocument,
  uploadDocumentFile,
} from '@/lib/firebase/documents';
import { ensureSlots } from '@/lib/firebase/slots';
import type { DocumentRef, Slots } from '@/lib/types/entities';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Textarea';
import { UploadField } from '@/components/ui/UploadField';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/account/ConfirmDialog';
import { EntityListShell } from '@/components/account/EntityListShell';
import { FormErrorBanner } from '@/components/account/FormErrorBanner';
import { EntityPdfPreviewModal } from '@/components/account/EntityPdfPreviewModal';

interface DocFormState {
  label: string;
  fileUrl: string;
  notes: string;
}

const EMPTY_FORM: DocFormState = {
  label: '',
  fileUrl: '',
  notes: '',
};

const FILE_ACCEPT = '.pdf,application/pdf,image/png,image/jpeg,image/webp';

function docToForm(d: DocumentRef): DocFormState {
  return {
    label: d.label,
    fileUrl: d.fileUrl,
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

  async function handleSave(form: DocFormState, target: DocumentRef | null, pendingFile: File | null) {
    if (!user) return;
    setSavingId(target?.id ?? 'new');
    setSaveError(null);
    try {
      const label = form.label.trim() || pendingFile?.name.replace(/\.[^.]+$/, '') || target?.label || t('doc.kind.other');
      const payload = {
        userId: user.uid,
        kind: 'other' as const,
        label,
        fileUrl: pendingFile ? '' : form.fileUrl,
        fileName: pendingFile?.name ?? target?.fileName ?? '',
        fileSize: pendingFile?.size ?? target?.fileSize ?? 0,
        mimeType: pendingFile?.type ?? target?.mimeType ?? '',
        verificationStatus: target?.verificationStatus ?? 'unverified',
        notes: form.notes,
      };

      let documentId = target?.id;
      if (target) {
        await updateDocument(target.id, payload);
      } else {
        documentId = await createDocument(payload);
      }

      if (pendingFile && documentId) {
        await uploadDocumentFile(documentId, pendingFile);
      }

      await reload();
      setCreating(false);
      setEditing(null);
    } catch (err) {
      console.error('[documents] save failed', err);
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
                    <h3 className="text-base font-semibold text-gray-900">
                      {d.label || t('doc.kind.other')}
                    </h3>
                    {d.fileName ? (
                      <p className="mt-1 truncate font-mono text-[11px] text-gray-500">{d.fileName}</p>
                    ) : null}
                    {d.notes ? (
                      <p className="mt-1 line-clamp-2 text-xs text-gray-500">{d.notes}</p>
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
          onSubmit={(form, pendingFile) => handleSave(form, editing, pendingFile)}
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
  onSubmit: (form: DocFormState, pendingFile: File | null) => void;
}) {
  const { t } = useLanguage();
  const [form, setForm] = useState<DocFormState>(() =>
    target ? docToForm(target) : EMPTY_FORM,
  );
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string>(() => form.fileUrl);
  const blobUrlRef = useRef<string | null>(null);

  useEffect(() => () => {
    if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
  }, []);

  function setField<K extends keyof DocFormState>(k: K, v: DocFormState[K]) {
    setForm((p) => ({ ...p, [k]: v }));
    if (errors[k as string]) setErrors((e) => ({ ...e, [k]: undefined }));
  }

  function handleFileUpload(file: File) {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    const blobUrl = URL.createObjectURL(file);
    blobUrlRef.current = blobUrl;
    setPendingFile(file);
    setFilePreviewUrl(blobUrl);
    if (errors.file) setErrors((e) => ({ ...e, file: undefined }));
  }

  function handleFileRemove() {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    setPendingFile(null);
    setFilePreviewUrl(target?.fileUrl ?? '');
  }

  function validate(): Record<string, string> {
    const e: Record<string, string> = {};
    const hasFile = Boolean(pendingFile || form.fileUrl.trim());
    if (!hasFile) e.file = t('form.validation.required');
    return e;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const v = validate();
    setErrors(v);
    if (Object.keys(v).length > 0) return;
    onSubmit(form, pendingFile);
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={target ? t('doc.edit.title') : t('doc.create.title')}
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <FormErrorBanner show={Object.keys(errors).length > 0} />

        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <UploadField
            label={t('doc.field.file')}
            accept={FILE_ACCEPT}
            currentUrl={filePreviewUrl || undefined}
            onUpload={handleFileUpload}
            onRemove={filePreviewUrl ? handleFileRemove : undefined}
            preview
            required
          />
          {errors.file ? (
            <p className="mt-2 text-xs text-red-600">{errors.file}</p>
          ) : null}
        </div>

        <Input
          label={t('doc.field.label')}
          name="label"
          value={form.label}
          onChange={(e) => setField('label', e.target.value)}
          placeholder={t('doc.field.labelHint')}
        />

        <Textarea
          label={t('doc.field.notes')}
          name="notes"
          value={form.notes}
          onChange={(e) => setField('notes', e.target.value)}
        />

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
