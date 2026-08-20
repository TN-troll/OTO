import { useState, useEffect } from 'react';

/**
 * Generic debounce hook that delays updating the returned value
 * until `delay` milliseconds have passed since the last change.
 *
 * Cleans up pending timers on unmount and value change.
 */
export function useDebouncedValue<T>(value: T, delay: number = 400): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
