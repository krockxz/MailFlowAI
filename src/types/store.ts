import type { Email, FilterState, ViewType, UserProfile, PaginationState } from './email';

/**
 * Main application state
 */
export interface AppState {
  // User authentication
  user: UserProfile | null;
  isAuthenticated: boolean;
  accessToken: string | null;

  // UI state
  currentView: ViewType;
  selectedEmailId: string | null;
  activeThread: Email[] | null;

  // Email data
  emails: {
    inbox: Email[];
    sent: Email[];
  };
  filters: FilterState;

  // Pagination state
  pagination: PaginationState;

  // Loading states
  isLoading: boolean;
  isSending: boolean;

  // Sync state
  lastSyncTime: Date | null;
  hasNewEmails: boolean;

  // Theme
  darkMode: boolean;

  // Compose state (single source of truth)
  compose: {
    isOpen: boolean;
    to: string;
    subject: string;
    body: string;
    cc?: string;
    bcc?: string;
    isSending: boolean;
    isAIComposed: boolean;
  };
}

/**
 * Store actions
 */
export interface AppActions {
  // Authentication
  setUser: (user: UserProfile | null) => void;
  setAccessToken: (token: string | null) => void;
  logout: () => void;

  // UI actions
  setCurrentView: (view: ViewType) => void;
  setSelectedEmailId: (id: string | null) => void;
  setActiveThread: (thread: Email[] | null) => void;

  // Email actions
  setEmails: (type: 'inbox' | 'sent', emails: Email[]) => void;
  addEmail: (type: 'inbox' | 'sent', email: Email) => void;
  updateEmail: (id: string, updates: Partial<Email>) => void;
  deleteEmail: (id: string) => void;

  // Filter actions
  setFilters: (filters: FilterState) => void;
  clearFilters: () => void;

  // Loading actions
  setIsLoading: (loading: boolean) => void;
  setIsSending: (sending: boolean) => void;

  // Sync actions
  setLastSyncTime: (time: Date) => void;
  setHasNewEmails: (hasNew: boolean) => void;

  // Theme actions
  toggleDarkMode: () => void;
  setDarkMode: (dark: boolean) => void;

  // Compose actions (single source of truth)
  setCompose: (compose: {
    isOpen: boolean;
    to: string;
    subject: string;
    body: string;
    cc?: string;
    isSending: boolean;
    isAIComposed: boolean;
  }) => void;
  resetCompose: () => void;

  // Pagination actions
  setPagination: (type: 'inbox' | 'sent', updates: Partial<import('./email').FolderPaginationState>) => void;
  resetPagination: (type: 'inbox' | 'sent') => void;
  resetAllPagination: () => void;
}

/**
 * Combined store interface
 */
export interface AppStore extends AppState, AppActions { }
