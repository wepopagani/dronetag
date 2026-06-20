'use client';

/**
 * Admin: per-user editor.
 *
 * Single dense page with sections:
 *   1. Account fields            — edit name, email, accountType, address,
 *                                  company info (admin can correct anything).
 *   2. Pilot identity            — edit the pilot doc.
 *   3. Slots & quotas            — direct slot count editor; calls setSlots.
 *   4. Operators / Drones /      — read-only listings with quick actions:
 *      Insurances / Certificates    verify/reject for the latter three;
 *      / Documents                   edit-link for drones and operators.
 */

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getAccount, updateAccount } from '@/lib/firebase/account';
import { getPilot, updatePilot } from '@/lib/firebase/pilots';
import { listOperators } from '@/lib/firebase/operators';
import { listDronesByUser, clearActiveOperator } from '@/lib/firebase/drones';
import { listInsurances, updateInsurance } from '@/lib/firebase/insurances';
import { listCertificates, updateCertificate } from '@/lib/firebase/certificates';
import { listDocuments, updateDocument } from '@/lib/firebase/documents';
import { requestPublicDroneResync } from '@/lib/client/resyncPublicDrones';
import { ensureSlots, setSlots } from '@/lib/firebase/slots';
import type { AccountType, UserAccount } from '@/lib/types/account';
import type {
  Certificate,
  DocumentRef,
  Drone,
  Insurance,
  Operator,
  Pilot,
  Slots,
} from '@/lib/types/entities';
import type { VerificationStatus } from '@/lib/types';
import {
  accountDisplayName,
  isActiveOperatorOverride,
  operatorDisplayName,
} from '@/lib/utils/entities';
import { formatDate, formatDateTime, getPublicProfileUrl } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { FormErrorBanner } from '@/components/account/FormErrorBanner';
import { VerifyControls } from '@/components/admin/VerifyControls';

type AccountForm = Pick<
  UserAccount,
  | 'accountType'
  | 'firstName'
  | 'lastName'
  | 'dateOfBirth'
  | 'email'
  | 'phone'
  | 'companyName'
  | 'companyContactPerson'
  | 'companyVat'
  | 'companyUniqueNumber'
> & { addr1: string; addr2: string; city: string; postal: string; country: string };

type PilotForm = Pick<
  Pilot,
  | 'firstName'
  | 'lastName'
  | 'dateOfBirth'
  | 'nationality'
  | 'email'
  | 'phone'
  | 'operatorCode'
  | 'operatorLicense'
  | 'emergencyContact'
>;

type SlotKey = 'certificate' | 'drone' | 'operator' | 'pdf' | 'nfc_badge' | 'personalization';
type SlotForm = Record<SlotKey, number>;

const SLOT_KEYS: SlotKey[] = ['drone', 'operator', 'certificate', 'pdf', 'nfc_badge', 'personalization'];

export default function AdminUserDetailPage() {
  const params = useParams<{ uid: string | string[] }>();
  const uid =
    typeof params?.uid === 'string'
      ? params.uid
      : Array.isArray(params?.uid)
      ? params.uid[0] ?? ''
      : '';
  const { t } = useLanguage();

  const [account, setAccount] = useState<UserAccount | null>(null);
  const [pilot, setPilot] = useState<Pilot | null>(null);
  const [slots, setSlotsState] = useState<Slots | null>(null);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [drones, setDrones] = useState<Drone[]>([]);
  const [insurances, setInsurances] = useState<Insurance[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [documents, setDocuments] = useState<DocumentRef[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!uid) return;
    const [a, p, s, opList, dList, iList, cList, docList] = await Promise.all([
      getAccount(uid),
      getPilot(uid),
      ensureSlots(uid),
      listOperators(uid),
      listDronesByUser(uid),
      listInsurances(uid),
      listCertificates(uid),
      listDocuments(uid),
    ]);
    setAccount(a);
    setPilot(p);
    setSlotsState(s);
    setOperators(opList);
    setDrones(dList);
    setInsurances(iList);
    setCertificates(cList);
    setDocuments(docList);
    await requestPublicDroneResync(uid);
  }, [uid]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await reload();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reload]);

  if (loading) {
    return (
      <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
          {t('common.loading')}
        </div>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/admin/users" className="text-sm text-gray-500 hover:text-gray-700">
          {t('admin.users.backToList')}
        </Link>
        <p className="mt-4 text-sm text-gray-500">{t('profile.notFound')}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <div>
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5" aria-hidden>
            <path
              fillRule="evenodd"
              d="M9.78 4.22a.75.75 0 010 1.06L7.06 8h7.69a.75.75 0 010 1.5H7.06l2.72 2.72a.75.75 0 11-1.06 1.06l-4-4a.75.75 0 010-1.06l4-4a.75.75 0 011.06 0z"
              clipRule="evenodd"
            />
          </svg>
          {t('admin.users.backToList')}
        </Link>
        <h2 className="mt-2 text-xl font-semibold text-gray-900">{accountDisplayName(account)}</h2>
        <p className="mt-1 font-mono text-xs text-gray-500">{uid}</p>
      </div>

      <Card padding="md" className="border-sky-100 bg-sky-50/50">
        <h3 className="text-sm font-semibold text-sky-900">{t('admin.users.loginHint.title')}</h3>
        <p className="mt-1.5 text-sm text-sky-900/90">{t('admin.users.loginHint.body')}</p>
        <p className="mt-2 font-mono text-xs text-sky-800">
          /login · {account.email || '—'}
        </p>
      </Card>

      <div id="pagina-pubblica" className="scroll-mt-24">
      <Card padding="md" className="border-gray-200 bg-gray-50/60">
        <h3 className="text-sm font-semibold text-gray-900">{t('admin.users.publicHint.title')}</h3>
        <p className="mt-1.5 text-sm text-gray-600">{t('admin.users.publicHint.body')}</p>
        {drones.some((d) => d.visibility === 'public' && d.slug.trim()) ? (
          <ul className="mt-3 space-y-2">
            {drones
              .filter((d) => d.visibility === 'public' && d.slug.trim())
              .map((d) => (
                <li key={d.id} className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-medium text-gray-800">
                    {[d.manufacturer, d.model].filter(Boolean).join(' ').trim() || d.slug}
                  </span>
                  <a
                    href={getPublicProfileUrl(d.slug)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-md border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-800 transition hover:bg-sky-100"
                  >
                    {t('dashboard.viewPublicProfile')}
                  </a>
                </li>
              ))}
          </ul>
        ) : (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span
              title={t('admin.users.publicProfileUnavailable')}
              className="cursor-not-allowed rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-400"
            >
              {t('dashboard.viewPublicProfile')}
            </span>
            <p className="text-sm text-amber-800">{t('admin.users.publicHint.none')}</p>
          </div>
        )}
      </Card>
      </div>

      <AccountSection account={account} onSaved={reload} />
      {pilot ? <PilotSection pilot={pilot} onSaved={reload} /> : null}
      {slots ? <SlotsSection uid={uid} slots={slots} usage={{
        operator: operators.length,
        drone: drones.length,
        certificate: certificates.length,
        pdf: documents.length,
        nfc_badge: 0,
        personalization: 0,
      }} onSaved={reload} /> : null}

      <OperatorsSection operators={operators} drones={drones} />

      <DronesSection drones={drones} operators={operators} onChanged={reload} />

      <InsurancesSection insurances={insurances} drones={drones} onChanged={reload} />

      <CertificatesSection certificates={certificates} onChanged={reload} />

      <DocumentsSection documents={documents} onChanged={reload} />
    </div>
  );
}

// ─── Account form ─────────────────────────────────────────────────────────

function AccountSection({
  account,
  onSaved,
}: {
  account: UserAccount;
  onSaved: () => Promise<void> | void;
}) {
  const { t } = useLanguage();
  const [form, setForm] = useState<AccountForm>(() => ({
    accountType: account.accountType,
    firstName: account.firstName,
    lastName: account.lastName,
    dateOfBirth: account.dateOfBirth,
    email: account.email,
    phone: account.phone,
    companyName: account.companyName,
    companyContactPerson: account.companyContactPerson,
    companyVat: account.companyVat,
    companyUniqueNumber: account.companyUniqueNumber,
    addr1: account.address.line1,
    addr2: account.address.line2,
    city: account.address.city,
    postal: account.address.postalCode,
    country: account.address.country,
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof AccountForm>(k: K, v: AccountForm[K]) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await updateAccount(account.uid, {
        accountType: form.accountType,
        firstName: form.firstName,
        lastName: form.lastName,
        dateOfBirth: form.dateOfBirth,
        email: form.email,
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
      });
      await onSaved();
    } catch (err) {
      console.error('[admin user account] save failed', err);
      setError(t('account.saveError'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card padding="md">
      <h3 className="mb-4 text-base font-semibold text-gray-900">
        {t('admin.users.detail.account')}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <FormErrorBanner show={Boolean(error)} message={error ?? undefined} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label={t('account.section.accountType')}
            name="accountType"
            value={form.accountType}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => set('accountType', e.target.value as AccountType)}
            options={[
              { value: 'private', label: t('account.accountType.private') },
              { value: 'company', label: t('account.accountType.company') },
            ]}
          />
          <Input label={t('field.email')} name="email" type="email"
            value={form.email} onChange={(e) => set('email', e.target.value)} />
          <Input label={t('field.firstName')} name="firstName"
            value={form.firstName} onChange={(e) => set('firstName', e.target.value)} />
          <Input label={t('field.lastName')} name="lastName"
            value={form.lastName} onChange={(e) => set('lastName', e.target.value)} />
          <Input label={t('field.birthDate')} name="dob" type="date"
            value={form.dateOfBirth} onChange={(e) => set('dateOfBirth', e.target.value)} />
          <Input label={t('field.phone')} name="phone"
            value={form.phone} onChange={(e) => set('phone', e.target.value)} />
          <Input label={t('field.companyName')} name="companyName"
            value={form.companyName} onChange={(e) => set('companyName', e.target.value)} />
          <Input label={t('field.companyContactPerson')} name="contact"
            value={form.companyContactPerson} onChange={(e) => set('companyContactPerson', e.target.value)} />
          <Input label={t('field.companyVat')} name="vat"
            value={form.companyVat} onChange={(e) => set('companyVat', e.target.value)} />
          <Input label={t('field.companyUniqueNumber')} name="uniq"
            value={form.companyUniqueNumber} onChange={(e) => set('companyUniqueNumber', e.target.value)} />
          <Input label={t('field.addressLine1')} name="addr1"
            value={form.addr1} onChange={(e) => set('addr1', e.target.value)} />
          <Input label={t('field.addressLine2')} name="addr2"
            value={form.addr2} onChange={(e) => set('addr2', e.target.value)} />
          <Input label={t('field.city')} name="city"
            value={form.city} onChange={(e) => set('city', e.target.value)} />
          <Input label={t('field.postalCode')} name="postal"
            value={form.postal} onChange={(e) => set('postal', e.target.value)} />
          <Input label={t('field.country')} name="country"
            value={form.country} onChange={(e) => set('country', e.target.value)}
            className="sm:col-span-2" />
        </div>
        <div className="flex justify-end">
          <Button type="submit" loading={saving}>{t('common.save')}</Button>
        </div>
      </form>
    </Card>
  );
}

// ─── Pilot form ───────────────────────────────────────────────────────────

function PilotSection({
  pilot,
  onSaved,
}: {
  pilot: Pilot;
  onSaved: () => Promise<void> | void;
}) {
  const { t } = useLanguage();
  const [form, setForm] = useState<PilotForm>(() => ({
    firstName: pilot.firstName,
    lastName: pilot.lastName,
    dateOfBirth: pilot.dateOfBirth,
    nationality: pilot.nationality,
    email: pilot.email,
    phone: pilot.phone,
    operatorCode: pilot.operatorCode,
    operatorLicense: pilot.operatorLicense,
    emergencyContact: pilot.emergencyContact,
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof PilotForm>(k: K, v: PilotForm[K]) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await updatePilot(pilot.userId, form);
      await onSaved();
    } catch (err) {
      console.error('[admin user pilot] save failed', err);
      setError(t('account.saveError'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card padding="md">
      <h3 className="mb-4 text-base font-semibold text-gray-900">
        {t('admin.users.detail.pilot')}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <FormErrorBanner show={Boolean(error)} message={error ?? undefined} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label={t('field.firstName')} name="pFirst"
            value={form.firstName} onChange={(e) => set('firstName', e.target.value)} />
          <Input label={t('field.lastName')} name="pLast"
            value={form.lastName} onChange={(e) => set('lastName', e.target.value)} />
          <Input label={t('field.birthDate')} name="pDob" type="date"
            value={form.dateOfBirth} onChange={(e) => set('dateOfBirth', e.target.value)} />
          <Input label={t('field.nationality')} name="pNat"
            value={form.nationality} onChange={(e) => set('nationality', e.target.value)} />
          <Input label={t('field.email')} name="pEmail" type="email"
            value={form.email} onChange={(e) => set('email', e.target.value)} />
          <Input label={t('field.phone')} name="pPhone"
            value={form.phone} onChange={(e) => set('phone', e.target.value)} />
          <Input label={t('field.operatorCode')} name="pOpCode"
            value={form.operatorCode} onChange={(e) => set('operatorCode', e.target.value)} />
          <Input label={t('field.operatorLicense')} name="pOpLic"
            value={form.operatorLicense} onChange={(e) => set('operatorLicense', e.target.value)} />
          <Input label={t('field.emergencyContact')} name="pEmer"
            value={form.emergencyContact} onChange={(e) => set('emergencyContact', e.target.value)}
            className="sm:col-span-2" />
        </div>
        <div className="flex justify-end">
          <Button type="submit" loading={saving}>{t('common.save')}</Button>
        </div>
      </form>
    </Card>
  );
}

// ─── Slots editor ─────────────────────────────────────────────────────────

function SlotsSection({
  uid,
  slots,
  usage,
  onSaved,
}: {
  uid: string;
  slots: Slots;
  usage: SlotForm;
  onSaved: () => Promise<void> | void;
}) {
  const { t } = useLanguage();
  const [form, setForm] = useState<SlotForm>(() => ({
    drone: slots.drone,
    operator: slots.operator,
    certificate: slots.certificate,
    pdf: slots.pdf,
    nfc_badge: slots.nfc_badge,
    personalization: slots.personalization,
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setVal(k: SlotKey, raw: string) {
    const n = Math.max(0, Math.min(999, parseInt(raw, 10) || 0));
    setForm((p) => ({ ...p, [k]: n }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await setSlots(uid, form);
      await onSaved();
    } catch (err) {
      console.error('[admin slots] save failed', err);
      setError(t('account.saveError'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card padding="md">
      <h3 className="text-base font-semibold text-gray-900">{t('admin.slots.title')}</h3>
      <p className="mt-1 text-sm text-gray-500">{t('admin.slots.subtitle')}</p>
      <form onSubmit={handleSubmit} className="mt-4 space-y-4" noValidate>
        <FormErrorBanner show={Boolean(error)} message={error ?? undefined} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SLOT_KEYS.map((k) => (
            <div key={k}>
              <Input
                label={t(`admin.slots.kind.${k}`)}
                name={`slot-${k}`}
                type="number"
                value={String(form[k])}
                onChange={(e) => setVal(k, e.target.value)}
              />
              <p className="mt-1 text-xs text-gray-500">
                {t('admin.slots.usage', { used: usage[k] })}
              </p>
            </div>
          ))}
        </div>
        <div className="flex justify-end">
          <Button type="submit" loading={saving}>{t('admin.slots.save')}</Button>
        </div>
      </form>
    </Card>
  );
}

// ─── Operators / Drones / Insurances / Certificates / Documents ──────────

function OperatorsSection({ operators, drones }: { operators: Operator[]; drones: Drone[] }) {
  const { t } = useLanguage();
  return (
    <Card padding="md">
      <h3 className="mb-3 text-base font-semibold text-gray-900">
        {t('admin.users.detail.operators')} ({operators.length})
      </h3>
      {operators.length === 0 ? (
        <p className="text-sm text-gray-500">—</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {operators.map((op) => {
            const usage = drones.filter((d) => d.defaultOperatorId === op.id || d.activeOperatorId === op.id).length;
            return (
              <li key={op.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                <div>
                  <span className="font-medium text-gray-900">{operatorDisplayName(op)}</span>
                  <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gray-700">
                    {t(`operator.kind.${op.kind}`)}
                  </span>
                  {op.isDefault ? (
                    <span className="ml-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-blue-700 ring-1 ring-inset ring-blue-600/20">
                      {t('operator.field.isDefault')}
                    </span>
                  ) : null}
                </div>
                <span className="text-xs text-gray-500">{usage} drone(s)</span>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

function DronesSection({
  drones,
  operators,
  onChanged,
}: {
  drones: Drone[];
  operators: Operator[];
  onChanged: () => Promise<void> | void;
}) {
  const { t } = useLanguage();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleClear(id: string) {
    setBusyId(id);
    try {
      await clearActiveOperator(id);
      await onChanged();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Card padding="md">
      <h3 className="mb-3 text-base font-semibold text-gray-900">
        {t('admin.users.detail.drones')} ({drones.length})
      </h3>
      {drones.length === 0 ? (
        <p className="text-sm text-gray-500">—</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {drones.map((d) => {
            const overrideActive = isActiveOperatorOverride(d);
            const op = operators.find((x) => x.id === d.defaultOperatorId);
            return (
              <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                <div className="min-w-0">
                  <Link
                    href={`/admin/drones/${d.id}`}
                    className="font-medium text-gray-900 hover:underline"
                  >
                    {[d.manufacturer, d.model].filter(Boolean).join(' ').trim() || d.slug}
                  </Link>
                  <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gray-700">
                    {d.classMarking}
                  </span>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {t('drone.field.defaultOperator')}: {op ? operatorDisplayName(op) : '—'}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {overrideActive ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      loading={busyId === d.id}
                      onClick={() => handleClear(d.id)}
                    >
                      {t('admin.drones.clearOverride')}
                    </Button>
                  ) : null}
                  {d.visibility === 'public' && d.slug.trim() ? (
                    <a
                      href={getPublicProfileUrl(d.slug)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-md border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-800 transition hover:bg-sky-100"
                    >
                      {t('dashboard.viewPublicProfile')}
                    </a>
                  ) : null}
                  <Button href={`/admin/drones/${d.id}`} variant="secondary" size="sm">
                    {t('common.edit')}
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

function InsurancesSection({
  insurances,
  drones,
  onChanged,
}: {
  insurances: Insurance[];
  drones: Drone[];
  onChanged: () => Promise<void> | void;
}) {
  const { t } = useLanguage();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function verify(ins: Insurance, next: VerificationStatus) {
    setBusyId(ins.id);
    try {
      await updateInsurance(ins.id, { verificationStatus: next });
      await onChanged();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Card padding="md">
      <h3 className="mb-3 text-base font-semibold text-gray-900">
        {t('admin.users.detail.insurances')} ({insurances.length})
      </h3>
      {insurances.length === 0 ? (
        <p className="text-sm text-gray-500">—</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {insurances.map((i) => {
            const drone = drones.find((d) => d.id === i.droneId);
            return (
              <li key={i.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                <div>
                  <span className="font-medium text-gray-900">{i.provider || '—'}</span>
                  <span className="ml-2 font-mono text-xs text-gray-600">{i.policyNumber || '—'}</span>
                  <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gray-700">
                    {t(`verification.${i.verificationStatus}`)}
                  </span>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {i.expiryDate ? `${t('profile.validUntil')} ${formatDate(i.expiryDate)}` : '—'}
                    {drone ? ` · ${drone.slug}` : null}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {i.pdfUrl ? (
                    <a
                      href={i.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium text-blue-600 underline-offset-2 hover:underline"
                    >
                      {t('common.viewDocument')}
                    </a>
                  ) : null}
                  <VerifyControls
                    current={i.verificationStatus}
                    busy={busyId === i.id}
                    onSet={(s) => verify(i, s)}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

function CertificatesSection({
  certificates,
  onChanged,
}: {
  certificates: Certificate[];
  onChanged: () => Promise<void> | void;
}) {
  const { t } = useLanguage();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function verify(c: Certificate, next: VerificationStatus) {
    setBusyId(c.id);
    try {
      await updateCertificate(c.id, { verificationStatus: next });
      await onChanged();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Card padding="md">
      <h3 className="mb-3 text-base font-semibold text-gray-900">
        {t('admin.users.detail.certificates')} ({certificates.length})
      </h3>
      {certificates.length === 0 ? (
        <p className="text-sm text-gray-500">—</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {certificates.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
              <div>
                <span className="font-medium text-gray-900">
                  {c.registrationNumber || c.kind}
                </span>
                <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gray-700">
                  {t(`verification.${c.verificationStatus}`)}
                </span>
                <p className="mt-0.5 text-xs text-gray-500">
                  {c.issuedBy ? `${c.issuedBy} · ` : null}
                  {c.expiresAt ? formatDate(c.expiresAt) : '—'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <VerifyControls
                  current={c.verificationStatus}
                  busy={busyId === c.id}
                  onSet={(s) => verify(c, s)}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function DocumentsSection({
  documents,
  onChanged,
}: {
  documents: DocumentRef[];
  onChanged: () => Promise<void> | void;
}) {
  const { t } = useLanguage();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function verify(d: DocumentRef, next: VerificationStatus) {
    setBusyId(d.id);
    try {
      await updateDocument(d.id, { verificationStatus: next });
      await onChanged();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Card padding="md">
      <h3 className="mb-3 text-base font-semibold text-gray-900">
        {t('admin.users.detail.documents')} ({documents.length})
      </h3>
      {documents.length === 0 ? (
        <p className="text-sm text-gray-500">—</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {documents.map((d) => (
            <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
              <div>
                <span className="font-medium text-gray-900">{d.label || d.kind}</span>
                <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gray-700">
                  {t(`verification.${d.verificationStatus}`)}
                </span>
                <p className="mt-0.5 text-xs text-gray-500">
                  {d.fileName || '—'}
                  {d.updatedAt ? ` · ${formatDateTime(d.updatedAt)}` : null}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {d.fileUrl ? (
                  <a
                    href={d.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-blue-600 underline-offset-2 hover:underline"
                  >
                    {t('common.viewDocument')}
                  </a>
                ) : null}
                <VerifyControls
                  current={d.verificationStatus}
                  busy={busyId === d.id}
                  onSet={(s) => verify(d, s)}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

