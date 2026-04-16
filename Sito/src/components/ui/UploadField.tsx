'use client';

import {
  type DragEvent,
  type ChangeEvent,
  useCallback,
  useRef,
  useState,
} from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { classNames } from '@/lib/utils';

function filenameFromUrl(url: string): string {
  try {
    const path = new URL(url, typeof window !== 'undefined' ? window.location.origin : 'https://x').pathname;
    const base = path.split('/').pop() || 'document';
    return decodeURIComponent(base);
  } catch {
    return 'document';
  }
}

function isLikelyImageUrl(url: string): boolean {
  const lower = url.toLowerCase().split('?')[0] ?? '';
  return /\.(png|jpe?g|gif|webp|svg|avif|bmp)$/i.test(lower);
}

function isLikelyPdfUrl(url: string): boolean {
  const lower = url.toLowerCase().split('?')[0] ?? '';
  return lower.endsWith('.pdf') || url.toLowerCase().includes('application/pdf');
}

export type UploadFieldProps = {
  label: string;
  accept: string;
  currentUrl?: string;
  onUpload: (file: File) => void;
  onRemove?: () => void;
  preview?: boolean;
  required?: boolean;
  className?: string;
};

export function UploadField({
  label,
  accept,
  currentUrl,
  onUpload,
  onRemove,
  preview = true,
  required,
  className,
}: UploadFieldProps) {
  const { t } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const pickFile = useCallback(
    (fileList: FileList | null) => {
      const file = fileList?.[0];
      if (file) onUpload(file);
    },
    [onUpload]
  );

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    pickFile(e.target.files);
    e.target.value = '';
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }

  function handleDragLeave(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    pickFile(e.dataTransfer.files);
  }

  const showPreview = Boolean(preview && currentUrl);
  const showImagePreview = showPreview && isLikelyImageUrl(currentUrl!);
  const showPdfPreview = showPreview && !showImagePreview && isLikelyPdfUrl(currentUrl!);

  return (
    <div className={classNames('w-full', className)}>
      <span className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
        {required ? (
          <span className="ml-0.5 text-red-500" aria-hidden>
            *
          </span>
        ) : null}
      </span>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={handleChange}
        aria-hidden
      />

      {showImagePreview ? (
        <div className="relative mb-3 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentUrl}
            alt=""
            className="max-h-48 w-full object-contain"
          />
          {onRemove ? (
            <button
              type="button"
              onClick={onRemove}
              className="absolute top-2 right-2 rounded-md bg-white/90 px-2 py-1 text-xs font-medium text-gray-700 shadow-sm ring-1 ring-gray-200 transition hover:bg-white"
            >
              {t('common.remove')}
            </button>
          ) : null}
        </div>
      ) : null}

      {showPdfPreview ? (
        <div className="relative mb-3 flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
          <svg
            className="h-10 w-10 shrink-0 text-red-600"
            fill="currentColor"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4zM8 12h8v2H8v-2zm0 4h8v2H8v-2z" />
          </svg>
          <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-800">
            {filenameFromUrl(currentUrl!)}
          </span>
          {onRemove ? (
            <button
              type="button"
              onClick={onRemove}
              className="shrink-0 rounded-md bg-white px-2 py-1 text-xs font-medium text-gray-700 shadow-sm ring-1 ring-gray-200 transition hover:bg-gray-50"
            >
              {t('common.remove')}
            </button>
          ) : null}
        </div>
      ) : null}

      {showPreview && currentUrl && !showImagePreview && !showPdfPreview ? (
        <div className="relative mb-3 flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
          <svg
            className="h-10 w-10 shrink-0 text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
            />
          </svg>
          <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-800">
            {filenameFromUrl(currentUrl)}
          </span>
          {onRemove ? (
            <button
              type="button"
              onClick={onRemove}
              className="shrink-0 rounded-md bg-white px-2 py-1 text-xs font-medium text-gray-700 shadow-sm ring-1 ring-gray-200 transition hover:bg-gray-50"
            >
              {t('common.remove')}
            </button>
          ) : null}
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={classNames(
          'flex w-full flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-8 text-center transition',
          dragOver
            ? 'border-blue-500 bg-blue-50/50'
            : 'border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50/80'
        )}
      >
        <span className="text-sm font-medium text-gray-700">{t('common.clickOrDragToUpload')}</span>
        <span className="mt-1 text-xs text-gray-500">{accept}</span>
      </button>
    </div>
  );
}
