'use client';

import { useCallback, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getPublicProfileUrl } from '@/lib/utils';
import { QRPreview } from '@/components/ui/QRPreview';
import { UploadField } from '@/components/ui/UploadField';

// ─── Icons (inline SVGs to avoid external deps) ─────────────────────────────

function LinkIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path d="M12.232 4.232a2.5 2.5 0 013.536 3.536l-1.225 1.224a.75.75 0 001.061 1.06l1.224-1.224a4 4 0 00-5.656-5.656l-3 3a4 4 0 00.225 5.865.75.75 0 00.977-1.138 2.5 2.5 0 01-.142-3.667l3-3z" />
      <path d="M11.603 7.963a.75.75 0 00-.977 1.138 2.5 2.5 0 01.142 3.667l-3 3a2.5 2.5 0 01-3.536-3.536l1.225-1.224a.75.75 0 00-1.061-1.06l-1.224 1.224a4 4 0 105.656 5.656l3-3a4 4 0 00-.225-5.865z" />
    </svg>
  );
}

function QrIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M3.75 2A1.75 1.75 0 002 3.75v3.5C2 8.216 2.784 9 3.75 9h3.5C8.216 9 9 8.216 9 7.25v-3.5C9 2.784 8.216 2 7.25 2h-3.5zM3.5 3.75a.25.25 0 01.25-.25h3.5a.25.25 0 01.25.25v3.5a.25.25 0 01-.25.25h-3.5a.25.25 0 01-.25-.25v-3.5zM3.75 11A1.75 1.75 0 002 12.75v3.5c0 .966.784 1.75 1.75 1.75h3.5C8.216 18 9 17.216 9 16.25v-3.5C9 11.784 8.216 11 7.25 11h-3.5zm-.25 1.75a.25.25 0 01.25-.25h3.5a.25.25 0 01.25.25v3.5a.25.25 0 01-.25.25h-3.5a.25.25 0 01-.25-.25v-3.5zM12.75 2A1.75 1.75 0 0011 3.75v3.5c0 .966.784 1.75 1.75 1.75h3.5C16.216 9 17 8.216 17 7.25v-3.5C17 2.784 16.216 2 15.25 2h-3.5zm-.25 1.75a.25.25 0 01.25-.25h3.5a.25.25 0 01.25.25v3.5a.25.25 0 01-.25.25h-3.5a.25.25 0 01-.25-.25v-3.5z" clipRule="evenodd" />
      <path d="M11 13a1 1 0 011-1h1a1 1 0 110 2h-1a1 1 0 01-1-1zm4 0a1 1 0 011-1h1a1 1 0 110 2h-1a1 1 0 01-1-1zm-4 4a1 1 0 011-1h1a1 1 0 110 2h-1a1 1 0 01-1-1zm4 0a1 1 0 011-1h1a1 1 0 110 2h-1a1 1 0 01-1-1z" />
    </svg>
  );
}

function NfcIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M4.25 2A2.25 2.25 0 002 4.25v11.5A2.25 2.25 0 004.25 18h11.5A2.25 2.25 0 0018 15.75V4.25A2.25 2.25 0 0015.75 2H4.25zM6 13.25V6.75a.75.75 0 00-1.5 0v6.5a.75.75 0 001.5 0zM10 10a2 2 0 11-4 0 2 2 0 014 0zm1.5 3.25V6.75a.75.75 0 00-1.5 0v6.5a.75.75 0 001.5 0zm4 0V6.75a.75.75 0 00-1.5 0v6.5a.75.75 0 001.5 0z" clipRule="evenodd" />
    </svg>
  );
}

// ─── Sub-section ─────────────────────────────────────────────────────────────

function LinkSection({ icon, title, children }: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-center gap-2">
        {icon}
        <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
      </div>
      {children}
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export interface VerificationLinksPanelProps {
  slug: string;
  visibility: string;
  qrCodeUrl: string;
  qrPreviewUrl: string;
  nfcReference: string;
  onQrUpload: (file: File) => void;
}

export function VerificationLinksPanel({
  slug,
  visibility,
  qrCodeUrl,
  qrPreviewUrl,
  nfcReference,
  onQrUpload,
}: VerificationLinksPanelProps) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  const isPublic = visibility === 'public' && slug.trim().length > 0;
  const publicUrl = getPublicProfileUrl(slug);

  const handleCopy = useCallback(() => {
    if (!publicUrl) return;
    void navigator.clipboard.writeText(publicUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [publicUrl]);

  const qrDisplay = qrPreviewUrl || qrCodeUrl || '';

  return (
    <div className="space-y-4">

      {/* ── Public Page URL ────────────────────────────────────────── */}
      <LinkSection
        icon={<LinkIcon className="h-4.5 w-4.5 text-blue-600" />}
        title={t('links.publicUrlTitle')}
      >
        <p className="mb-3 text-xs leading-relaxed text-gray-500">
          {t('links.publicUrlDesc')}
        </p>

        {isPublic ? (
          <div className="flex items-stretch gap-2">
            <div className="flex min-w-0 flex-1 items-center rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
              <code className="truncate text-xs font-medium text-gray-700">{publicUrl}</code>
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 active:bg-gray-100"
            >
              {copied ? (
                <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5 text-emerald-500">
                  <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 01.208 1.04l-5 7.5a.75.75 0 01-1.154.114l-3-3a.75.75 0 011.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 011.04-.207z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5 text-gray-400">
                  <path d="M10.5 3a.75.75 0 01.75.75v1h1a.75.75 0 010 1.5h-1v1a.75.75 0 01-1.5 0v-1h-1a.75.75 0 010-1.5h1v-1A.75.75 0 0110.5 3z" />
                  <path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 003 3.5v9A1.5 1.5 0 004.5 14h7a1.5 1.5 0 001.5-1.5v-7A1.5 1.5 0 0011.5 4H9V3.5A1.5 1.5 0 007.5 2h-3zM9 5.5h2.5a.5.5 0 01.5.5v6.5a.5.5 0 01-.5.5h-7a.5.5 0 01-.5-.5v-9a.5.5 0 01.5-.5h3a.5.5 0 01.5.5V5a.5.5 0 00.5.5z" clipRule="evenodd" />
                </svg>
              )}
              {copied ? t('links.copied') : t('links.copyUrl')}
            </button>
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 px-3 py-3">
            <p className="text-xs text-gray-400">{t('links.publicUrlNotReady')}</p>
          </div>
        )}
      </LinkSection>

      {/* ── QR Code ────────────────────────────────────────────────── */}
      <LinkSection
        icon={<QrIcon className="h-4.5 w-4.5 text-indigo-600" />}
        title={t('links.qrTitle')}
      >
        <p className="mb-3 text-xs leading-relaxed text-gray-500">
          {t('links.qrDesc')}
        </p>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="flex-1">
            <UploadField
              label={t('field.qrImage')}
              accept="image/*"
              currentUrl={qrDisplay}
              onUpload={onQrUpload}
              preview={false}
            />
            <p className="mt-1 text-[11px] text-gray-400">{t('form.qrHint')}</p>
          </div>
          <div className="flex shrink-0 justify-center">
            <QRPreview url={qrDisplay} size={140} />
          </div>
        </div>
      </LinkSection>

      {/* ── NFC Reference ──────────────────────────────────────────── */}
      <LinkSection
        icon={<NfcIcon className="h-4.5 w-4.5 text-gray-400" />}
        title={t('links.nfcTitle')}
      >
        <p className="mb-3 text-xs leading-relaxed text-gray-500">
          {t('links.nfcDesc')}
        </p>

        <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2.5">
          {nfcReference ? (
            <code className="text-xs font-medium text-gray-700">{nfcReference}</code>
          ) : (
            <span className="text-xs text-gray-400">{t('links.nfcNotAssigned')}</span>
          )}
        </div>

        <div className="mt-3 flex items-start gap-2 rounded-md bg-amber-50 p-2.5">
          <svg viewBox="0 0 16 16" fill="currentColor" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500">
            <path fillRule="evenodd" d="M8 15A7 7 0 108 1a7 7 0 000 14zm.75-9.25a.75.75 0 00-1.5 0v2.5a.75.75 0 001.5 0v-2.5zM8 11a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
          <p className="text-[11px] leading-relaxed text-amber-700">{t('links.nfcFuture')}</p>
        </div>
      </LinkSection>

    </div>
  );
}
