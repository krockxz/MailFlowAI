/**
 * Shared testing utilities for component tests
 */

import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import type { Email, FilterState, FolderPaginationState } from '@/types/email';

/**
 * Mock email factory function
 */
export const createMockEmail = (overrides: Partial<Email> = {}): Email => ({
  id: 'mock-email-1',
  threadId: 'mock-thread-1',
  snippet: 'This is a test email snippet',
  subject: 'Test Email Subject',
  from: { name: 'Test User', email: 'test@example.com' },
  to: [{ email: 'recipient@example.com' }],
  date: new Date('2023-01-01T12:00:00Z'),
  body: 'This is the test email body content.',
  isUnread: false,
  labels: [],
  ...overrides,
});

/**
 * Create multiple mock emails
 */
export const createMockEmails = (count: number, overrides?: Partial<Email>): Email[] => {
  return Array.from({ length: count }, (_, i) =>
    createMockEmail({
      id: `mock-email-${i + 1}`,
      threadId: `mock-thread-${i + 1}`,
      subject: `Test Email Subject ${i + 1}`,
      ...overrides,
    })
  );
};

/**
 * Mock pagination state factory
 */
export const createMockPaginationState = (overrides: Partial<FolderPaginationState> = {}): FolderPaginationState => ({
  pageToken: null,
  nextPageToken: 'next-page-token',
  hasMore: true,
  isLoading: false,
  ...overrides,
});

/**
 * Mock filter state factory
 */
export const createMockFilterState = (overrides: Partial<FilterState> = {}): FilterState => ({
  query: '',
  sender: '',
  isUnread: undefined,
  ...overrides,
});

/**
 * Partial mock store state for Zustand
 */
export const mockStoreState = {
  user: null,
  isAuthenticated: false,
  accessToken: null,
  currentView: 'inbox' as const,
  selectedEmailId: null,
  activeThread: null,
  emails: { inbox: [], sent: [] },
  filters: {},
  pagination: {
    inbox: { pageToken: null, nextPageToken: null, hasMore: true, isLoading: false },
    sent: { pageToken: null, nextPageToken: null, hasMore: true, isLoading: false },
  },
  isLoading: false,
  isSending: false,
  lastSyncTime: null,
  hasNewEmails: false,
  darkMode: false,
};

/**
 * Mock useAppStore hook with custom state
 */
export const mockUseAppStore = (state: Partial<typeof mockStoreState> = {}) => ({
  ...mockStoreState,
  ...state,
});

/**
 * Custom render function with providers if needed
 */
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  // Add provider props here if needed in the future
}

export function renderWithProviders(
  ui: ReactElement,
  options?: CustomRenderOptions
) {
  return render(ui, options);
}

/**
 * Re-export testing library utilities
 */
export { render, screen, fireEvent, waitFor } from '@testing-library/react';
