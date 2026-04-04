'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { ProfileForm } from '@/components/profile/ProfileForm';
import { Button } from '@/components/ui/Button';
import { SectionHeader } from '@/components/ui/SectionHeader';

export default function NewProfilePage() {
  const router = useRouter();
  const { t } = useLanguage();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/admin">
          <Button type="button" variant="ghost" size="sm">
            ← {t('common.back')}
          </Button>
        </Link>
        <SectionHeader title={t('admin.createProfileTitle')} />
      </div>
      <ProfileForm onSave={() => router.push('/admin')} />
    </div>
  );
}
