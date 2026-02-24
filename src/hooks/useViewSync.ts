/**
 * Hook for synchronizing email data when view changes
 * Extracted from App.tsx for better organization
 */

import { useEffect } from 'react';
import { useAppStore } from '@/store';
import { useEmails } from './useEmails';

export function useViewSync() {
  const currentView = useAppStore((state) => state.currentView);
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  const { fetchInbox, fetchSent, resetAllPagination } = useEmails();

  useEffect(() => {
    const fetchForView = async () => {
      if (!isAuthenticated) return;

      // Reset pagination when switching views
      resetAllPagination();

      if (currentView === 'inbox') {
        await fetchInbox();
      } else if (currentView === 'sent') {
        await fetchSent();
      }
    };

    fetchForView();
  }, [currentView, isAuthenticated, fetchInbox, fetchSent, resetAllPagination]);
}
