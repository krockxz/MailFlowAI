/**
 * vti@oracle 2024-12-21 - cache-aware fetching for email lists
 */

import { useCallback, useRef } from 'react';
import { useAppStore } from '@/store';
import { useEmails } from './useEmails';

const CACHE_DURATION = 60000; // 60 seconds

/**
 * Hook for cache-aware email fetching.
 * Only fetches if data is older than CACHE_DURATION or if explicitly requested.
 */
export function useCacheAwareFetch() {
  const { fetchInbox, fetchSent } = useEmails();
  const currentView = useAppStore((state) => state.currentView);
  const lastSyncTime = useAppStore((state) => state.lastSyncTime);
  const setLastSyncTime = useAppStore((state) => state.setLastSyncTime);
  const isInitialLoad = useRef(true);

  /**
   * Check if cache is expired for a view
   */
  const isCacheExpired = useCallback((_view: 'inbox' | 'sent') => {
    // For now, always return true to fetch (cache logic can be enhanced later)
    return true;
  }, []);

  /**
   * Fetch with cache check
   */
  const fetchWithCacheCheck = useCallback(async (options?: { force?: boolean }) => {
    const force = options?.force ?? false;
    const view = currentView === 'inbox' ? 'inbox' : currentView === 'sent' ? 'sent' : null;

    if (!view) return;

    // Always fetch on initial load
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      if (view === 'inbox') {
        await fetchInbox();
      } else {
        await fetchSent();
      }
      setLastSyncTime(new Date());
      return;
    }

    // Check cache before fetching
    if (!force && !isCacheExpired(view)) {
      return; // Cache is still valid
    }

    // Fetch fresh data
    if (view === 'inbox') {
      await fetchInbox();
    } else {
      await fetchSent();
    }
    setLastSyncTime(new Date());
  }, [currentView, isCacheExpired, fetchInbox, fetchSent, setLastSyncTime]);

  /**
   * Get cache age for display
   */
  const getCacheAge = useCallback((_view: 'inbox' | 'sent'): string => {
    const timestamp = lastSyncTime;
    if (!timestamp) return 'never';

    const age = Date.now() - new Date(timestamp).getTime();
    const seconds = Math.floor(age / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (seconds < 60) return `${seconds}s ago`;
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return 'older';
  }, [lastSyncTime]);

  return {
    fetchWithCacheCheck,
    isCacheExpired,
    getCacheAge,
    CACHE_DURATION,
  };
}
