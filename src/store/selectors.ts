/**
 * Query Layer - Centralized Selectors
 *
 * This module provides a clean, centralized query layer for accessing Zustand store state.
 * All components should use these selector hooks instead of directly accessing the store.
 */

import { useMemo } from 'react';
import { useAppStore } from './useAppStore';
import type { Email, FilterState } from '@/types/email';
import { isWithinRange } from '@/lib/utils';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type StoreState = ReturnType<typeof useAppStore.getState>;

// ============================================================================
// RAW SELECTORS - Simple state access functions
// ============================================================================

export const selectUser = (state: StoreState) => state.user;
export const selectIsAuthenticated = (state: StoreState) => state.isAuthenticated;
export const selectAccessToken = (state: StoreState) => state.accessToken;
export const selectCurrentView = (state: StoreState) => state.currentView;
export const selectSelectedEmailId = (state: StoreState) => state.selectedEmailId;
export const selectActiveThread = (state: StoreState) => state.activeThread;
export const selectAllEmails = (state: StoreState) => state.emails;
export const selectInboxEmails = (state: StoreState) => state.emails.inbox;
export const selectSentEmails = (state: StoreState) => state.emails.sent;
export const selectAllFilters = (state: StoreState) => state.filters;
export const selectCurrentFilters = (state: StoreState): FilterState => {
  const view = state.currentView;
  if (view === 'inbox') return state.filters.inbox;
  if (view === 'sent') return state.filters.sent;
  return {};
};
export const selectAllPagination = (state: StoreState) => state.pagination;
export const selectCurrentPagination = (state: StoreState) => {
  const view = state.currentView;
  if (view === 'inbox') return state.pagination.inbox;
  if (view === 'sent') return state.pagination.sent;
  return undefined;
};
export const selectIsLoading = (state: StoreState) => state.isLoading;
export const selectIsSending = (state: StoreState) => state.isSending;
export const selectLastSyncTime = (state: StoreState) => state.lastSyncTime;
export const selectHasNewEmails = (state: StoreState) => state.hasNewEmails;
export const selectDarkMode = (state: StoreState) => state.darkMode;
export const selectCompose = (state: StoreState) => state.compose;

// ============================================================================
// COMPUTED SELECTORS - Derived state with logic
// ============================================================================

export const selectFilteredEmails = (
  emails: Email[],
  filters: FilterState
): Email[] => {
  if (!filters || Object.keys(filters).length === 0) {
    return emails;
  }

  return emails.filter((email: Email) => {
    if (filters.query) {
      const query = filters.query.toLowerCase();
      const subjectMatch = email.subject.toLowerCase().includes(query);
      const bodyMatch = email.body.toLowerCase().includes(query);
      const fromMatch = email.from.email.toLowerCase().includes(query) ||
                       (email.from.name && email.from.name.toLowerCase().includes(query));
      if (!subjectMatch && !bodyMatch && !fromMatch) {
        return false;
      }
    }

    if (filters.sender) {
      const sender = filters.sender.toLowerCase();
      const matchesEmail = email.from.email.toLowerCase().includes(sender);
      const matchesName = email.from.name && email.from.name.toLowerCase().includes(sender);
      if (!matchesEmail && !matchesName) {
        return false;
      }
    }

    if (filters.isUnread !== undefined && email.isUnread !== filters.isUnread) {
      return false;
    }

    if (filters.dateFrom || filters.dateTo) {
      if (!isWithinRange(email.date, filters.dateFrom, filters.dateTo)) {
        return false;
      }
    }

    return true;
  });
};

export const selectUnreadCount = (emails: Email[]): number => {
  return emails.filter((e) => e.isUnread).length;
};

export const selectEmailById = (
  allEmails: { inbox: Email[]; sent: Email[] },
  id: string
): Email | null => {
  return [...allEmails.inbox, ...allEmails.sent].find((e) => e.id === id) || null;
};

export const selectCurrentViewEmails = (
  currentView: string,
  emails: { inbox: Email[]; sent: Email[] }
): Email[] => {
  if (currentView === 'inbox') return emails.inbox;
  if (currentView === 'sent') return emails.sent;
  return [];
};

// ============================================================================
// REACT HOOKS - Selector hooks for components
// ============================================================================

export function useUser() {
  return useAppStore(selectUser);
}

export function useIsAuthenticated() {
  return useAppStore(selectIsAuthenticated);
}

export function useAccessToken() {
  return useAppStore(selectAccessToken);
}

export function useCurrentView() {
  return useAppStore(selectCurrentView);
}

export function useSelectedEmailId() {
  return useAppStore(selectSelectedEmailId);
}

export function useActiveThread() {
  return useAppStore(selectActiveThread);
}

export function useAllEmails() {
  return useAppStore(selectAllEmails);
}

export function useInboxEmails() {
  return useAppStore(selectInboxEmails);
}

export function useSentEmails() {
  return useAppStore(selectSentEmails);
}

export function useCurrentFilters(): FilterState {
  return useAppStore(selectCurrentFilters);
}

export function useCurrentPagination() {
  return useAppStore(selectCurrentPagination);
}

export function useIsLoading() {
  return useAppStore(selectIsLoading);
}

export function useIsSending() {
  return useAppStore(selectIsSending);
}

export function useLastSyncTime() {
  return useAppStore(selectLastSyncTime);
}

export function useHasNewEmails() {
  return useAppStore(selectHasNewEmails);
}

export function useDarkMode() {
  return useAppStore(selectDarkMode);
}

export function useCompose() {
  return useAppStore(selectCompose);
}

// ============================================================================
// COMPUTED HOOKS - Hooks with derived state
// ============================================================================

export function useCurrentViewEmails(): Email[] {
  const currentView = useCurrentView();
  const emails = useAllEmails();

  return useMemo(() => {
    return selectCurrentViewEmails(currentView, emails);
  }, [currentView, emails]);
}

export function useFilteredEmails(): Email[] {
  const currentViewEmails = useCurrentViewEmails();
  const filters = useCurrentFilters();

  return useMemo(() => {
    return selectFilteredEmails(currentViewEmails, filters);
  }, [currentViewEmails, filters]);
}

export function useSelectedEmail(): Email | null {
  const selectedId = useSelectedEmailId();
  const filteredEmails = useFilteredEmails();

  return useMemo(() => {
    if (!selectedId) return null;
    return filteredEmails.find((e) => e.id === selectedId) || null;
  }, [selectedId, filteredEmails]);
}

export function useUnreadCount(): number {
  const inboxEmails = useInboxEmails();

  return useMemo(() => {
    return selectUnreadCount(inboxEmails);
  }, [inboxEmails]);
}

export function useEmailById(id: string | null): Email | null {
  const allEmails = useAllEmails();

  return useMemo(() => {
    if (!id) return null;
    return selectEmailById(allEmails, id);
  }, [allEmails, id]);
}

export function useHasActiveFilters(): boolean {
  const filters = useCurrentFilters();

  return useMemo(() => {
    return !!(
      filters.query ||
      filters.sender ||
      filters.isUnread !== undefined ||
      filters.dateFrom ||
      filters.dateTo
    );
  }, [filters]);
}

export function useActiveFilterCount(): number {
  const filters = useCurrentFilters();

  return useMemo(() => {
    return [
      filters.query,
      filters.sender,
      filters.isUnread !== undefined,
      filters.dateFrom,
      filters.dateTo
    ].filter(Boolean).length;
  }, [filters]);
}
