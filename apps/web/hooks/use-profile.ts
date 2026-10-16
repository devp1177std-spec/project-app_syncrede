'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { UserProfileResponse } from '@social/types';
import { getMockProfile } from '@/lib/profile-mock-data';

interface UseProfileOptions {
  username?: string;
  isOwnProfile?: boolean;
}

export function useProfile({ username = 'oliviamartinez', isOwnProfile = false }: UseProfileOptions) {
  return useQuery<UserProfileResponse>({
    queryKey: ['profile', username, isOwnProfile],
    queryFn: async () => {
      try {
        const res = await apiClient.users.getProfile(username);
        if (res.success && res.data) {
          return res.data;
        }
      } catch (err) {
        console.warn('API getProfile call failed, falling back to design mockup data:', err);
      }

      // Return high-fidelity mockup data matching the Figma screenshot
      return getMockProfile(username, isOwnProfile);
    },
    staleTime: 1000 * 60 * 2, // 2 minutes cache
  });
}
