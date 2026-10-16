'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export function useUsernameCheck(username: string) {
  const [debouncedUsername, setDebouncedUsername] = useState(username.trim());

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedUsername(username.trim().toLowerCase());
    }, 400);

    return () => {
      clearTimeout(handler);
    };
  }, [username]);

  const isValidFormat =
    debouncedUsername.length >= 3 &&
    debouncedUsername.length <= 30 &&
    /^[a-zA-Z0-9_]+$/.test(debouncedUsername);

  const query = useQuery({
    queryKey: ['username-check', debouncedUsername],
    queryFn: () => apiClient.users.checkUsername(debouncedUsername),
    enabled: isValidFormat,
    staleTime: 1000 * 60 * 2, // 2 mins cache
  });

  const isChecking = query.isLoading || (username.trim().toLowerCase() !== debouncedUsername && isValidFormat);
  const isAvailable = query.data?.available ?? null;
  const suggestions = query.data?.suggestions ?? [];

  return {
    debouncedUsername,
    isValidFormat,
    isChecking,
    isAvailable,
    suggestions,
    error: query.error,
  };
}
