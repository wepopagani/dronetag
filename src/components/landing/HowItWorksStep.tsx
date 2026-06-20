'use client';

import { useLanguage } from '@/contexts/LanguageContext';

type HowItWorksStepProps = {
  step: number;
  titleKey: 'home.how.step1.title' | 'home.how.step2.title' | 'home.how.step3.title';
  descKey: 'home.how.step1.desc' | 'home.how.step2.desc' | 'home.how.step3.desc';
  isLast?: boolean;
};

export function HowItWorksStep({ step, titleKey, descKey, isLast }: HowItWorksStepProps) {
  const { t } = useLanguage();

  return (
    <li className="relative flex gap-4 sm:block sm:flex-1">
      {/* Mobile timeline connector */}
      {!isLast ? (
        <span className="absolute top-10 bottom-0 left-[1.125rem] w-px bg-[var(--color-border)] sm:hidden" aria-hidden />
      ) : null}

      <div className="relative z-[1] flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-navy)] text-sm font-bold text-white sm:mx-auto">
        {step}
      </div>

      <div className="min-w-0 pb-6 sm:pb-0 sm:pt-4 sm:text-center">
        <h3 className="text-sm font-semibold text-[var(--color-text)] sm:text-base">{t(titleKey)}</h3>
        <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-secondary)] sm:mx-auto sm:max-w-[14rem] sm:text-sm">
          {t(descKey)}
        </p>
      </div>
    </li>
  );
}

export function HowItWorks() {
  const { t } = useLanguage();
  const steps: HowItWorksStepProps[] = [
    { step: 1, titleKey: 'home.how.step1.title', descKey: 'home.how.step1.desc' },
    { step: 2, titleKey: 'home.how.step2.title', descKey: 'home.how.step2.desc' },
    { step: 3, titleKey: 'home.how.step3.title', descKey: 'home.how.step3.desc', isLast: true },
  ];

  return (
    <div>
      <h2 className="mb-6 text-xl font-bold tracking-tight text-[var(--color-navy)] sm:mb-8 sm:text-2xl">
        {t('home.how.title')}
      </h2>
      <ol className="flex flex-col sm:flex-row sm:gap-6">
        {steps.map((s) => (
          <HowItWorksStep key={s.step} {...s} />
        ))}
      </ol>
    </div>
  );
}
