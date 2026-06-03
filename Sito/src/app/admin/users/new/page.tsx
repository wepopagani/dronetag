'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import type { AccountType } from '@/lib/types/account';
import { adminFetch } from '@/lib/client/adminApi';
import {
  codesFromApiFields,
  validateAdminCreateUserInput,
  type AdminCreateUserField,
  type AdminCreateUserFieldErrors,
} from '@/lib/validation/adminCreateUser';
import { adminCreateUserMessages } from '@/lib/validation/adminCreateUserMessages';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { FormErrorBanner } from '@/components/account/FormErrorBanner';
import { SectionHeader } from '@/components/ui/SectionHeader';

const FIELD_ORDER: AdminCreateUserField[] = [
  'email',
  'password',
  'firstName',
  'lastName',
  'companyName',
  'companyContactPerson',
];

export default function AdminCreateUserPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [saving, setSaving] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<AdminCreateUserFieldErrors>({});
  const [form, setForm] = useState({
    email: '',
    password: '',
    accountType: 'private' as AccountType,
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    phone: '',
    companyName: '',
    companyContactPerson: '',
    companyVat: '',
    companyUniqueNumber: '',
    addr1: '',
    addr2: '',
    city: '',
    postal: '',
    country: 'Italy',
  });

  const applyValidation = useCallback(
    (codes: ReturnType<typeof validateAdminCreateUserInput>) => {
      const { fieldErrors: next, summary: nextSummary } = adminCreateUserMessages(codes, t);
      setFieldErrors(next);
      setSummary(nextSummary || (codes.length ? t('form.errors.title') : null));
      if (codes.length > 0) {
        requestAnimationFrame(() => {
          for (const field of FIELD_ORDER) {
            if (next[field]) {
              const el = document.getElementById(`admin-create-${field}`);
              el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              if (el instanceof HTMLElement) el.focus();
              break;
            }
          }
        });
      }
      return codes.length === 0;
    },
    [t],
  );

  function patch<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((p) => ({ ...p, [k]: v }));
    const fieldKey = k as AdminCreateUserField;
    if (fieldErrors[fieldKey]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[fieldKey];
        return next;
      });
    }
  }

  function setAccountType(next: AccountType) {
    if (next === 'private') {
      setForm((p) => ({
        ...p,
        accountType: next,
        companyName: '',
        companyContactPerson: '',
        companyVat: '',
        companyUniqueNumber: '',
      }));
      setFieldErrors((prev) => {
        const nextErrors = { ...prev };
        delete nextErrors.companyName;
        delete nextErrors.companyContactPerson;
        return nextErrors;
      });
      return;
    }
    patch('accountType', next);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSummary(null);
    setFieldErrors({});

    const isCompany = form.accountType === 'company';
    const payload = {
      email: form.email.trim(),
      password: form.password,
      accountType: form.accountType,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      companyName: isCompany ? form.companyName.trim() : '',
      companyContactPerson: isCompany ? form.companyContactPerson.trim() : '',
    };

    const clientCodes = validateAdminCreateUserInput(payload);
    if (!applyValidation(clientCodes)) return;

    setSaving(true);
    try {
      const res = await adminFetch('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          ...payload,
          dateOfBirth: form.dateOfBirth,
          phone: form.phone,
          companyVat: isCompany ? form.companyVat.trim() : '',
          companyUniqueNumber: isCompany ? form.companyUniqueNumber.trim() : '',
          address: {
            line1: form.addr1,
            line2: form.addr2,
            city: form.city,
            postalCode: form.postal,
            country: form.country,
          },
        }),
      });
      const body = (await res.json()) as {
        uid?: string;
        error?: string;
        fields?: Record<string, string>;
      };

      if (!res.ok) {
        if (res.status === 503) {
          setSummary(t('admin.users.create.errorAdminSdk'));
          return;
        }
        if (res.status === 401 || res.status === 403) {
          setSummary(t('admin.users.create.errorAuth'));
          return;
        }
        if (res.status === 409) {
          setFieldErrors({ email: t('admin.users.create.errorEmailInUse') });
          setSummary(t('admin.users.create.errorEmailInUse'));
          document.getElementById('admin-create-email')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }
        if (body.error === 'validation_failed' && body.fields) {
          applyValidation(codesFromApiFields(body.fields));
          return;
        }
        setSummary(t('admin.users.create.errorGeneric'));
        return;
      }

      if (body.uid) router.push(`/admin/users/${body.uid}`);
      else router.push('/admin/users');
    } catch (err) {
      console.error('[admin create user]', err);
      setSummary(t('admin.users.create.errorNetwork'));
    } finally {
      setSaving(false);
    }
  }

  const showCompanyFields = form.accountType === 'company';

  return (
    <div className="mx-auto max-w-[900px] px-4 py-8 sm:px-6 lg:px-8">
      <Link href="/admin/users" className="text-sm text-gray-500 hover:text-gray-700">
        {t('admin.users.backToList')}
      </Link>
      <SectionHeader
        title={t('admin.users.create.title')}
        description={t('admin.users.create.subtitle')}
      />

      <Card className="mt-6" padding="md">
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4" noValidate>
          <FormErrorBanner show={Boolean(summary)} message={summary ?? undefined} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              id="admin-create-email"
              label={t('field.email')}
              name="email"
              type="email"
              autoComplete="off"
              value={form.email}
              onChange={(e) => patch('email', e.target.value)}
              error={fieldErrors.email}
            />
            <Input
              id="admin-create-password"
              label={t('admin.users.create.tempPassword')}
              name="password"
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => patch('password', e.target.value)}
              error={fieldErrors.password}
            />
            <Select
              label={t('account.section.accountType')}
              name="accountType"
              value={form.accountType}
              onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                setAccountType(e.target.value as AccountType)
              }
              options={[
                { value: 'private', label: t('account.accountType.private') },
                { value: 'company', label: t('account.accountType.company') },
              ]}
            />
            <Input
              label={t('field.phone')}
              name="phone"
              value={form.phone}
              onChange={(e) => patch('phone', e.target.value)}
            />
            <Input
              id="admin-create-firstName"
              label={t('field.firstName')}
              name="firstName"
              value={form.firstName}
              onChange={(e) => patch('firstName', e.target.value)}
              error={fieldErrors.firstName}
            />
            <Input
              id="admin-create-lastName"
              label={t('field.lastName')}
              name="lastName"
              value={form.lastName}
              onChange={(e) => patch('lastName', e.target.value)}
              error={fieldErrors.lastName}
            />
            <Input
              label={t('field.birthDate')}
              name="dob"
              type="date"
              value={form.dateOfBirth}
              onChange={(e) => patch('dateOfBirth', e.target.value)}
            />
            {showCompanyFields ? (
              <>
                <Input
                  id="admin-create-companyName"
                  label={t('field.companyName')}
                  name="companyName"
                  value={form.companyName}
                  onChange={(e) => patch('companyName', e.target.value)}
                  error={fieldErrors.companyName}
                />
                <Input
                  id="admin-create-companyContactPerson"
                  label={t('field.companyContactPerson')}
                  name="contact"
                  value={form.companyContactPerson}
                  onChange={(e) => patch('companyContactPerson', e.target.value)}
                  error={fieldErrors.companyContactPerson}
                />
                <Input
                  label={t('field.companyVat')}
                  name="vat"
                  value={form.companyVat}
                  onChange={(e) => patch('companyVat', e.target.value)}
                />
                <Input
                  label={t('field.companyUniqueNumber')}
                  name="uniq"
                  value={form.companyUniqueNumber}
                  onChange={(e) => patch('companyUniqueNumber', e.target.value)}
                />
              </>
            ) : null}
            <Input
              label={t('field.addressLine1')}
              name="addr1"
              value={form.addr1}
              onChange={(e) => patch('addr1', e.target.value)}
            />
            <Input
              label={t('field.addressLine2')}
              name="addr2"
              value={form.addr2}
              onChange={(e) => patch('addr2', e.target.value)}
            />
            <Input
              label={t('field.city')}
              name="city"
              value={form.city}
              onChange={(e) => patch('city', e.target.value)}
            />
            <Input
              label={t('field.postalCode')}
              name="postal"
              value={form.postal}
              onChange={(e) => patch('postal', e.target.value)}
            />
            <Input
              label={t('field.country')}
              name="country"
              value={form.country}
              onChange={(e) => patch('country', e.target.value)}
              className="sm:col-span-2"
            />
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button href="/admin/users" variant="secondary" className="w-full sm:w-auto">
              {t('common.cancel')}
            </Button>
            <Button type="submit" loading={saving} className="w-full sm:w-auto">
              {t('admin.users.create.submit')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
