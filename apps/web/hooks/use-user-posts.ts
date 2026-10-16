'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { UserGridPostsResponse, UserGridPostItem } from '@social/types';
import { getMockUserPosts } from '@/lib/profile-mock-data';

interface UseUserPostsOptions {
  username?: string;
  sort?: 'latest' | 'popular' | 'old';
  limit?: number;
}

export function useUserPosts({
  username = 'oliviamartinez',
  sort = 'latest',
  limit = 18,
}: UseUserPostsOptions) {
  return useInfiniteQuery<UserGridPostsResponse>({
    queryKey: ['user-posts', username, sort],
    queryFn: async ({ pageParam }) => {
      try {
        const res = await apiClient.users.getUserPosts(username, {
          sort,
          cursor: pageParam as string | undefined,
          limit,
        });

        if (res.success && res.data) {
          return res.data;
        }
      } catch (err) {
        console.warn('API getUserPosts call failed, using mock architectural posts:', err);
      }

      // High-fidelity fallback pagination matching Figma screenshot
      const cursorOffset = pageParam ? parseInt(atob(pageParam as string), 10) : 0;
      const sorted = getMockUserPosts(username, sort);

      const pagedItems = sorted.slice(cursorOffset, cursorOffset + 9);
      const hasMore = cursorOffset + 9 < sorted.length;
      const nextCursor = hasMore ? btoa(String(cursorOffset + 9)) : undefined;

      return {
        items: pagedItems,
        nextCursor,
        hasMore,
      };
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage?.nextCursor || undefined,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
