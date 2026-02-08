import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppStore } from '@/types/store';
import { getTheme, setTheme } from '@/components/theme-provider';

const createInitialPaginationState = () => ({
  pageToken: null as string | null,
  nextPageToken: null as string | null,
  hasMore: true,
  isLoading: false,
});

export const useAppStore = create<AppStore>()(
  persist(
    (set) => {
      // Initialize dark mode from stored theme
      const initialDarkMode = getTheme() === 'dark';

      return {
        // Initial state
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
        filters: {},

        pagination: {
          inbox: createInitialPaginationState(),
          sent: createInitialPaginationState(),
        },

        isLoading: false,
        isSending: false,

        lastSyncTime: null,
        hasNewEmails: false,

        darkMode: initialDarkMode,

      // Actions
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setAccessToken: (token) => set({ accessToken: token }),

      logout: () => set({
        user: null,
        isAuthenticated: false,
        accessToken: null,
        emails: { inbox: [], sent: [] },
      }),

      setCurrentView: (view) => set({ currentView: view }),
      setSelectedEmailId: (id) => set({ selectedEmailId: id }),
      setActiveThread: (thread) => set({ activeThread: thread }),

      setEmails: (type, emails) =>
        set((state) => ({
          emails: { ...state.emails, [type]: emails },
        })),

      addEmail: (type, email) =>
        set((state) => ({
          emails: {
            ...state.emails,
            [type]: [email, ...state.emails[type]],
          },
        })),

      updateEmail: (id, updates) =>
        set((state) => ({
          emails: {
            inbox: state.emails.inbox.map((e) =>
              e.id === id ? { ...e, ...updates } : e
            ),
            sent: state.emails.sent.map((e) =>
              e.id === id ? { ...e, ...updates } : e
            ),
          },
        })),

      deleteEmail: (id) =>
        set((state) => ({
          emails: {
            inbox: state.emails.inbox.filter((e) => e.id !== id),
            sent: state.emails.sent.filter((e) => e.id !== id),
          },
        })),

      setFilters: (filters) => set({ filters }),
      clearFilters: () => set({ filters: {} }),

      setIsLoading: (loading) => set({ isLoading: loading }),
      setIsSending: (sending) => set({ isSending: sending }),

      setLastSyncTime: (time) => set({ lastSyncTime: time }),
      setHasNewEmails: (hasNew) => set({ hasNewEmails: hasNew }),

      toggleDarkMode: () => {
        const currentState = getTheme() === 'dark'
        const newTheme = currentState ? 'light' : 'dark'
        setTheme(newTheme)
        set({ darkMode: !currentState })
      },
      setDarkMode: (dark) => {
        setTheme(dark ? 'dark' : 'light')
        set({ darkMode: dark })
      },

      // Pagination actions
      setPagination: (type, updates) =>
        set((state) => ({
          pagination: {
            ...state.pagination,
            [type]: { ...state.pagination[type], ...updates },
          },
        })),

      resetPagination: (type) =>
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
      }),
    }
  )
);
