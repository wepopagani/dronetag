'use client';

/**
 * Billing portal placeholder (PR-SEC-4).
 *
 * Renders the user's current plan + slot summary alongside a disabled
 * "Subscribe" CTA. The functional checkout flow ships in PR-BILL-1
 * once Stripe (or another provider) is wired into the abstraction at
 * `src/lib/billing/types.ts`.
 */

import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PlanSlotsSummary } from '@/components/account/PlanSlotsSummary';

export default function AccountBillingPage() {
  const { t } = useLanguage();
  return (
    <div className="space-y-4 sm:space-y-6">
      <Card padding="md">
        <header className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-3">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-gray-900 sm:text-base">
              {t('billing.title')}
            </h2>
            <p className="mt-0.5 text-xs text-gray-500 sm:text-sm">{t('billing.subtitle')}</p>
          </div>
          <span className="w-fit rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-medium text-amber-800 ring-1 ring-inset ring-amber-600/20 sm:px-3 sm:py-1 sm:text-xs">
            {t('billing.comingSoon')}
          </span>
        </header>

        <p className="mt-3 rounded-lg bg-gray-50 px-3 py-2.5 text-[11px] leading-relaxed text-gray-600 sm:mt-4 sm:px-4 sm:py-3 sm:text-xs">
          {t('billing.comingSoonBody')}
        </p>

        <div className="mt-3 flex flex-col gap-2 sm:mt-4 sm:flex-row sm:flex-wrap">
          <Button disabled fullWidth className="sm:w-auto">{t('billing.subscribe')}</Button>
          <Button href="/account/profile" variant="ghost" fullWidth className="sm:w-auto">
            {t('billing.manageProfile')}
          </Button>
        </div>
      </Card>

      <PlanSlotsSummary />
    </div>
  );
}
