'use client';

/**
 * Account profile editor.
 *
 * Renders public branding media only. Personal/account identity data is locked
 * after signup and must be changed through admin support.
 *
 * Privacy: contact/address fields stay private. Photo, logo and banner are
 * copied into public drone snapshots when a drone is published.
 */

import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { resyncUserPublicDrones } from '@/lib/firebase/dronesPublic';
import {
  ensureAccount,
  updateAccount,
  uploadAccountBanner,
  uploadAccountLogo,
  uploadAccountProfilePhoto,
} from '@/lib/firebase/account';
import { ensurePilot } from '@/lib/firebase/pilots';
import type { Address, UserAccount } from '@/lib/types/account';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { UploadField } from '@/components/ui/UploadField';
import { FormErrorBanner } from '@/components/account/FormErrorBanner';
import { PlanSlotsSummary } from '@/components/account/PlanSlotsSummary';

const EMPTY_ADDRESS: Address = { line1: '', line2: '', city: '', postalCode: '', country: '' };

interface AccountFormState {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email: string;
  phone: string;
  address: Address;
  companyName: string;
  companyContactPerson: string;
  companyVat: string;
  companyUniqueNumber: string;
  profilePhotoUrl: string;
  logoUrl: string;
  bannerUrl: string;
}

type AccountErrors = Partial<Record<'submit', string>>;

export default function AccountProfilePage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [account, setAccount] = useState<UserAccount | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const a = await ensureAccount(user.uid, user.email ?? '');
        await ensurePilot(user.uid, {
          firstName: a.firstName,
          lastName: a.lastName,
          email: a.email,
          phone: a.phone,
          address: a.address,
          dateOfBirth: a.dateOfBirth,
        });
        if (cancelled) return;
        setAccount(a);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  if (loading) {
    return (
      <div className="mt-8 flex items-center gap-3 text-sm text-gray-500">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
        {t('common.loading')}
      </div>
    );
  }

  if (!account || !user) return null;

  return (
    <div className="space-y-4 sm:space-y-6">
      <PlanSlotsSummary />
      <AccountCard
        uid={user.uid}
        initial={account}
        onSaved={(next) => setAccount(next)}
      />
      <p className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-xs leading-relaxed text-gray-500">
        {t('legal.platformDisclaimer')}
      </p>
    </div>
  );
}

function AccountCard({
  uid,
  initial,
  onSaved,
}: {
  uid: string;
  initial: UserAccount;
  onSaved: (a: UserAccount) => void;
}) {
  const { t } = useLanguage();
  const [form, setForm] = useState<AccountFormState>(() => toAccountForm(initial));
  const [errors, setErrors] = useState<AccountErrors>({});
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [dirty, setDirty] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [photoObjUrl, setPhotoObjUrl] = useState<string>();
  const [logoObjUrl, setLogoObjUrl] = useState<string>();
  const [bannerObjUrl, setBannerObjUrl] = useState<string>();
  const blobUrlsRef = useRef(new Set<string>());

  useEffect(() => {
    setForm(toAccountForm(initial));
    setPhotoFile(null);
    setLogoFile(null);
    setBannerFile(null);
    setPhotoObjUrl(undefined);
    setLogoObjUrl(undefined);
    setBannerObjUrl(undefined);
    setErrors({});
    setDirty(false);
    setSavedAt(null);
  }, [initial]);

  useEffect(() => {
    const tracked = blobUrlsRef.current;
    return () => {
      tracked.forEach((url) => URL.revokeObjectURL(url));
      tracked.clear();
    };
  }, []);

  function trackBlobUrl(url: string) {
    blobUrlsRef.current.add(url);
    return url;
  }

  function handleImageSelect(
    file: File,
    setFile: (f: File | null) => void,
    setPreview: (url: string | undefined) => void,
    prevPreview?: string,
  ) {
    if (prevPreview && blobUrlsRef.current.has(prevPreview)) {
      URL.revokeObjectURL(prevPreview);
      blobUrlsRef.current.delete(prevPreview);
    }
    setFile(file);
    setPreview(trackBlobUrl(URL.createObjectURL(file)));
    setDirty(true);
  }

  function setField<K extends keyof AccountFormState>(key: K, value: AccountFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors({});

    setSaving(true);
    try {
      let profilePhotoUrl = form.profilePhotoUrl;
      let logoUrl = form.logoUrl;
      let bannerUrl = form.bannerUrl;

      if (photoFile) profilePhotoUrl = await uploadAccountProfilePhoto(uid, photoFile);
      if (logoFile) logoUrl = await uploadAccountLogo(uid, logoFile);
      if (bannerFile) bannerUrl = await uploadAccountBanner(uid, bannerFile);

      if (photoFile || logoFile || bannerFile) {
        await resyncUserPublicDrones(uid);
      }

      const patch = {
        ...form,
        profilePhotoUrl,
        logoUrl,
        bannerUrl,
      };

      // Branding uploads are persisted by POST /api/account/branding (Admin SDK).
      // Identity, contact and address fields stay locked; admins handle changes.
      if (!photoFile && !logoFile && !bannerFile) {
        await updateAccount(uid, {
          profilePhotoUrl,
          logoUrl,
          bannerUrl,
        });
      }
      await resyncUserPublicDrones(uid);

      const next: UserAccount = {
        ...initial,
        ...patch,
        updatedAt: new Date().toISOString(),
      };
      onSaved(next);
      setPhotoFile(null);
      setLogoFile(null);
      setBannerFile(null);
      setPhotoObjUrl(undefined);
      setLogoObjUrl(undefined);
      setBannerObjUrl(undefined);
      setDirty(false);
      setSavedAt(Date.now());
    } catch (err) {
      console.error('[account] save failed', err);
      const msg = err instanceof Error ? err.message : '';
      setErrors({
        submit: msg === 'storage_billing_required' ? t('account.storageBillingRequired') : t('account.saveError'),
      });
    } finally {
      setSaving(false);
    }
  }

  const photoPreview = photoObjUrl || form.profilePhotoUrl || undefined;
  const logoPreview = logoObjUrl || form.logoUrl || undefined;
  const bannerPreview = bannerObjUrl || form.bannerUrl || undefined;

  return (
    <Card padding="md">
      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              {t('account.section.media')}
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-gray-500">
              {t('account.lockedIdentityHint')}
            </p>
          </div>
          {savedAt && !dirty ? (
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
              {t('account.saved')}
            </span>
          ) : null}
        </header>

        <FormErrorBanner show={Boolean(errors.submit)} message={errors.submit} />

        <div className="space-y-4">
          <UploadField
            label={t('field.photo')}
            accept="image/jpeg,image/png,image/webp"
            currentUrl={photoPreview}
            onUpload={(file) => handleImageSelect(file, setPhotoFile, setPhotoObjUrl, photoObjUrl)}
            preview
          />
          <UploadField
            label={t('field.logo')}
            accept="image/jpeg,image/png,image/webp"
            currentUrl={logoPreview}
            onUpload={(file) => handleImageSelect(file, setLogoFile, setLogoObjUrl, logoObjUrl)}
            preview
          />
          <UploadField
            label={t('field.banner')}
            accept="image/jpeg,image/png,image/webp"
            currentUrl={bannerPreview}
            onUpload={(file) => handleImageSelect(file, setBannerFile, setBannerObjUrl, bannerObjUrl)}
            preview
          />
        </div>

        <div className="flex items-center justify-end">
          <Button type="submit" loading={saving} disabled={!dirty}>
            {t('common.save')}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function toAccountForm(a: UserAccount): AccountFormState {
  return {
    firstName: a.firstName,
    lastName: a.lastName,
    dateOfBirth: a.dateOfBirth,
    email: a.email,
    phone: a.phone,
    address: { ...EMPTY_ADDRESS, ...a.address },
    companyName: a.companyName,
    companyContactPerson: a.companyContactPerson,
    companyVat: a.companyVat,
    companyUniqueNumber: a.companyUniqueNumber,
    profilePhotoUrl: a.profilePhotoUrl ?? '',
    logoUrl: a.logoUrl ?? '',
    bannerUrl: a.bannerUrl ?? '',
  };
}
