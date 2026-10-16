import React from 'react';
import { ProfileScreen } from '@/components/profile/profile-screen';

interface ProfileUserPageProps {
  params: Promise<{ username: string }>;
}

export default async function ProfileUserPage({ params }: ProfileUserPageProps) {
  const { username } = await params;

  return (
    <ProfileScreen
      initialUsername={username}
      initialOwnProfile={false}
      showModeToggle={false}
    />
  );
}
