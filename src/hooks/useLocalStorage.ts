"use client";

import { useState, useEffect, useCallback, useRef } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isLoaded, setIsLoaded] = useState(false);
  const storedValueRef = useRef<T>(storedValue);

  useEffect(() => {
    storedValueRef.current = storedValue;
  }, [storedValue]);

  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        const parsed = JSON.parse(item);
        setStoredValue(parsed);
        storedValueRef.current = parsed;
      }
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
    }
    setIsLoaded(true);
  }, [key]);

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValueRef.current) : value;
      setStoredValue(valueToStore);
      storedValueRef.current = valueToStore;
      
      const jsonString = JSON.stringify(valueToStore);
      
      try {
        window.localStorage.setItem(key, jsonString);
      } catch (quotaError) {
        console.error(`Storage quota exceeded for key "${key}". Trying to compress...`);
        const compressedValue = compressImages(valueToStore);
        window.localStorage.setItem(key, JSON.stringify(compressedValue));
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key]);

  return { value: storedValue, setValue, isLoaded };
}

function compressImages(obj: unknown): unknown {
  if (typeof obj !== 'object' || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(compressImages);
  
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (typeof value === 'string' && value.startsWith('data:image')) {
      result[key] = value.substring(0, 50000);
    } else if (typeof value === 'object') {
      result[key] = compressImages(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}
