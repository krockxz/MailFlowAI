/**
 * Hook for bootstrapping authentication and fetching initial inbox
 * Extracted from App.tsx for better organization
 */

import { useEffect } from 'react';
import { useAppStore } from '@/store';
import { useEmails } from './useEmails';
import { getStoredAccessToken, isAuthenticated as checkIsAuthenticated, setTokenTimestamp } from '@/services/auth';

export function useBootstrapAuthAndInbox() {
  const { setUser, setAccessToken, emails } = useAppStore();
  const { fetchInbox } = useEmails();

  useEffect(() => {
    const checkAuth = async () => {
      const token = getStoredAccessToken();
      const hasValidToken = checkIsAuthenticated();

      // If persisted state says authenticated but no token exists, clear the state
      const store = useAppStore.getState();
      if (store.isAuthenticated && !hasValidToken) {
        store.setIsAuthenticated(false);
        store.setUser(null);
        store.setAccessToken(null);
        return;
      }

      // If token exists, verify and fetch user data
      if (hasValidToken && token) {
        setAccessToken(token);

        // Mark token as fresh (prevents immediate expiration)
        setTokenTimestamp();

        // Fetch user profile if not already loaded
        if (!store.user) {
          try {
            const { GmailService } = await import('@/services/gmail');
            const gmail = new GmailService(token);
            const profile = await gmail.getUserProfile();
            setUser({ emailAddress: profile.emailAddress });
            store.setIsAuthenticated(true);
          } catch (error) {
            console.error('Failed to fetch user profile:', error);
            store.setIsAuthenticated(false);
            store.setAccessToken(null);
            return;
          }
        } else {
          // User already persisted, just ensure auth state is correct
          store.setIsAuthenticated(true);
        }

        // Only fetch inbox if it's empty (avoid duplicate fetches)
        if (emails.inbox.length === 0) {
          await fetchInbox();
        }
      }
    };
    checkAuth();
  }, []); // Run once on mount only
}
