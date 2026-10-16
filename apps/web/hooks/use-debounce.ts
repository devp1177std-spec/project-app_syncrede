import { useState, useEffect } from 'react';

/**
 * Debounce a value by the specified delay in milliseconds.
 * Cancels pending timeouts if the value changes before delay expires.
 */
export function useDebounce<T>(value: T, delay: number = 250): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
