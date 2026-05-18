'use client';

/**
 * Admin: cross-user verification queue.
 *
 * Three tabs (documents / certificates / insurances). Each row has the
 * three-state verify control (verified / pending / rejected). All three
 * collections carry a `verificationStatus` field of type
 * VerificationStatus, so the admin write is a single field update.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  listAllCertificates,
  updateCertificate,
} from '@/lib/firebase/certificates';
import {
  listAllDocuments,
  updateDocument,
} from '@/lib/firebase/documents';
import {
  listAllInsurances,
  updateInsurance,
} from '@/lib/firebase/insurances';
import { listAllAccounts } from '@/lib/firebase/account';
import type { UserAccount } from '@/lib/types/account';
import type { Certificate, DocumentRef, Insurance } from '@/lib/types/entities';
import { CERTIFICATE_KINDS } from '@/lib/types/entities';
import type { VerificationStatus } from '@/lib/types';
import { accountDisplayName } from '@/lib/utils/entities';
import { classNames, formatDate, formatDateTime } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { VerifyControls } from '@/components/admin/VerifyControls';

type Tab = 'documents' | 'certificates' | 'insurances';

export default function AdminVerifyPage() {
  const { t } = useLanguage();
  const [tab, setTab] = useState<Tab>('documents');
  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  const [documents, setDocuments] = useState<DocumentRef[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [insurances, setInsurances] = useState<Insurance[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const reload = async () => {
    const [a, d, c, i] = await Promise.all([
      listAllAccounts(),
      listAllDocuments(),
      listAllCertificates(),
      listAllInsurances(),
    ]);
    setAccounts(a);
    setDocuments(d);
    setCertificates(c);
    setInsurances(i);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await reload();
      } catch (err) {
        console.error('[admin verify] load failed', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const accountsByUid = new Map<string, UserAccount>();
  for (const a of accounts) accountsByUid.set(a.uid, a);

  async function setDocStatus(d: DocumentRef, s: VerificationStatus) {
    setBusyId(d.id);
    try {
      await updateDocument(d.id, { verificationStatus: s });
      setDocuments((prev) =>
        prev.map((x) => (x.id === d.id ? { ...x, verificationStatus: s } : x)),
      );
    } finally {
      setBusyId(null);
    }
  }
  async function setCertStatus(c: Certificate, s: VerificationStatus) {
    setBusyId(c.id);
    try {
      await updateCertificate(c.id, { verificationStatus: s });
      setCertificates((prev) =>
        prev.map((x) => (x.id === c.id ? { ...x, verificationStatus: s } : x)),
      );
    } finally {
      setBusyId(null);
    }
  }
  async function setInsStatus(i: Insurance, s: VerificationStatus) {
    setBusyId(i.id);
    try {
      await updateInsurance(i.id, { verificationStatus: s });
      setInsurances((prev) =>
        prev.map((x) => (x.id === i.id ? { ...x, verificationStatus: s } : x)),
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
      <SectionHeader title={t('admin.verify.title')} description={t('admin.verify.subtitle')} />

      <div className="mt-2 flex flex-wrap items-center gap-1 border-b border-gray-200">
        <TabButton active={tab === 'documents'} onClick={() => setTab('documents')}>
          {t('admin.verify.tab.documents')} ({documents.length})
        </TabButton>
        <TabButton active={tab === 'certificates'} onClick={() => setTab('certificates')}>
          {t('admin.verify.tab.certificates')} ({certificates.length})
        </TabButton>
        <TabButton active={tab === 'insurances'} onClick={() => setTab('insurances')}>
          {t('admin.verify.tab.insurances')} ({insurances.length})
        </TabButton>
      </div>

      {loading ? (
        <div className="mt-6 flex items-center gap-3 text-sm text-gray-500">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
          {t('common.loading')}
        </div>
      ) : tab === 'documents' ? (
        documents.length === 0 ? (
          <EmptyState title={t('admin.verify.empty')} description={t('admin.verify.emptyDesc')} />
        ) : (
          <ul className="mt-4 space-y-3">
            {documents.map((d) => {
              const owner = accountsByUid.get(d.userId);
              return (
                <li key={d.id}>
                  <Card padding="md">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900">{d.label || d.kind}</p>
                        <p className="mt-0.5 text-xs text-gray-500">
                          {owner ? (
                            <Link
                              href={`/admin/users/${owner.uid}`}
                              className="text-blue-600 underline-offset-2 hover:underline"
                            >
                              {accountDisplayName(owner)}
                            </Link>
                          ) : (
                            d.userId
                          )}
                          {' · '}
                          {d.fileName || '—'}
                          {d.updatedAt ? ` · ${formatDateTime(d.updatedAt)}` : null}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
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
                          onSet={(s) => setDocStatus(d, s)}
                        />
                      </div>
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>
        )
      ) : tab === 'certificates' ? (
        certificates.length === 0 ? (
          <EmptyState title={t('admin.verify.empty')} description={t('admin.verify.emptyDesc')} />
        ) : (
          <ul className="mt-4 space-y-3">
            {certificates.map((c) => {
              const owner = accountsByUid.get(c.userId);
              const kindLabel = t(
                CERTIFICATE_KINDS.find((k) => k.value === c.kind)?.labelKey ?? 'cert.kind.custom',
              );
              return (
                <li key={c.id}>
                  <Card padding="md">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900">{c.label || kindLabel}</p>
                        <p className="mt-0.5 text-xs text-gray-500">
                          {kindLabel}{' · '}
                          {owner ? (
                            <Link
                              href={`/admin/users/${owner.uid}`}
                              className="text-blue-600 underline-offset-2 hover:underline"
                            >
                              {accountDisplayName(owner)}
                            </Link>
                          ) : (
                            c.userId
                          )}
                          {c.expiresAt ? ` · ${t('field.expiresAt')}: ${formatDate(c.expiresAt)}` : null}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {c.fileUrl ? (
                          <a
                            href={c.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-medium text-blue-600 underline-offset-2 hover:underline"
                          >
                            {t('common.viewDocument')}
                          </a>
                        ) : null}
                        <VerifyControls
                          current={c.verificationStatus}
                          busy={busyId === c.id}
                          onSet={(s) => setCertStatus(c, s)}
                        />
                      </div>
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>
        )
      ) : (
        insurances.length === 0 ? (
          <EmptyState title={t('admin.verify.empty')} description={t('admin.verify.emptyDesc')} />
        ) : (
          <ul className="mt-4 space-y-3">
            {insurances.map((i) => {
              const owner = accountsByUid.get(i.userId);
              return (
                <li key={i.id}>
                  <Card padding="md">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900">{i.provider || '—'}</p>
                        <p className="mt-0.5 text-xs text-gray-500">
                          {i.policyNumber || '—'}
                          {' · '}
                          {owner ? (
                            <Link
                              href={`/admin/users/${owner.uid}`}
                              className="text-blue-600 underline-offset-2 hover:underline"
                            >
                              {accountDisplayName(owner)}
                            </Link>
                          ) : (
                            i.userId
                          )}
                          {i.expiryDate ? ` · ${t('profile.validUntil')} ${formatDate(i.expiryDate)}` : null}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
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
                          onSet={(s) => setInsStatus(i, s)}
                        />
                      </div>
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>
        )
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={classNames(
        '-mb-px shrink-0 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition',
        active
          ? 'border-amber-500 text-amber-700'
          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
      )}
    >
      {children}
    </button>
  );
}
