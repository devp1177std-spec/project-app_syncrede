'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { UserProfileResponse } from '@social/types';
import { getMockProfile } from '@/lib/profile-mock-data';

interface UseProfileOptions {
  username?: string;
  isOwnProfile?: boolean;
}

export function useProfile({ username, isOwnProfile = false }: UseProfileOptions) {
  return useQuery<UserProfileResponse>({
    queryKey: ['profile', isOwnProfile ? 'me' : username],
    queryFn: async () => {
      if (isOwnProfile) {
        try {
          const res = await apiClient.users.getMe();
          if (res.success && res.data) {
            return res.data;
          }
        } catch {
          return getMockProfile('oliviamartinez', true);
        }
        return getMockProfile('oliviamartinez', true);
      }

      if (username) {
        try {
          const res = await apiClient.users.getProfile(username);
          if (res.success && res.data) {
            return res.data;
          }
        } catch (err) {
          if (username === 'oliviamartinez') {
            return getMockProfile(username, false);
          }
          throw err;
        }

        if (username === 'oliviamartinez') {
          return getMockProfile(username, false);
        }

        throw new Error(`User @${username} not found`);
      }

      throw new Error('No username or session available');
    },
    enabled: isOwnProfile || Boolean(username),
    staleTime: 1000 * 60 * 2, // 2 minutes cache
  });
}
