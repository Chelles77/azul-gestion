import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase';

interface CacheEntry {
  data: any;
  timestamp: number;
}

const dataCache = new Map<string, CacheEntry>();
const listeners = new Map<string, Set<() => void>>();
const CACHE_TTL = 60000; // 1 minute

export function useSharedData(key: string, fetcher: (supabase: any) => Promise<any>) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  // Subscribe to cache changes
  useEffect(() => {
    if (!listeners.has(key)) {
      listeners.set(key, new Set());
    }

    const callback = async () => {
      const cached = dataCache.get(key);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        setData(cached.data);
      } else {
        await refetch();
      }
    };

    listeners.get(key)!.add(callback);

    return () => {
      listeners.get(key)!.delete(callback);
    };
  }, [key]);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      const result = await fetcher(supabase);
      dataCache.set(key, {
        data: result,
        timestamp: Date.now()
      });
      setData(result);

      // Notify all listeners for this key
      listeners.get(key)?.forEach(listener => listener());
    } catch (error) {
      console.error(`Error fetching ${key}:`, error);
    } finally {
      setLoading(false);
    }
  }, [key, fetcher, supabase]);

  // Initial fetch
  useEffect(() => {
    const cached = dataCache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setData(cached.data);
      setLoading(false);
    } else {
      refetch();
    }
  }, [key, refetch]);

  return { data, loading, refetch };
}

// Invalidate cache for a specific key
export function invalidateCache(key: string) {
  dataCache.delete(key);
  listeners.get(key)?.forEach(listener => listener());
}

// Invalidate all caches
export function invalidateAllCaches() {
  dataCache.clear();
  listeners.forEach(listeners => {
    listeners.forEach(listener => listener());
  });
}
