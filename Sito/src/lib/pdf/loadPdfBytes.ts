/**
 * Load PDF bytes for in-app preview (bypasses cross-origin iframe limits).
 */

import { adminFetch } from '@/lib/client/adminApi';
import { isAllowedFileUrl } from '@/lib/utils/urlAllowlist';

export async function loadPdfBytes(sourceUrl: string): Promise<ArrayBuffer> {
  const url = sourceUrl.trim();
  if (!url) throw new Error('missing pdf url');

  if (url.startsWith('blob:') || url.startsWith('data:')) {
    const res = await fetch(url);
    if (!res.ok) throw new Error('local pdf fetch failed');
    return res.arrayBuffer();
  }

  if (!isAllowedFileUrl(url)) {
    throw new Error('pdf url host not allowed');
  }

  const proxyUrl = `/api/files/proxy?url=${encodeURIComponent(url)}`;
  const res = await adminFetch(proxyUrl);
  if (!res.ok) {
    throw new Error(`pdf proxy failed (${res.status})`);
  }
  return res.arrayBuffer();
}

export async function getPdfjs() {
  const pdfjs = await import('pdfjs-dist');
  if (typeof window !== 'undefined' && !pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc =
      `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
  }
  return pdfjs;
}
