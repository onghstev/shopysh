'use client';

import { useCallback, useState } from 'react';

export function useApi<T = any>() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchApi = useCallback(async (
    url: string,
    options?: RequestInit
  ): Promise<T | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(url, {
        headers: { 'Content-Type': 'application/json', ...(options?.headers ?? {}) },
        ...options,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? 'Request failed');
        return null;
      }
      return data as T;
    } catch (err: any) {
      setError(err?.message ?? 'Network error');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { fetchApi, loading, error };
}
