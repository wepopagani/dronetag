'use client';

/**
 * Account profile editor.
 *
 * Renders two stacked cards:
 *   1. Account-level fields: type toggle (private/company), private OR
 *      company info, address. Persisted to `users/{uid}` via updateAccount.
 *   2. Pilot identity: the singleton pilot record at `pilots/{uid}`,
 *      ensured on first load and persisted via updatePilot.
 *
 * Validation:
 *   - Email is required and must look valid for both account contact and
 *     pilot contact.
 *   - For private accounts, firstName + lastName are required.
 *   - For company accounts, companyName is required.
 *   - All other fields are optional but their values are persisted as
 *     entered (no silent normalisation).
 *
 * Privacy: none of these fields are exposed on the public drone page —
 * the public projection (M1) only emits the operator/pilot DISPLAY name
 * and never the address, phone, DOB, or VAT.
 */

import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { ensureAccount, updateAccount } from '@/lib/firebase/account';
import { ensurePilot, updatePilot } from '@/lib/firebase/pilots';
import type { AccountType, Address, UserAccount } from '@/lib/types/account';
import type { Pilot } from '@/lib/types/entities';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
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
}

interface PilotFormState {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationality: string;
  email: string;
  phone: string;
  address: Address;
  operatorCode: string;
  operatorLicense: string;
  emergencyContact: string;
}

type AccountErrors = Partial<Record<keyof AccountFormState | 'addressLine1' | 'submit', string>>;
type PilotErrors = Partial<Record<keyof PilotFormState | 'addressLine1' | 'submit', string>>;

export default function AccountProfilePage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [account, setAccount] = useState<UserAccount | null>(null);
  const [pilot, setPilot] = useState<Pilot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const a = await ensureAccount(user.uid, user.email ?? '');
        const p = await ensurePilot(user.uid, {
          firstName: a.firstName,
          lastName: a.lastName,
          email: a.email,
          phone: a.phone,
          address: a.address,
          dateOfBirth: a.dateOfBirth,
        });
        if (cancelled) return;
        setAccount(a);
        setPilot(p);
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

  if (!account || !pilot) return null;

  return (
    <div className="mt-6 space-y-6">
      <p className="rounded-lg bg-gray-50 px-4 py-3 text-xs leading-relaxed text-gray-500">
        {t('account.editHint')}
      </p>
      <PlanSlotsSummary />
      <AccountCard initial={account} onSaved={(next) => setAccount(next)} />
      <PilotCard initial={pilot} onSaved={(next) => setPilot(next)} />
      <p className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-xs leading-relaxed text-gray-500">
        {t('legal.platformDisclaimer')}
      </p>
    </div>
  );
}

// ─── Account card ─────────────────────────────────────────────────────────

function AccountCard({
  initial,
  onSaved,
}: {
  initial: UserAccount;
  onSaved: (a: UserAccount) => void;
}) {
  const { t } = useLanguage();
  const [form, setForm] = useState<AccountFormState>(() => toAccountForm(initial));
  const [errors, setErrors] = useState<AccountErrors>({});
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [dirty, setDirty] = useState(false);

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
      await updateAccount(initial.uid, form);
      const next: UserAccount = {
        ...initial,
        ...form,
        updatedAt: new Date().toISOString(),
      };
      onSaved(next);
      setDirty(false);
      setSavedAt(Date.now());
    } catch (err) {
      console.error('[account] save failed', err);
      setErrors({ submit: t('account.saveError') });
    } finally {
      setSaving(false);
    }
  }

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

// ─── Pilot card ───────────────────────────────────────────────────────────

function PilotCard({
  initial,
  onSaved,
}: {
  initial: Pilot;
  onSaved: (p: Pilot) => void;
}) {
  const { t } = useLanguage();
  const [form, setForm] = useState<PilotFormState>(() => toPilotForm(initial));
  const [errors, setErrors] = useState<PilotErrors>({});
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [dirty, setDirty] = useState(false);

  function setField<K extends keyof PilotFormState>(key: K, value: PilotFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const v = validatePilotForm(form, t);
    setErrors(v);
    if (hasErrors(v)) return;

    setSaving(true);
    try {
      await updatePilot(initial.userId, form);
      onSaved({ ...initial, ...form, updatedAt: new Date().toISOString() });
      setDirty(false);
      setSavedAt(Date.now());
    } catch (err) {
      console.error('[pilot] save failed', err);
      setErrors({ submit: t('account.saveError') });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card padding="md">
      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-gray-900">
            {t('account.section.pilot')}
          </h2>
          {savedAt && !dirty ? (
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
              {t('account.saved')}
            </span>
          ) : null}
        </header>

        <FormErrorBanner show={Boolean(errors.submit)} message={errors.submit} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label={t('field.firstName')}
            name="pilotFirstName"
            value={form.firstName}
            onChange={(e) => setField('firstName', e.target.value)}
            required
            error={errors.firstName}
          />
          <Input
            label={t('field.lastName')}
            name="pilotLastName"
            value={form.lastName}
            onChange={(e) => setField('lastName', e.target.value)}
            required
            error={errors.lastName}
          />
          <Input
            label={t('field.birthDate')}
            name="pilotDob"
            type="date"
            value={form.dateOfBirth}
            onChange={(e) => setField('dateOfBirth', e.target.value)}
          />
          <Input
            label={t('field.nationality')}
            name="pilotNationality"
            value={form.nationality}
            onChange={(e) => setField('nationality', e.target.value)}
          />
          <Input
            label={t('field.email')}
            name="pilotEmail"
            type="email"
            value={form.email}
            onChange={(e) => setField('email', e.target.value)}
            error={errors.email}
          />
          <Input
            label={t('field.phone')}
            name="pilotPhone"
            value={form.phone}
            onChange={(e) => setField('phone', e.target.value)}
          />
          <Input
            label={t('field.operatorCode')}
            name="pilotOperatorCode"
            value={form.operatorCode}
            onChange={(e) => setField('operatorCode', e.target.value)}
          />
          <Input
            label={t('field.operatorLicense')}
            name="pilotOperatorLicense"
            value={form.operatorLicense}
            onChange={(e) => setField('operatorLicense', e.target.value)}
          />
          <Input
            label={t('field.emergencyContact')}
            name="pilotEmergency"
            value={form.emergencyContact}
            onChange={(e) => setField('emergencyContact', e.target.value)}
            className="sm:col-span-2"
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

// ─── Section primitive ────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-gray-100 pt-6">
      <h3 className="mb-4 text-sm font-semibold text-gray-900">{title}</h3>
      {children}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────

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
  };
}

function toPilotForm(p: Pilot): PilotFormState {
  return {
    firstName: p.firstName,
    lastName: p.lastName,
    dateOfBirth: p.dateOfBirth,
    nationality: p.nationality,
    email: p.email,
    phone: p.phone,
    address: { ...EMPTY_ADDRESS, ...p.address },
    operatorCode: p.operatorCode,
    operatorLicense: p.operatorLicense,
    emergencyContact: p.emergencyContact,
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

function validatePilotForm(form: PilotFormState, t: Translator): PilotErrors {
  const e: PilotErrors = {};
  if (!form.firstName.trim()) e.firstName = t('form.validation.required');
  if (!form.lastName.trim()) e.lastName = t('form.validation.required');
  if (form.email.trim() && !EMAIL_RX.test(form.email.trim())) {
    e.email = t('form.errors.invalidEmail');
  }
  return e;
}

function hasErrors(e: Record<string, string | undefined>): boolean {
  return Object.values(e).some((v) => Boolean(v));
}
