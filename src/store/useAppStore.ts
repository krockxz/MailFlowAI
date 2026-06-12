import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppStore } from '@/types/store';
import type { FilterState } from '@/types/email';

const createInitialPaginationState = () => ({
  pageToken: null as string | null,
  nextPageToken: null as string | null,
  hasMore: true,
  status: 'idle' as const,
  lastLoadedAt: null as number | null,
});

const initialComposeState: AppStore['compose'] = {
  isOpen: false,
  to: '',
  subject: '',
  body: '',
  cc: '',
  bcc: '',
  isSending: false,
  isAIComposed: false,
};

export const useAppStore = create<AppStore>()(
  persist(
    (set) => {
      return {
        user: null,
        isAuthenticated: false,
        accessToken: null,

        currentView: 'inbox',
        selectedEmailId: null,
        activeThread: null,

        emails: {
          inbox: [],
          sent: [],
        },
        filters: {
          inbox: {},
          sent: {},
        },

        pagination: {
          inbox: createInitialPaginationState(),
          sent: createInitialPaginationState(),
        },

        search: {
          results: [],
          query: '',
          timestamp: null,
          isSearchMode: false,
        },

        isLoading: false,
        isSending: false,

        compose: initialComposeState,

        lastSyncTime: null,

        sortOrder: 'newest',

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

        updateEmail: (id: string, updates: Partial<AppStore['emails']['inbox'][0]>) =>
          set((state) => {
            const inboxEmail = state.emails.inbox.find((e) => e.id === id);
            const sentEmail = state.emails.sent.find((e) => e.id === id);

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

            return state;
          }),

        getCurrentFilters: (): FilterState => {
          const state = useAppStore.getState();
          const view = state.currentView;
          if (view === 'inbox') return state.filters.inbox;
          if (view === 'sent') return state.filters.sent;
          return {};
        },

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

        setIsLoading: (loading: boolean) => set({ isLoading: loading }),
        setIsSending: (sending: boolean) => set({ isSending: sending }),

        setLastSyncTime: (time: Date) => set({ lastSyncTime: time }),

        setSortOrder: (order: AppStore['sortOrder']) => set({ sortOrder: order }),

        setCompose: (compose: AppStore['compose']) => set({ compose }),
        resetCompose: () => set({ compose: initialComposeState }),

        setPagination: (type: 'inbox' | 'sent', updates: Partial<AppStore['pagination']['inbox']>) =>
          set((state) => ({
            pagination: {
              ...state.pagination,
              [type]: { ...state.pagination[type], ...updates },
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
      }),
      skipHydration: true,
    }
  )
);
