'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { EmptyState } from '@/components/ui/EmptyState';
import { EntityListShell } from '@/components/account/EntityListShell';

export default function AccountPermitsPage() {
  const { t } = useLanguage();

  return (
    <EntityListShell
      title={t('permits.list.title')}
      subtitle={t('permits.list.subtitle')}
      newLabel={t('permits.list.new')}
      onNew={() => {}}
      newDisabled
    >
      <EmptyState
        title={t('permits.list.empty')}
        description={t('permits.list.emptyDesc')}
        hints={[
          t('permits.hint.parser'),
          t('permits.hint.storage'),
          t('permits.hint.admin'),
        ]}
      />
    </EntityListShell>
  );
}
