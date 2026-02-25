/**
 * Hook for resetting pagination when filters change
 */

import { useEffect } from 'react';
import { useAppStore } from '@/store';

export function useFilterPaginationReset() {
  const resetAllPagination = useAppStore((state) => state.resetAllPagination);

  // Select both filter objects - Zustand only notifies when they actually change
  const filters = useAppStore((state) => state.filters);

  useEffect(() => {
    // Reset when either inbox or sent filters change and have active values
    const hasActiveInbox = Object.values(filters.inbox).some(v => v);
    const hasActiveSent = Object.values(filters.sent).some(v => v);
    if (hasActiveInbox || hasActiveSent) {
      resetAllPagination();
    }
  }, [filters, resetAllPagination]);
}
