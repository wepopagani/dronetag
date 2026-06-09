/**
 * Client-side PDF text extraction via pdf.js (dynamic import).
 * Sorts text items by position so multi-column ENAC/EASA certificates
 * read in a sensible order.
 */

type PdfTextItem = {
  str: string;
  transform: number[];
};

function isPdfTextItem(item: unknown): item is PdfTextItem {
  return (
    typeof item === 'object'
    && item !== null
    && 'str' in item
    && 'transform' in item
    && Array.isArray((item as PdfTextItem).transform)
  );
}

function pageItemsToText(items: unknown[]): string {
  const typed = items
    .filter(isPdfTextItem)
    .map((item) => ({ str: String(item.str), transform: item.transform }))
    .filter((item) => item.str.trim());

  typed.sort((a, b) => {
    const dy = b.transform[5] - a.transform[5];
    if (Math.abs(dy) > 6) return dy;
    return a.transform[4] - b.transform[4];
  });

  const lines: string[] = [];
  let currentLine = '';
  let lastY: number | null = null;

  for (const item of typed) {
    const y = item.transform[5];
    if (lastY !== null && Math.abs(y - lastY) > 6) {
      if (currentLine.trim()) lines.push(currentLine.trim());
      currentLine = item.str;
    } else {
      currentLine = currentLine ? `${currentLine} ${item.str}` : item.str;
    }
    lastY = y;
  }
  if (currentLine.trim()) lines.push(currentLine.trim());

  return lines.join('\n');
}

export async function extractTextFromPdf(file: File): Promise<string> {
  const pdfjs = await import('pdfjs-dist');
  if (typeof window !== 'undefined') {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
  }

  const buffer = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buffer }).promise;
  const parts: string[] = [];

  for (let page = 1; page <= doc.numPages; page += 1) {
    const pageDoc = await doc.getPage(page);
    const content = await pageDoc.getTextContent();
    parts.push(pageItemsToText(content.items));
  }

  return parts.join('\n');
}
