'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { CompletenessBadge, VerificationBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';

function StatusPill({ label, variant }: { label: string; variant: 'green' | 'orange' }) {
  const styles = variant === 'green'
    ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
    : 'bg-amber-50 text-amber-700 ring-amber-600/20';
  const dot = variant === 'green' ? 'bg-emerald-500' : 'bg-amber-500';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset ${styles}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} aria-hidden />
      {label}
    </span>
  );
}

export function PlatformPreview() {
  const { t } = useLanguage();

  return (
    <div className="mx-auto w-full max-w-[22rem] sm:max-w-none lg:max-w-[24rem]">
      {/* Phone frame */}
      <div className="relative rounded-[1.75rem] border-[6px] border-[var(--color-navy)] bg-[var(--color-navy)] p-1 shadow-[0_20px_50px_rgb(7_21_47_/_0.18)]">
        <div className="overflow-hidden rounded-[1.25rem] bg-[var(--color-app-bg)]">
          {/* Profile card */}
          <div className="space-y-2.5 p-3">
            <div className="rounded-2xl border border-[var(--color-border)] bg-white p-3 shadow-[var(--shadow-card)]">
              <div className="flex items-start gap-2.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-navy)] text-xs font-bold text-white">
                  MB
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[var(--color-text)]">{t('home.preview.operatorName')}</p>
                  <p className="text-[10px] text-[var(--color-text-secondary)]">{t('home.preview.operatorRole')}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    <VerificationBadge status="verified" />
                    <CompletenessBadge percent={92} />
                  </div>
                </div>
              </div>

              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between rounded-lg bg-[var(--color-app-bg)] px-2.5 py-2">
                  <div className="min-w-0">
                    <p className="text-[10px] font-medium text-[var(--color-text)]">{t('home.preview.insurance')}</p>
                    <p className="text-[9px] text-[var(--color-text-secondary)]">{t('home.preview.insuranceDetail')}</p>
                  </div>
                  <StatusPill label={t('home.preview.valid')} variant="green" />
                </div>
                <div className="flex items-center justify-between rounded-lg bg-[var(--color-app-bg)] px-2.5 py-2">
                  <div className="min-w-0">
                    <p className="text-[10px] font-medium text-[var(--color-text)]">{t('home.preview.certificate')}</p>
                    <p className="text-[9px] text-[var(--color-text-secondary)]">{t('home.preview.certificateDetail')}</p>
                  </div>
                  <StatusPill label={t('home.preview.valid')} variant="green" />
                </div>
                <div className="flex items-center justify-between rounded-lg bg-[var(--color-app-bg)] px-2.5 py-2">
                  <div className="min-w-0">
                    <p className="text-[10px] font-medium text-[var(--color-text)]">{t('home.preview.drone')}</p>
                    <p className="text-[9px] text-[var(--color-text-secondary)]">{t('home.preview.droneDetail')}</p>
                  </div>
                  <StatusPill label={t('home.preview.expiring')} variant="orange" />
                </div>
              </div>

              <div className="mt-3">
                <Button size="sm" fullWidth className="min-h-[2.25rem] text-xs pointer-events-none">
                  {t('home.preview.showCredentials')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
