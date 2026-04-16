'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { ensureAccount } from '@/lib/firebase/account';
import type { UserAccount } from '@/lib/types/account';
import { Card } from '@/components/ui/Card';

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
        if (!cancelled) setAccount(a);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (loading) {
    return (
      <div className="mt-8 flex items-center gap-3 text-sm text-gray-500">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
        {t('common.loading')}
      </div>
    );
  }

  if (!account) return null;

  const fullName = [account.firstName, account.lastName].filter(Boolean).join(' ') || '—';
  const addressLines = [
    account.address.line1,
    account.address.line2,
    [account.address.postalCode, account.address.city].filter(Boolean).join(' '),
    account.address.country,
  ].filter(Boolean);

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-900 text-2xl font-bold text-white">
            {(account.firstName?.[0] ?? account.email[0] ?? '?').toUpperCase()}
            {(account.lastName?.[0] ?? '').toUpperCase()}
          </div>
          <p className="mt-4 text-base font-semibold text-gray-900">{fullName}</p>
          <p className="mt-0.5 text-sm text-gray-500">{account.email}</p>
          <p className="mt-3 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
            {t('account.memberSince', {
              date: account.createdAt ? formatDate(account.createdAt) : '—',
            })}
          </p>
        </div>
      </Card>

      <Card className="lg:col-span-2" padding="md">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">
            {t('account.personalInfo')}
          </h2>
          <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-700">
            {t('account.readOnly')}
          </span>
        </div>
        <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
          <ReadOnlyField label={t('field.firstName')} value={account.firstName} />
          <ReadOnlyField label={t('field.lastName')} value={account.lastName} />
          <ReadOnlyField label={t('field.email')} value={account.email} />
          <ReadOnlyField label={t('field.phone')} value={account.phone} />
        </dl>

        <div className="mt-6 border-t border-gray-100 pt-5">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">
            {t('account.shippingAddress')}
          </h3>
          {addressLines.length > 0 ? (
            <address className="not-italic text-sm leading-relaxed text-gray-600">
              {addressLines.map((line, idx) => (
                <div key={idx}>{line}</div>
              ))}
            </address>
          ) : (
            <p className="text-sm text-gray-400">{t('account.noAddress')}</p>
          )}
        </div>

        <p className="mt-6 rounded-lg bg-gray-50 px-4 py-3 text-xs leading-relaxed text-gray-500">
          {t('account.editNotice')}
        </p>
      </Card>
    </div>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wider text-gray-400">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-gray-900">{value || '—'}</dd>
    </div>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso.slice(0, 10);
  }
}
