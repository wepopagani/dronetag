'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { EmptyState } from '@/components/ui/EmptyState';
import { EntityListShell } from '@/components/account/EntityListShell';

export default function AccountArchivePage() {
  const { t } = useLanguage();

  return (
    <EntityListShell
      title={t('archive.list.title')}
      subtitle={t('archive.list.subtitle')}
      newLabel={t('archive.list.new')}
      onNew={() => {}}
      newDisabled
    >
      <EmptyState
        title={t('archive.list.empty')}
        description={t('archive.list.emptyDesc')}
        hints={[
          t('archive.hint.storage'),
          t('archive.hint.autoMove'),
          t('archive.hint.upgrade'),
        ]}
      />
    </EntityListShell>
  );
}
