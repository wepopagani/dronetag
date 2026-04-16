'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getProfile } from '@/lib/firebase/firestore';
import type { Profile } from '@/lib/types';
import { ProfileForm } from '@/components/profile/ProfileForm';
import { Button } from '@/components/ui/Button';
import { SectionHeader } from '@/components/ui/SectionHeader';

export default function EditProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useLanguage();
  const id = typeof params?.id === 'string' ? params.id : '';

  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    void getProfile(id).then((p) => {
      if (!cancelled) setProfile(p);
    });
    return () => { cancelled = true; };
  }, [id]);

  if (profile === undefined) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm text-gray-500">{t('common.loading')}</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4">
        <p className="text-base font-medium text-gray-800">{t('profile.notFound')}</p>
        <Link href="/admin">
          <Button variant="secondary">{t('common.back')}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/admin">
          <Button type="button" variant="ghost" size="sm">
            ← {t('common.back')}
          </Button>
        </Link>
        <SectionHeader title={t('admin.editProfileTitle')} />
      </div>
      <ProfileForm initialData={profile} onSave={() => router.push('/admin')} />
    </div>
  );
}
