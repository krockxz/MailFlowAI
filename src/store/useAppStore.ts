import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppStore } from '@/types/store';
import type { FilterState } from '@/types/email';
import { getTheme, setTheme } from '@/components/theme-provider';

const createInitialPaginationState = () => ({
  pageToken: null as string | null,
  nextPageToken: null as string | null,
  hasMore: true,
  status: 'idle' as const,
  lastLoadedAt: null as number | null,
});

export const useAppStore = create<AppStore>()(
  persist(
    (set) => {
      // Initialize dark mode from stored theme
      const initialDarkMode = getTheme() === 'dark';

      return {
        // Initial state - using 'as' to satisfy type checker
        user: null as AppStore['user'],
        isAuthenticated: false,
        accessToken: null,

        currentView: 'inbox',
        selectedEmailId: null,
        activeThread: null,

        emails: {
          inbox: [],
          sent: [],
        },
        // Per-view filters - each view maintains its own filter state
        filters: {
          inbox: {} as FilterState,
          sent: {} as FilterState,
        } as AppStore['filters'],

        pagination: {
          inbox: createInitialPaginationState(),
          sent: createInitialPaginationState(),
        } as AppStore['pagination'],

        search: {
          results: [],
          query: '',
          timestamp: null,
          isSearchMode: false,
        } as AppStore['search'],

        isLoading: false,
        isSending: false,

        // Compose state (single source of truth)
        compose: {
          isOpen: false,
          to: '',
          subject: '',
          body: '',
          cc: '',
          bcc: '',
          isSending: false,
          isAIComposed: false,
        } as AppStore['compose'],

        lastSyncTime: null as AppStore['lastSyncTime'],
        hasNewEmails: false,

        darkMode: initialDarkMode,

        // Actions
        setUser: (user: AppStore['user']) => set({ user, isAuthenticated: !!user }),
        setAccessToken: (token: string | null) => set({ accessToken: token }),
        setIsAuthenticated: (isAuthenticated: boolean) => set({ isAuthenticated }),

        logout: () => set({
          user: null,
          isAuthenticated: false,
          accessToken: null,
          emails: { inbox: [], sent: [] },
        }),

        setCurrentView: (view: AppStore['currentView']) => set({ currentView: view, selectedEmailId: null }),
        setSelectedEmailId: (id: string | null) => set({ selectedEmailId: id }),
        setActiveThread: (thread: AppStore['activeThread']) => set({ activeThread: thread }),

        setEmails: (type: 'inbox' | 'sent', emails: AppStore['emails']['inbox']) =>
          set((state) => ({
            emails: { ...state.emails, [type]: emails },
          })),

        addEmail: (type: 'inbox' | 'sent', email: AppStore['emails']['inbox'][0]) =>
          set((state) => ({
            emails: {
              ...state.emails,
              [type]: [email, ...state.emails[type]],
            },
          })),

        updateEmail: (id: string, updates: Partial<AppStore['emails']['inbox'][0]>) =>
          set((state) => {
            // Find which folder contains the email
            const inboxEmail = state.emails.inbox.find((e) => e.id === id);
            const sentEmail = state.emails.sent.find((e) => e.id === id);

            // Only update the folder that contains the email
            if (inboxEmail) {
              return {
                emails: {
                  ...state.emails,
                  inbox: state.emails.inbox.map((e) =>
                    e.id === id ? { ...e, ...updates } : e
                  ),
                },
              };
            }

            if (sentEmail) {
              return {
                emails: {
                  ...state.emails,
                  sent: state.emails.sent.map((e) =>
                    e.id === id ? { ...e, ...updates } : e
                  ),
                },
              };
            }

            // Email not found in either folder, return state unchanged
            return state;
          }),

        deleteEmail: (id: string) =>
          set((state) => ({
            emails: {
              inbox: state.emails.inbox.filter((e) => e.id !== id),
              sent: state.emails.sent.filter((e) => e.id !== id),
            },
          })),

        // Get the current view's filters
        getCurrentFilters: (): FilterState => {
          const state = useAppStore.getState();
          const view = state.currentView;
          if (view === 'inbox') return state.filters.inbox;
          if (view === 'sent') return state.filters.sent;
          return {};
        },

        // Set filters for the current view
        setFilters: (filters: FilterState) =>
          set((state) => {
            const view = state.currentView;
            if (view === 'inbox') {
              return { filters: { ...state.filters, inbox: filters } };
            }
            if (view === 'sent') {
              return { filters: { ...state.filters, sent: filters } };
            }
            return { filters: state.filters };
          }),

        // Set filters for a specific view
        setFiltersForView: (view: AppStore['currentView'], filters: FilterState) =>
          set((state) => {
            if (view === 'inbox') {
              return { filters: { ...state.filters, inbox: filters } };
            }
            if (view === 'sent') {
              return { filters: { ...state.filters, sent: filters } };
            }
            return state;
          }),

        clearFilters: () =>
          set((state) => {
            const view = state.currentView;
            if (view === 'inbox') {
              return { filters: { ...state.filters, inbox: {} } };
            }
            if (view === 'sent') {
              return { filters: { ...state.filters, sent: {} } };
            }
            return state;
          }),

        // Search actions
        setSearchResults: (results: AppStore['emails']['inbox'], query: string) =>
          set({
            search: {
              results,
              query,
              timestamp: Date.now(),
              isSearchMode: true,
            },
          }),

        clearSearch: () =>
          set({
            search: {
              results: [],
              query: '',
              timestamp: null,
              isSearchMode: false,
            },
          }),

        exitSearchMode: () =>
          set((state) => ({
            search: {
              ...state.search,
              isSearchMode: false,
            },
          })),

        setIsLoading: (loading: boolean) => set({ isLoading: loading }),
        setIsSending: (sending: boolean) => set({ isSending: sending }),

        setLastSyncTime: (time: Date) => set({ lastSyncTime: time }),
        setHasNewEmails: (hasNew: boolean) => set({ hasNewEmails: hasNew }),

        toggleDarkMode: () => {
          const currentState = getTheme() === 'dark'
          const newTheme = currentState ? 'light' : 'dark'
          setTheme(newTheme)
          set({ darkMode: !currentState })
        },
        setDarkMode: (dark: boolean) => {
          setTheme(dark ? 'dark' : 'light')
          set({ darkMode: dark })
        },

        // Compose actions
        setCompose: (compose: AppStore['compose']) => set({ compose }),
        resetCompose: () => set({
          compose: {
            isOpen: false,
            to: '',
            subject: '',
            body: '',
            cc: '',
            isSending: false,
            isAIComposed: false,
          },
        }),

        // Pagination actions
        setPagination: (type: 'inbox' | 'sent', updates: Partial<AppStore['pagination']['inbox']>) =>
          set((state) => ({
            pagination: {
              ...state.pagination,
              [type]: { ...state.pagination[type], ...updates },
            },
          })),

        resetPagination: (type: 'inbox' | 'sent') =>
          set((state) => ({
            pagination: {
              ...state.pagination,
              [type]: createInitialPaginationState(),
            },
          })),

        resetAllPagination: () =>
          set({
            pagination: {
              inbox: createInitialPaginationState(),
              sent: createInitialPaginationState(),
            },
          }),
      };
    },
    {
      name: 'ai-mail-app-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        darkMode: state.darkMode,
      }),
    }
  )
);
