'use client';

import { useState } from 'react';

interface OptimisticActionOptions<T> {
  initialValue: T;
  onMutate: (current: T) => T;
  action: () => Promise<boolean>;
  onError?: (error: Error) => void;
}

export function useOptimisticAction<T>({
  initialValue,
  onMutate,
  action,
  onError,
}: OptimisticActionOptions<T>) {
  const [value, setValue] = useState<T>(initialValue);
  const [isPending, setIsPending] = useState(false);

  const trigger = async () => {
    const previous = value;
    const optimistic = onMutate(previous);
    setValue(optimistic);
    setIsPending(true);

    try {
      const ok = await action();
      if (!ok) {
        setValue(previous); // Rollback
      }
    } catch (e: any) {
      setValue(previous); // Rollback on exception
      if (onError) onError(e);
    } finally {
      setIsPending(false);
    }
  };

  return { value, setValue, isPending, trigger };
}
