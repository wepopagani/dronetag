import { type ReactNode } from 'react';
import { classNames } from '@/lib/utils';

type LandingSectionProps = {
  id?: string;
  children: ReactNode;
  className?: string;
  innerClassName?: string;
  bg?: 'default' | 'white' | 'navy';
};

const bgClasses = {
  default: 'bg-[var(--color-app-bg)]',
  white: 'bg-white',
  navy: 'bg-[var(--color-navy)] text-white',
};

export function LandingSection({ id, children, className, innerClassName, bg = 'default' }: LandingSectionProps) {
  return (
    <section id={id} className={classNames('overflow-x-safe py-10 sm:py-14 lg:py-16', bgClasses[bg], className)}>
      <div className={classNames('mx-auto w-full max-w-[72rem] px-4 sm:px-5 lg:px-6', innerClassName)}>
        {children}
      </div>
    </section>
  );
}

export function LandingSectionHeader({
  title,
  subtitle,
  className,
  dark = false,
}: {
  title: string;
  subtitle?: string;
  className?: string;
  dark?: boolean;
}) {
  return (
    <div className={classNames('mb-6 sm:mb-8', className)}>
      <h2 className={classNames('text-xl font-bold tracking-tight sm:text-2xl lg:text-[1.75rem]', dark ? 'text-white' : 'text-[var(--color-navy)]')}>
        {title}
      </h2>
      {subtitle ? (
        <p className={classNames('mt-2 max-w-2xl text-sm leading-relaxed sm:text-base', dark ? 'text-white/75' : 'text-[var(--color-text-secondary)]')}>
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
