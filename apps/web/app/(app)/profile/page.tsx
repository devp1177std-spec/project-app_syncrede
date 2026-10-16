'use client';

import React from 'react';
import { ProfileScreen } from '@/components/profile/profile-screen';

export default function ProfilePage() {
  return <ProfileScreen initialOwnProfile={true} showModeToggle={false} />;
}
