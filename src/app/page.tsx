'use client';

import { LandingHero } from '@/components/landing/LandingHero';
import { HowItWorks } from '@/components/landing/HowItWorksStep';
import { FeatureCard, FeatureGrid } from '@/components/landing/FeatureCard';
import { VerificationPreview } from '@/components/landing/VerificationPreview';
import { LandingCTA } from '@/components/landing/LandingCTA';
import { LandingDisclaimer, PublicFooter } from '@/components/landing/PublicFooter';
import { LandingSection, LandingSectionHeader } from '@/components/landing/LandingSection';
import { NavIcons } from '@/components/layout/navIcons';
import { LandingIcons } from '@/components/landing/landingIcons';
import { useLanguage } from '@/contexts/LanguageContext';

const FEATURES = [
  { titleKey: 'home.features.profile.title', descKey: 'home.features.profile.desc', icon: NavIcons.profile },
  { titleKey: 'home.features.certificates.title', descKey: 'home.features.certificates.desc', icon: NavIcons.certificates },
  { titleKey: 'home.features.insurances.title', descKey: 'home.features.insurances.desc', icon: NavIcons.insurances },
  { titleKey: 'home.features.drones.title', descKey: 'home.features.drones.desc', icon: NavIcons.drones },
  { titleKey: 'home.features.nfc.title', descKey: 'home.features.nfc.desc', icon: LandingIcons.nfc },
  { titleKey: 'home.features.expiry.title', descKey: 'home.features.expiry.desc', icon: LandingIcons.calendar },
] as const;

export default function HomePage() {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col overflow-x-safe bg-[var(--color-app-bg)]">
      <LandingHero />

      <LandingSection id="come-funziona" bg="white">
        <HowItWorks />
      </LandingSection>

      <LandingSection id="funzionalita" bg="default">
        <LandingSectionHeader title={t('home.features.title')} subtitle={t('home.features.subtitle')} />
        <FeatureGrid>
          {FEATURES.map(({ titleKey, descKey, icon: Icon }) => (
            <FeatureCard
              key={titleKey}
              titleKey={titleKey}
              descKey={descKey}
              icon={<Icon className="h-5 w-5" />}
            />
          ))}
        </FeatureGrid>
      </LandingSection>

      <LandingSection id="verifica" bg="default">
        <VerificationPreview />
      </LandingSection>

      <LandingSection bg="default" className="py-8 sm:py-10 lg:py-12">
        <LandingCTA />
      </LandingSection>

      <LandingDisclaimer />
      <PublicFooter />
    </div>
  );
}
