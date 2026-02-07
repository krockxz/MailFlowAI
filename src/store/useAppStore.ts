import { create } from 'zustand';
import type { AppStore } from '@/types/store';

export const useAppStore = create<AppStore>((set) => ({
  // Initial state
  user: null,
  isAuthenticated: false,
  accessToken: null,

  currentView: 'inbox',
  selectedEmailId: null,

  emails: {
    inbox: [],
    sent: [],
  },
  filters: {},

  isLoading: false,
  isSending: false,

  lastSyncTime: null,
  hasNewEmails: false,

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
}));
