'use client';

import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getPdfjs, loadPdfBytes } from '@/lib/pdf/loadPdfBytes';
import { classNames } from '@/lib/utils';

export type PDFPreviewProps = {
  url: string;
  label?: string;
  /** Shorter canvas stack for inline form fields. */
  compact?: boolean;
};

type LoadState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'ready' }
  | { kind: 'error'; message: string };

export function PDFPreview({ url, label, compact = false }: PDFPreviewProps) {
  const { t } = useLanguage();
  const [state, setState] = useState<LoadState>({ kind: 'idle' });
  const containerRef = useRef<HTMLDivElement>(null);

  const hasUrl = Boolean(url?.trim());
  const displayLabel = label || t('field.policyPdf');
  const maxHeight = compact ? 'max-h-56' : 'max-h-[min(70vh,520px)]';

  useEffect(() => {
    if (!hasUrl) {
      setState({ kind: 'idle' });
      return;
    }

    let cancelled = false;
    const container = containerRef.current;
    if (!container) return;

    setState({ kind: 'loading' });
    container.replaceChildren();

    (async () => {
      try {
        const pdfjs = await getPdfjs();
        const data = await loadPdfBytes(url);
        if (cancelled) return;

        const doc = await pdfjs.getDocument({ data }).promise;
        if (cancelled) return;

        const scale = compact ? 1.1 : 1.35;
        for (let pageNum = 1; pageNum <= doc.numPages; pageNum += 1) {
          if (cancelled) return;
          const page = await doc.getPage(pageNum);
          const viewport = page.getViewport({ scale });
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.className = 'mx-auto block w-full max-w-full bg-white shadow-sm';
          if (pageNum > 1) canvas.className += ' mt-2';

          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('canvas unavailable');

          await page.render({ canvasContext: ctx, viewport, canvas }).promise;
          if (cancelled) return;
          container.appendChild(canvas);
        }

        if (!cancelled) setState({ kind: 'ready' });
      } catch (err) {
        if (!cancelled) {
          setState({
            kind: 'error',
            message: err instanceof Error ? err.message : String(err),
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [url, hasUrl, compact]);

  if (!hasUrl) {
    return (
      <div
        className={classNames(
          'flex flex-col items-center justify-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-6 py-10 text-center',
          maxHeight,
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
      <div
        className={classNames(
          'overflow-y-auto overflow-x-hidden rounded-lg border border-gray-200 bg-gray-100 p-2 shadow-sm',
          maxHeight,
        )}
      >
        {state.kind === 'loading' ? (
          <div className="flex min-h-[200px] flex-col items-center justify-center gap-2 py-10 text-sm text-gray-500">
            <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
            {t('common.pdfPreviewLoading')}
          </div>
        ) : null}

        {state.kind === 'error' ? (
          <div className="flex min-h-[200px] flex-col items-center justify-center gap-2 px-4 py-10 text-center text-sm text-gray-600">
            <p>{t('common.pdfPreviewFailed')}</p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-blue-600 underline-offset-2 hover:underline"
            >
              {t('common.viewDocument')}
            </a>
          </div>
        ) : null}

        <div ref={containerRef} className={state.kind === 'ready' ? '' : 'sr-only'} aria-hidden={state.kind !== 'ready'} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-100 bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <svg className="h-9 w-9 shrink-0 text-red-600" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4zM8 12h8v2H8v-2zm0 4h8v2H8v-2z" />
          </svg>
          <div className="min-w-0 text-left">
            <p className="text-sm font-medium text-gray-900">{displayLabel}</p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 underline-offset-2 hover:underline"
            >
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
