'use client';

import { type ChangeEvent, useCallback, useEffect, useRef, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { createProfile, updateProfile } from '@/lib/firebase/firestore';
import {
  uploadProfilePhoto, uploadLogo, uploadBanner, uploadPolicyPdf, uploadQrImage,
} from '@/lib/firebase/storage';
import {
  DEFAULT_PROFILE, LANGUAGES, PROFILE_STATUSES, VISIBILITY_OPTIONS, VERIFICATION_STATUSES,
  type Language, type Person, type Organization, type Insurance, type Drone, type Assets,
  type AdminMeta, type Profile, type ProfileFormData, type ProfileStatus, type Visibility,
  type VerificationStatus,
} from '@/lib/types';
import { generateSlug } from '@/lib/utils';
import { Accordion } from '@/components/ui/Accordion';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { PDFPreview } from '@/components/ui/PDFPreview';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { UploadField } from '@/components/ui/UploadField';
import { VerificationLinksPanel } from '@/components/profile/VerificationLinksPanel';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function profileToFormData(p: Profile): ProfileFormData {
  return {
    slug: p.slug, language: p.language, status: p.status, visibility: p.visibility,
    verificationStatus: p.verificationStatus, publishedAt: p.publishedAt, lastVerifiedAt: p.lastVerifiedAt,
    person: { ...p.person }, organization: { ...p.organization }, drone: { ...p.drone },
    insurance: { ...p.insurance }, assets: { ...p.assets }, documents: [...p.documents], admin: { ...p.admin },
  };
}

function isoToDateInput(iso: string): string {
  if (!iso) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function isoToDatetimeLocal(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function datetimeLocalToIso(local: string): string {
  if (!local) return '';
  const d = new Date(local);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString();
}

// ─── Section wrapper ─────────────────────────────────────────────────────────

function FormSection({ title, description, children, defaultOpen = false }: {
  title: string; description?: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
  return (
    <Accordion title={title} defaultOpen={defaultOpen}>
      {description ? <p className="mb-4 text-sm text-gray-500">{description}</p> : null}
      {children}
    </Accordion>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export type ProfileFormProps = { initialData?: Profile; onSave: (id: string) => void };

export function ProfileForm({ initialData, onSave }: ProfileFormProps) {
  const { t } = useLanguage();
  const blobUrlsRef = useRef(new Set<string>());
  const isEdit = Boolean(initialData?.id);

  const [formData, setFormData] = useState<ProfileFormData>(() =>
    initialData ? profileToFormData(initialData) : DEFAULT_PROFILE
  );
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [photoObjUrl, setPhotoObjUrl] = useState<string>();
  const [logoObjUrl, setLogoObjUrl] = useState<string>();
  const [bannerObjUrl, setBannerObjUrl] = useState<string>();
  const [pdfObjUrl, setPdfObjUrl] = useState<string>();
  const [qrObjUrl, setQrObjUrl] = useState<string>();
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    blobUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    blobUrlsRef.current.clear();
    setFormData(initialData ? profileToFormData(initialData) : DEFAULT_PROFILE);
    setPhotoFile(null); setLogoFile(null); setBannerFile(null); setPdfFile(null); setQrFile(null);
    setPhotoObjUrl(undefined); setLogoObjUrl(undefined); setBannerObjUrl(undefined); setPdfObjUrl(undefined); setQrObjUrl(undefined);
    setErrors({}); setSubmitError(null); setSaved(false);
  }, [initialData]);

  useEffect(() => {
    const tracked = blobUrlsRef.current;
    return () => { tracked.forEach((u) => URL.revokeObjectURL(u)); tracked.clear(); };
  }, []);

  // Clear success after 4s
  useEffect(() => {
    if (!saved) return;
    const id = window.setTimeout(() => setSaved(false), 4000);
    return () => window.clearTimeout(id);
  }, [saved]);

  // ─── Patchers ───────────────────────────────────────────────────────

  const patchPerson = <K extends keyof Person>(field: K) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormData((prev) => ({ ...prev, person: { ...prev.person, [field]: e.target.value } }));
    };
  const patchOrg = <K extends keyof Organization>(field: K) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormData((prev) => ({ ...prev, organization: { ...prev.organization, [field]: e.target.value } }));
    };
  const patchInsurance = <K extends keyof Insurance>(field: K) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormData((prev) => ({ ...prev, insurance: { ...prev.insurance, [field]: e.target.value } }));
    };
  const patchDrone = <K extends keyof Drone>(field: K) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormData((prev) => ({ ...prev, drone: { ...prev.drone, [field]: e.target.value } }));
    };
  const patchAdmin = <K extends keyof AdminMeta>(field: K) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormData((prev) => ({ ...prev, admin: { ...prev.admin, [field]: e.target.value } }));
    };

  const handleLanguageChange = useCallback((e: ChangeEvent<HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, language: e.target.value as Language }));
  }, []);
  const handleProfileStatusChange = useCallback((e: ChangeEvent<HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, status: e.target.value as ProfileStatus }));
  }, []);
  const handleVisibilityChange = useCallback((e: ChangeEvent<HTMLSelectElement>) => {
    const vis = e.target.value as Visibility;
    setFormData((prev) => ({
      ...prev, visibility: vis,
      publishedAt: vis === 'public' && !prev.publishedAt ? new Date().toISOString() : prev.publishedAt,
    }));
  }, []);
  const handleVerificationStatusChange = useCallback((e: ChangeEvent<HTMLSelectElement>) => {
    const vs = e.target.value as VerificationStatus;
    setFormData((prev) => ({
      ...prev, verificationStatus: vs,
      lastVerifiedAt: vs === 'verified' && !prev.lastVerifiedAt ? new Date().toISOString() : prev.lastVerifiedAt,
    }));
  }, []);
  const handleSlugChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, slug: e.target.value }));
  }, []);
  const handleInsuranceDateChange = (field: 'issueDate' | 'expiryDate') => (e: ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, insurance: { ...prev.insurance, [field]: e.target.value } }));
  };

  // ─── Validation ─────────────────────────────────────────────────────

  const validate = useCallback((): boolean => {
    const next: Record<string, string> = {};
    if (!formData.language || !LANGUAGES.some((l) => l.value === formData.language)) next.language = t('form.validation.required');
    if (!formData.person.firstName.trim()) next.firstName = t('form.validation.required');
    if (!formData.person.lastName.trim()) next.lastName = t('form.validation.required');
    if (!formData.person.operatorCode.trim()) next.operatorCode = t('form.validation.required');

    if (formData.visibility === 'public') {
      if (!formData.slug.trim()) next.slug = t('form.validation.slugRequired');
      else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(formData.slug)) next.slug = t('form.validation.slugFormat');
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }, [formData.language, formData.person.firstName, formData.person.lastName, formData.person.operatorCode, formData.visibility, formData.slug, t]);

  const handleGenerateSlug = useCallback(() => {
    setFormData((prev) => ({
      ...prev, slug: generateSlug(prev.person.firstName, prev.person.lastName, prev.person.operatorCode),
    }));
  }, []);

  function handleFileSelect(
    file: File, setFile: (f: File | null) => void,
    setObjUrl: (url: string | undefined) => void, prevUrl: string | undefined
  ) {
    if (prevUrl) { URL.revokeObjectURL(prevUrl); blobUrlsRef.current.delete(prevUrl); }
    const url = URL.createObjectURL(file);
    blobUrlsRef.current.add(url);
    setFile(file); setObjUrl(url);
  }

  // ─── Submit ─────────────────────────────────────────────────────────

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitError(null); setSaved(false);
    if (!validate()) return;
    setSaving(true);
    try {
      let profileId = initialData?.id ?? '';
      if (!isEdit) profileId = await createProfile(formData);

      const assets: Assets = { ...formData.assets };
      const insurance: Insurance = { ...formData.insurance };

      if (photoFile) assets.profilePhotoUrl = await uploadProfilePhoto(profileId, photoFile);
      if (logoFile) assets.logoUrl = await uploadLogo(profileId, logoFile);
      if (bannerFile) assets.bannerUrl = await uploadBanner(profileId, bannerFile);
      if (pdfFile) insurance.pdfUrl = await uploadPolicyPdf(profileId, pdfFile);
      if (qrFile) assets.qrCodeUrl = await uploadQrImage(profileId, qrFile);

      const hasUploads = Boolean(photoFile || logoFile || bannerFile || pdfFile || qrFile);

      if (isEdit) {
        await updateProfile(profileId, { ...formData, assets, insurance });
      } else if (hasUploads) {
        await updateProfile(profileId, { assets, insurance });
      }
      setSaved(true);
      onSave(profileId);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : t('form.submitError'));
    } finally { setSaving(false); }
  }, [formData, initialData?.id, isEdit, photoFile, logoFile, bannerFile, pdfFile, qrFile, onSave, t, validate]);

  // ─── Option lists ───────────────────────────────────────────────────

  const langOpts = LANGUAGES.map((l) => ({ value: l.value, label: l.label }));
  const statusOpts = PROFILE_STATUSES.map((s) => ({ value: s.value, label: t(s.labelKey) }));
  const visOpts = VISIBILITY_OPTIONS.map((v) => ({ value: v.value, label: t(v.labelKey) }));
  const verOpts = VERIFICATION_STATUSES.map((s) => ({ value: s.value, label: t(s.labelKey) }));

  const photoPreview = photoObjUrl || formData.assets.profilePhotoUrl || undefined;
  const logoPreview = logoObjUrl || formData.assets.logoUrl || undefined;
  const bannerPreview = bannerObjUrl || formData.assets.bannerUrl || undefined;
  const pdfPreview = pdfObjUrl || formData.insurance.pdfUrl || '';
  const qrPreview = qrObjUrl || formData.assets.qrCodeUrl || '';

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">

      {/* ── Public Data Section ────────────────────────────────────── */}
      <Card>
        <div className="mb-4 border-b border-gray-200 pb-3">
          <h2 className="text-sm font-semibold text-gray-900">{t('form.publicDataTitle')}</h2>
          <p className="text-xs text-gray-500">{t('form.publicDataSubtitle')}</p>
        </div>
        <div className="space-y-1">
          <FormSection title={t('form.person')} description={t('form.person.desc')} defaultOpen>
            <div className="grid gap-4 sm:grid-cols-2">
              <Select name="language" label={t('field.language')} value={formData.language}
                onChange={handleLanguageChange} options={langOpts} required error={errors.language} disabled={saving} />
              <div className="hidden sm:block" aria-hidden />
              <Input name="firstName" label={t('field.firstName')} value={formData.person.firstName}
                onChange={patchPerson('firstName')} required error={errors.firstName} disabled={saving} />
              <Input name="lastName" label={t('field.lastName')} value={formData.person.lastName}
                onChange={patchPerson('lastName')} required error={errors.lastName} disabled={saving} />
              <Input name="operatorCode" label={t('field.operatorCode')} value={formData.person.operatorCode}
                onChange={patchPerson('operatorCode')} required error={errors.operatorCode} disabled={saving} />
              <Input name="operatorLicense" label={t('field.operatorLicense')} value={formData.person.operatorLicense}
                onChange={patchPerson('operatorLicense')} disabled={saving} />
              <Input name="birthDate" label={t('field.birthDate')} type="date"
                value={isoToDateInput(formData.person.birthDate)} onChange={patchPerson('birthDate')} disabled={saving} />
              <Input name="nationality" label={t('field.nationality')} value={formData.person.nationality}
                onChange={patchPerson('nationality')} disabled={saving} />
              <div className="sm:col-span-2">
                <Input name="emergencyContact" label={t('field.emergencyContact')} value={formData.person.emergencyContact}
                  onChange={patchPerson('emergencyContact')} disabled={saving} />
              </div>
            </div>
          </FormSection>

          <FormSection title={t('form.organization')} description={t('form.organization.desc')}>
            <div className="grid gap-4">
              <Input name="companyName" label={t('field.companyName')} value={formData.organization.companyName}
                onChange={patchOrg('companyName')} disabled={saving} />
              <Textarea name="companyDetails" label={t('field.companyDetails')} value={formData.organization.companyDetails}
                onChange={patchOrg('companyDetails')} rows={3} disabled={saving} />
              <Textarea name="companyAddress" label={t('field.companyAddress')} value={formData.organization.companyAddress}
                onChange={patchOrg('companyAddress')} rows={2} disabled={saving} />
              <Input name="companyVat" label={t('field.companyVatOrRegistration')} value={formData.organization.companyVatOrRegistration}
                onChange={patchOrg('companyVatOrRegistration')} disabled={saving} />
            </div>
          </FormSection>

          <FormSection title={t('form.insurance')} description={t('form.insurance.desc')}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input name="insProvider" label={t('field.insuranceProvider')} value={formData.insurance.provider}
                onChange={patchInsurance('provider')} disabled={saving} />
              <Input name="policyNumber" label={t('field.policyNumber')} value={formData.insurance.policyNumber}
                onChange={patchInsurance('policyNumber')} disabled={saving} />
              <Input name="issueDate" label={t('field.issuedAt')} type="date"
                value={isoToDateInput(formData.insurance.issueDate)} onChange={handleInsuranceDateChange('issueDate')} disabled={saving} />
              <Input name="expiryDate" label={t('field.expiresAt')} type="date"
                value={isoToDateInput(formData.insurance.expiryDate)} onChange={handleInsuranceDateChange('expiryDate')} disabled={saving} />
            </div>
            <div className="mt-4 grid gap-4">
              <Textarea name="insNotes" label={t('field.insuranceNotes')} value={formData.insurance.notes}
                onChange={patchInsurance('notes')} rows={2} disabled={saving} />
              <div>
                <UploadField label={t('field.policyPdf')} accept=".pdf"
                  currentUrl={pdfObjUrl || formData.insurance.pdfUrl}
                  onUpload={(f) => handleFileSelect(f, setPdfFile, setPdfObjUrl, pdfObjUrl)} preview={false} />
                <p className="mt-1 text-[11px] text-gray-400">{t('form.pdfHint')}</p>
              </div>
              {pdfPreview ? (
                <PDFPreview url={pdfPreview} label={t('field.policyPdf')} />
              ) : null}
            </div>
          </FormSection>

          <FormSection title={t('form.drone')} description={t('form.drone.desc')}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input name="droneName" label={t('field.droneName')} value={formData.drone.droneName}
                onChange={patchDrone('droneName')} disabled={saving} />
              <Input name="droneModel" label={t('field.droneModel')} value={formData.drone.droneModel}
                onChange={patchDrone('droneModel')} disabled={saving} />
              <Input name="droneSerial" label={t('field.serialNumber')} value={formData.drone.droneSerialNumber}
                onChange={patchDrone('droneSerialNumber')} disabled={saving} />
              <Input name="droneReg" label={t('field.droneRegNumber')} value={formData.drone.droneRegistrationCode}
                onChange={patchDrone('droneRegistrationCode')} disabled={saving} />
            </div>
          </FormSection>
        </div>
      </Card>

      {/* ── Media & Assets ─────────────────────────────────────────── */}
      <Card>
        <div className="mb-4 border-b border-gray-200 pb-3">
          <h2 className="text-sm font-semibold text-gray-900">{t('form.mediaTitle')}</h2>
          <p className="text-xs text-gray-500">{t('form.mediaSubtitle')}</p>
        </div>
        <div className="space-y-1">
          <FormSection title={t('field.photo')} description={t('form.photoHint')}>
            <UploadField label={t('field.photo')} accept="image/*" currentUrl={photoPreview}
              onUpload={(f) => handleFileSelect(f, setPhotoFile, setPhotoObjUrl, photoObjUrl)} preview />
          </FormSection>
          <FormSection title={t('field.logo')}>
            <UploadField label={t('field.logo')} accept="image/*" currentUrl={logoPreview}
              onUpload={(f) => handleFileSelect(f, setLogoFile, setLogoObjUrl, logoObjUrl)} preview />
          </FormSection>
          <FormSection title={t('field.banner')}>
            <UploadField label={t('field.banner')} accept="image/*" currentUrl={bannerPreview}
              onUpload={(f) => handleFileSelect(f, setBannerFile, setBannerObjUrl, bannerObjUrl)} preview />
          </FormSection>
        </div>
      </Card>

      {/* ── Verification & Access Links ────────────────────────────── */}
      <Card>
        <div className="mb-4 border-b border-gray-200 pb-3">
          <h2 className="text-sm font-semibold text-gray-900">{t('form.verificationLinks')}</h2>
          <p className="text-xs text-gray-500">{t('form.verificationLinks.desc')}</p>
        </div>
        <VerificationLinksPanel
          slug={formData.slug}
          visibility={formData.visibility}
          qrCodeUrl={formData.assets.qrCodeUrl}
          qrPreviewUrl={qrPreview}
          nfcReference={formData.assets.nfcReference}
          onQrUpload={(f) => handleFileSelect(f, setQrFile, setQrObjUrl, qrObjUrl)}
        />
      </Card>

      {/* ── Admin Section ──────────────────────────────────────────── */}
      <Card>
        <div className="mb-4 border-b border-gray-200 pb-3">
          <h2 className="text-sm font-semibold text-gray-900">{t('form.adminTitle')}</h2>
          <p className="text-xs text-gray-500">{t('form.adminSubtitle')}</p>
        </div>
        <div className="space-y-1">
          <FormSection title={t('form.statusAndAccess')} description={t('form.statusAndAccess.desc')} defaultOpen>
            <div className="grid gap-4 sm:grid-cols-2">
              <Select name="profileStatus" label={t('dashboard.status')} value={formData.status}
                onChange={handleProfileStatusChange} options={statusOpts} disabled={saving} />
              <Select name="visibility" label={t('field.visibility')} value={formData.visibility}
                onChange={handleVisibilityChange} options={visOpts} disabled={saving} />
            </div>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="min-w-0 flex-1">
                <Input name="slug" label={t('field.slug')} value={formData.slug} onChange={handleSlugChange}
                  error={errors.slug} disabled={saving} />
              </div>
              <Button type="button" variant="secondary" disabled={saving} onClick={handleGenerateSlug} className="shrink-0">
                {t('form.generateSlug')}
              </Button>
            </div>
            {formData.visibility === 'public' && formData.slug ? (
              <p className="mt-2 text-xs text-gray-400">{t('form.publicUrlPreview')} <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-gray-600">/u/{formData.slug}</code></p>
            ) : null}
            {!formData.slug && formData.visibility === 'public' ? (
              <p className="mt-2 text-xs text-amber-500">{t('form.validation.slugRequired')}</p>
            ) : null}
          </FormSection>

          <FormSection title={t('form.verification')} description={t('form.verification.desc')}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Select name="verificationStatus" label={t('verification.status')} value={formData.verificationStatus}
                onChange={handleVerificationStatusChange} options={verOpts} disabled={saving} />
              <Input name="lastVerifiedAt" label={t('field.lastVerifiedAt')} type="datetime-local"
                value={isoToDatetimeLocal(formData.lastVerifiedAt)}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData((prev) => ({ ...prev, lastVerifiedAt: datetimeLocalToIso(e.target.value) }))}
                disabled={saving} />
            </div>
          </FormSection>

          <FormSection title={t('form.adminSection')} description={t('form.adminSection.desc')}>
            <div className="grid gap-4">
              <Textarea name="adminNotes" label={t('field.adminNotes')} value={formData.admin.internalNotes}
                onChange={patchAdmin('internalNotes')} rows={4} disabled={saving} />
              <Input name="lastEditedBy" label={t('field.lastEditedBy')} value={formData.admin.lastEditedBy}
                onChange={patchAdmin('lastEditedBy')} disabled={saving} />
            </div>
          </FormSection>
        </div>
      </Card>

      {/* ── Submit bar ─────────────────────────────────────────────── */}
      <div className="sticky bottom-0 z-10 -mx-4 border-t border-gray-200 bg-white/95 px-4 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.04)] backdrop-blur-sm sm:-mx-6 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            {submitError ? (
              <div className="flex items-center gap-2" role="alert">
                <svg viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4 shrink-0 text-red-500">
                  <path fillRule="evenodd" d="M8 15A7 7 0 108 1a7 7 0 000 14zm.75-9.25a.75.75 0 00-1.5 0v2.5a.75.75 0 001.5 0v-2.5zM8 11a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                <p className="text-sm font-medium text-red-600">{submitError}</p>
              </div>
            ) : null}
            {saved ? (
              <div className="flex items-center gap-2">
                <svg viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4 shrink-0 text-emerald-500">
                  <path fillRule="evenodd" d="M8 15A7 7 0 108 1a7 7 0 000 14zm3.844-8.791a.75.75 0 00-1.188-.918l-3.7 4.79-1.649-1.833a.75.75 0 10-1.114 1.004l2.25 2.5a.75.75 0 001.15-.043l4.25-5.5z" clipRule="evenodd" />
                </svg>
                <p className="text-sm font-medium text-emerald-600">{t('form.saved')}</p>
              </div>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {isEdit && initialData?.id ? (
              <span className="hidden text-[11px] text-gray-400 sm:block">{t('form.profileId')} <code className="font-mono">{initialData.id.slice(0, 8)}…</code></span>
            ) : null}
            <Button type="submit" loading={saving} disabled={saving} size="md">
              {saving ? t('form.saving') : t('common.save')}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
