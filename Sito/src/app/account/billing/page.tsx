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
    <div className="mt-6 space-y-6">
      <Card padding="md">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              {t('billing.title')}
            </h2>
            <p className="mt-1 text-sm text-gray-500">{t('billing.subtitle')}</p>
          </div>
          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-600/20">
            {t('billing.comingSoon')}
          </span>
        </header>

        <p className="mt-4 rounded-lg bg-gray-50 px-4 py-3 text-xs leading-relaxed text-gray-600">
          {t('billing.comingSoonBody')}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button disabled>{t('billing.subscribe')}</Button>
          <Button href="/account/profile" variant="ghost">
            {t('billing.manageProfile')}
          </Button>
        </div>
      </Card>

      <PlanSlotsSummary />
    </div>
  );
}
