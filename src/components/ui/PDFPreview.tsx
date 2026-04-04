'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { classNames } from '@/lib/utils';

export type PDFPreviewProps = {
  url: string;
  label?: string;
};

export function PDFPreview({ url, label }: PDFPreviewProps) {
  const { t } = useLanguage();
  const hasUrl = Boolean(url?.trim());
  const displayLabel = label || t('field.policyPdf');

  if (!hasUrl) {
    return (
      <div
        className={classNames(
          'flex flex-col items-center justify-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-6 py-10 text-center',
          'max-h-[400px]'
        )}
      >
        <svg className="h-12 w-12 text-gray-300" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4zM8 12h8v2H8v-2zm0 4h8v2H8v-2z" />
        </svg>
        <p className="text-sm text-gray-500">{t('common.noDocument')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-100 shadow-sm">
        <iframe title={displayLabel} src={url} className="h-[400px] max-h-[400px] w-full border-0" />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-100 bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <svg className="h-9 w-9 shrink-0 text-red-600" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4zM8 12h8v2H8v-2zm0 4h8v2H8v-2z" />
          </svg>
          <div className="min-w-0 text-left">
            <p className="text-sm font-medium text-gray-900">{displayLabel}</p>
            <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 underline-offset-2 hover:underline">
              {t('common.viewDocument')}
            </a>
          </div>
        </div>
        <a
          href={url}
          download
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
        >
          {t('common.download')}
        </a>
      </div>
    </div>
  );
}
