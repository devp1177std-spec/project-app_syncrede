'use client';

import { useInfiniteQuery } from '@tanstack/react-query';

interface PaginatedResponse<T> {
  items: T[];
  nextCursor?: string | null;
}

export function useInfiniteCursorQuery<T>({
  queryKey,
  fetcher,
  limit = 20,
}: {
  queryKey: any[];
  fetcher: (cursor?: string, limit?: number) => Promise<PaginatedResponse<T>>;
  limit?: number;
}) {
  return useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => fetcher(pageParam, limit),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
  });
}
