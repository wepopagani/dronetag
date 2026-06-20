'use client';

/**
 * Account profile editor.
 *
 * Renders the account card (type toggle, private/company info, address,
 * public branding media). The singleton pilot record at `pilots/{uid}` is
 * still ensured on first load (needed by linked drones) but is no longer
 * edited from this page.
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
import type { AccountType, Address, UserAccount } from '@/lib/types/account';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { UploadField } from '@/components/ui/UploadField';
import { FormErrorBanner } from '@/components/account/FormErrorBanner';
import { PlanSlotsSummary } from '@/components/account/PlanSlotsSummary';

const EMPTY_ADDRESS: Address = { line1: '', line2: '', city: '', postalCode: '', country: '' };

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface AccountFormState {
  accountType: AccountType;
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

type AccountErrors = Partial<Record<keyof AccountFormState | 'addressLine1' | 'submit', string>>;

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
      <p className="rounded-lg bg-gray-50 px-3 py-2.5 text-[11px] leading-relaxed text-gray-500 sm:px-4 sm:py-3 sm:text-xs">
        {t('account.editHint')}
      </p>
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
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function setAddress<K extends keyof Address>(key: K, value: string) {
    setForm((prev) => ({ ...prev, address: { ...prev.address, [key]: value } }));
    setDirty(true);
    if (key === 'line1' && errors.addressLine1) {
      setErrors((e) => ({ ...e, addressLine1: undefined }));
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const v = validateAccountForm(form, t);
    setErrors(v);
    if (hasErrors(v)) return;

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

      // Branding URLs are persisted by POST /api/account/branding (Admin SDK).
      const accountPatch = photoFile || logoFile || bannerFile
        ? (({ profilePhotoUrl: _p, logoUrl: _l, bannerUrl: _b, ...rest }) => rest)(patch)
        : patch;

      await updateAccount(uid, accountPatch);
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
          <h2 className="text-base font-semibold text-gray-900">
            {t('account.section.accountType')}
          </h2>
          {savedAt && !dirty ? (
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
              {t('account.saved')}
            </span>
          ) : null}
        </header>

        <FormErrorBanner show={Boolean(errors.submit)} message={errors.submit} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label={t('account.section.accountType')}
            name="accountType"
            value={form.accountType}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              setField('accountType', e.target.value as AccountType)
            }
            options={[
              { value: 'private', label: t('account.accountType.private') },
              { value: 'company', label: t('account.accountType.company') },
            ]}
          />
          <Input
            label={t('field.email')}
            name="email"
            type="email"
            value={form.email}
            onChange={(e) => setField('email', e.target.value)}
            required
            error={errors.email}
          />
        </div>

        {form.accountType === 'private' ? (
          <Section title={t('account.section.privateInfo')}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label={t('field.firstName')}
                name="firstName"
                value={form.firstName}
                onChange={(e) => setField('firstName', e.target.value)}
                required
                error={errors.firstName}
              />
              <Input
                label={t('field.lastName')}
                name="lastName"
                value={form.lastName}
                onChange={(e) => setField('lastName', e.target.value)}
                required
                error={errors.lastName}
              />
              <Input
                label={t('field.birthDate')}
                name="dateOfBirth"
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => setField('dateOfBirth', e.target.value)}
              />
              <Input
                label={t('field.phone')}
                name="phone"
                value={form.phone}
                onChange={(e) => setField('phone', e.target.value)}
              />
            </div>
          </Section>
        ) : (
          <Section title={t('account.section.companyInfo')}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label={t('field.companyName')}
                name="companyName"
                value={form.companyName}
                onChange={(e) => setField('companyName', e.target.value)}
                required
                error={errors.companyName}
              />
              <Input
                label={t('field.companyContactPerson')}
                name="companyContactPerson"
                value={form.companyContactPerson}
                onChange={(e) => setField('companyContactPerson', e.target.value)}
              />
              <Input
                label={t('field.companyVat')}
                name="companyVat"
                value={form.companyVat}
                onChange={(e) => setField('companyVat', e.target.value)}
              />
              <Input
                label={t('field.companyUniqueNumber')}
                name="companyUniqueNumber"
                value={form.companyUniqueNumber}
                onChange={(e) => setField('companyUniqueNumber', e.target.value)}
              />
              <Input
                label={t('field.phone')}
                name="phone"
                value={form.phone}
                onChange={(e) => setField('phone', e.target.value)}
              />
            </div>
          </Section>
        )}

        <Section title={t('account.section.media')}>
          <p className="mb-4 text-xs leading-relaxed text-gray-500">{t('account.mediaHint')}</p>
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
        </Section>

        <Section title={t('account.section.address')}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label={t('field.addressLine1')}
              name="line1"
              value={form.address.line1}
              onChange={(e) => setAddress('line1', e.target.value)}
            />
            <Input
              label={t('field.addressLine2')}
              name="line2"
              value={form.address.line2}
              onChange={(e) => setAddress('line2', e.target.value)}
            />
            <Input
              label={t('field.city')}
              name="city"
              value={form.address.city}
              onChange={(e) => setAddress('city', e.target.value)}
            />
            <Input
              label={t('field.postalCode')}
              name="postalCode"
              value={form.address.postalCode}
              onChange={(e) => setAddress('postalCode', e.target.value)}
            />
            <Input
              label={t('field.country')}
              name="country"
              value={form.address.country}
              onChange={(e) => setAddress('country', e.target.value)}
            />
          </div>
        </Section>

        <div className="flex items-center justify-end">
          <Button type="submit" loading={saving} disabled={!dirty}>
            {t('common.save')}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-gray-100 pt-6">
      <h3 className="mb-4 text-sm font-semibold text-gray-900">{title}</h3>
      {children}
    </div>
  );
}

function toAccountForm(a: UserAccount): AccountFormState {
  return {
    accountType: a.accountType ?? 'private',
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

type Translator = ReturnType<typeof useLanguage>['t'];

function validateAccountForm(form: AccountFormState, t: Translator): AccountErrors {
  const e: AccountErrors = {};
  if (!form.email.trim()) e.email = t('form.validation.required');
  else if (!EMAIL_RX.test(form.email.trim())) e.email = t('form.errors.invalidEmail');

  if (form.accountType === 'private') {
    if (!form.firstName.trim()) e.firstName = t('form.validation.required');
    if (!form.lastName.trim()) e.lastName = t('form.validation.required');
  } else {
    if (!form.companyName.trim()) e.companyName = t('form.validation.required');
  }
  return e;
}

function hasErrors(e: Record<string, string | undefined>): boolean {
  return Object.values(e).some((v) => Boolean(v));
}
