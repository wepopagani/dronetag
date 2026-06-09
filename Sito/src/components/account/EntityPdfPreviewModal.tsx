'use client';

import { Modal } from '@/components/ui/Modal';
import { PDFPreview } from '@/components/ui/PDFPreview';

export type EntityPdfPreviewModalProps = {
  isOpen: boolean;
  title: string;
  url: string;
  onClose: () => void;
};

export function EntityPdfPreviewModal({ isOpen, title, url, onClose }: EntityPdfPreviewModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <PDFPreview url={url} label={title} />
    </Modal>
  );
}
