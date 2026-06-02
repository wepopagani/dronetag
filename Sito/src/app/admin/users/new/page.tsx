'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import type { AccountType } from '@/lib/types/account';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { FormErrorBanner } from '@/components/account/FormErrorBanner';
import { SectionHeader } from '@/components/ui/SectionHeader';

export default function AdminCreateUserPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          accountType: form.accountType,
          firstName: form.firstName,
          lastName: form.lastName,
          dateOfBirth: form.dateOfBirth,
          phone: form.phone,
          companyName: form.companyName,
          companyContactPerson: form.companyContactPerson,
          companyVat: form.companyVat,
          companyUniqueNumber: form.companyUniqueNumber,
          address: {
            line1: form.addr1,
            line2: form.addr2,
            city: form.city,
            postalCode: form.postal,
            country: form.country,
          },
        }),
      });
      const body = (await res.json()) as { uid?: string; error?: string };
      if (!res.ok) {
        if (res.status === 409) setError(t('admin.users.create.errorEmailInUse'));
        else if (body.error === 'password too short') setError(t('signup.errorPasswordShort'));
        else setError(t('admin.users.create.errorGeneric'));
        return;
      }
      if (body.uid) router.push(`/admin/users/${body.uid}`);
      else router.push('/admin/users');
    } catch (err) {
      console.error('[admin create user]', err);
      setError(t('admin.users.create.errorGeneric'));
    } finally {
      setSaving(false);
    }
  }

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
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <FormErrorBanner show={Boolean(error)} message={error ?? undefined} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label={t('field.email')}
              name="email"
              type="email"
              required
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
            />
            <Input
              label={t('admin.users.create.tempPassword')}
              name="password"
              type="password"
              required
              value={form.password}
              onChange={(e) => set('password', e.target.value)}
            />
            <Select
              label={t('account.section.accountType')}
              name="accountType"
              value={form.accountType}
              onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                set('accountType', e.target.value as AccountType)
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
              onChange={(e) => set('phone', e.target.value)}
            />
            <Input
              label={t('field.firstName')}
              name="firstName"
              required
              value={form.firstName}
              onChange={(e) => set('firstName', e.target.value)}
            />
            <Input
              label={t('field.lastName')}
              name="lastName"
              required
              value={form.lastName}
              onChange={(e) => set('lastName', e.target.value)}
            />
            <Input
              label={t('field.birthDate')}
              name="dob"
              type="date"
              value={form.dateOfBirth}
              onChange={(e) => set('dateOfBirth', e.target.value)}
            />
            <Input
              label={t('field.companyName')}
              name="companyName"
              value={form.companyName}
              onChange={(e) => set('companyName', e.target.value)}
            />
            <Input
              label={t('field.companyContactPerson')}
              name="contact"
              value={form.companyContactPerson}
              onChange={(e) => set('companyContactPerson', e.target.value)}
            />
            <Input
              label={t('field.companyVat')}
              name="vat"
              value={form.companyVat}
              onChange={(e) => set('companyVat', e.target.value)}
            />
            <Input
              label={t('field.companyUniqueNumber')}
              name="uniq"
              value={form.companyUniqueNumber}
              onChange={(e) => set('companyUniqueNumber', e.target.value)}
            />
            <Input
              label={t('field.addressLine1')}
              name="addr1"
              value={form.addr1}
              onChange={(e) => set('addr1', e.target.value)}
            />
            <Input
              label={t('field.addressLine2')}
              name="addr2"
              value={form.addr2}
              onChange={(e) => set('addr2', e.target.value)}
            />
            <Input
              label={t('field.city')}
              name="city"
              value={form.city}
              onChange={(e) => set('city', e.target.value)}
            />
            <Input
              label={t('field.postalCode')}
              name="postal"
              value={form.postal}
              onChange={(e) => set('postal', e.target.value)}
            />
            <Input
              label={t('field.country')}
              name="country"
              value={form.country}
              onChange={(e) => set('country', e.target.value)}
              className="sm:col-span-2"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button href="/admin/users" variant="secondary">
              {t('common.cancel')}
            </Button>
            <Button type="submit" loading={saving}>
              {t('admin.users.create.submit')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
