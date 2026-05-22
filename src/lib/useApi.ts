// ─── Generic data-fetching hook with loading/error states ───────────────
//
// Usage:
//   const { data, loading, error, refetch } = useApi(() => learningApi.getTracks());
//   const { data, loading, error } = useApi(() => learningApi.getTrack(id!), [id]);

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useApi<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = [],
): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const [refetchCount, setRefetchCount] = useState(0);
  const refetch = useCallback(() => setRefetchCount(n => n + 1), []);

  useEffect(() => {
    mountedRef.current = true;
    // Reset before async fetch — idiomatic pattern, not a cascading-render risk
    // Reset before async fetch — idiomatic pattern, not a cascading-render risk
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);

    fetcher()
      .then((result) => {
        if (mountedRef.current) {
          setData(result);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (mountedRef.current) {
          setError(err?.message ?? 'Something went wrong');
          setLoading(false);
        }
      });

    return () => {
      mountedRef.current = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, refetchCount]);

  return { data, loading, error, refetch };
}

/** Dev mode check — when true, pages should gracefully fall back to demo data. */
export const IS_DEV = import.meta.env.DEV;
export const DEV_TOKEN = typeof localStorage !== 'undefined' ? localStorage.getItem('bc_token') : null;
export const IS_DEV_MODE = IS_DEV && DEV_TOKEN === 'dev';
