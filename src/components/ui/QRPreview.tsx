'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { classNames } from '@/lib/utils';

export type QRPreviewProps = {
  url: string;
  size?: number;
};

export function QRPreview({ url, size = 200 }: QRPreviewProps) {
  const { t } = useLanguage();
  const hasUrl = Boolean(url?.trim());

  if (!hasUrl) {
    return (
      <div
        className={classNames(
          'flex items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 shadow-sm',
          'text-sm text-gray-400'
        )}
        style={{ width: size, height: size }}
        role="img"
        aria-label={t('common.noQr')}
      >
        {t('common.noQr')}
      </div>
    );
  }

  return (
    <div
      className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm"
      style={{ width: size, height: size }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={t('profile.qrCode')} width={size} height={size} className="h-full w-full object-contain" />
    </div>
  );
}
