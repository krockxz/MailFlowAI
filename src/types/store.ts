import type { Email, FilterState, ViewType, UserProfile, PaginationState } from './email';

export interface SearchState {
  results: Email[];
  query: string;
  timestamp: number | null;
  isSearchMode: boolean;
}

export interface AppState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  accessToken: string | null;

  currentView: ViewType;
  selectedEmailId: string | null;
  activeThread: Email[] | null;

  emails: {
    inbox: Email[];
    sent: Email[];
  };
  filters: {
    inbox: FilterState;
    sent: FilterState;
  };

  pagination: PaginationState;

  search: SearchState;

  isLoading: boolean;
  isSending: boolean;

  lastSyncTime: Date | null;

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

export interface AppActions {
  setUser: (user: UserProfile | null) => void;
  setAccessToken: (token: string | null) => void;
  setIsAuthenticated: (isAuthenticated: boolean) => void;
  logout: () => void;

  setCurrentView: (view: ViewType) => void;
  setSelectedEmailId: (id: string | null) => void;
  setActiveThread: (thread: Email[] | null) => void;

  setEmails: (type: 'inbox' | 'sent', emails: Email[]) => void;
  updateEmail: (id: string, updates: Partial<Email>) => void;

  setFilters: (filters: FilterState) => void;
  clearFilters: () => void;
  getCurrentFilters: () => FilterState;

  setSearchResults: (results: Email[], query: string) => void;
  clearSearch: () => void;

  setIsLoading: (loading: boolean) => void;
  setIsSending: (sending: boolean) => void;

  setLastSyncTime: (time: Date) => void;

  setCompose: (compose: {
    isOpen: boolean;
    to: string;
    subject: string;
    body: string;
    cc?: string;
    bcc?: string;
    isSending: boolean;
    isAIComposed: boolean;
  }) => void;
  resetCompose: () => void;

  setPagination: (type: 'inbox' | 'sent', updates: Partial<import('./email').FolderPaginationState>) => void;
  resetAllPagination: () => void;
}

export interface AppStore extends AppState, AppActions { }
