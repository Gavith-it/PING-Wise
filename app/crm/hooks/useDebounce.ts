import { useState, useEffect } from 'react';

/**
 * Custom hook to debounce a value
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 300ms)
 * @returns Debounced value
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Only update if value actually changed
    if (value === debouncedValue) {
      return; // No change, skip update
    }
    
    const timer = setTimeout(() => {
      // Only update if value is different
      if (value !== debouncedValue) {
        setDebouncedValue(value);
      }
    }, delay);
    
    return () => clearTimeout(timer);
  }, [value, delay, debouncedValue]);

  return debouncedValue;
}
