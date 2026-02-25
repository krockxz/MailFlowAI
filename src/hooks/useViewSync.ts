/**
 * Hook for synchronizing email data when view changes
 * Extracted from App.tsx for better organization
 */

import { useEffect, useRef } from 'react';
import { useAppStore } from '@/store';
import { useEmails } from './useEmails';

export function useViewSync() {
  const currentView = useAppStore((state) => state.currentView);
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  const { fetchInbox, fetchSent, resetAllPagination } = useEmails();
  const isFetchingRef = useRef(false);

  useEffect(() => {
    const fetchForView = async () => {
      if (!isAuthenticated || isFetchingRef.current) return;

      isFetchingRef.current = true;

      try {
        // Reset pagination when switching views
        resetAllPagination();

        if (currentView === 'inbox') {
          await fetchInbox();
        } else if (currentView === 'sent') {
          await fetchSent();
        }
      } finally {
        isFetchingRef.current = false;
      }
    };

    fetchForView();
  }, [currentView, isAuthenticated, fetchInbox, fetchSent, resetAllPagination]);
}
