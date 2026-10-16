'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { UserProfileResponse } from '@social/types';

interface UseFollowMutationProps {
  username: string;
}

export function useFollowMutation({ username }: UseFollowMutationProps) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ isFollowing }: { isFollowing: boolean }) => {
      if (isFollowing) {
        return apiClient.users.unfollow(username);
      } else {
        return apiClient.users.follow(username);
      }
    },
    onMutate: async ({ isFollowing }) => {
      // Cancel outgoing refetches so they don't overwrite optimistic update
      const queryKey = ['profile', username, false];
      await queryClient.cancelQueries({ queryKey });

      const previousProfile = queryClient.getQueryData<UserProfileResponse>(queryKey);

      if (previousProfile) {
        const nextFollowing = !isFollowing;
        queryClient.setQueryData<UserProfileResponse>(queryKey, {
          ...previousProfile,
          followerCount: previousProfile.followerCount + (nextFollowing ? 1 : -1),
          relationship: {
            ...previousProfile.relationship,
            isFollowing: nextFollowing,
            requested: false,
          },
        });
      }

      return { previousProfile, queryKey };
    },
    onError: (err, variables, context) => {
      if (context?.previousProfile) {
        queryClient.setQueryData(context.queryKey, context.previousProfile);
      }
    },
    onSettled: (data, error, variables, context) => {
      if (context?.queryKey) {
        queryClient.invalidateQueries({ queryKey: context.queryKey });
      }
    },
  });
}
