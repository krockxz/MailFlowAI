/**
 * Hook for resetting pagination when filters change
 * Extracted from App.tsx for better organization
 */

import { useEffect } from 'react';
import { useAppStore } from '@/store';

export function useFilterPaginationReset() {
  const currentFilters = useAppStore((state) => state.getCurrentFilters());
  const resetAllPagination = useAppStore((state) => state.resetAllPagination);

  useEffect(() => {
    // Only reset if we have active filters
    if (currentFilters && Object.keys(currentFilters).length > 0) {
      resetAllPagination();
    }
  }, [currentFilters, resetAllPagination]);
}
