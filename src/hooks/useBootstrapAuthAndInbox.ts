/**
 * Hook for bootstrapping authentication and fetching initial inbox
 * Handles initialization after OAuth callback redirect (authorization code flow)
 *
 * Flow:
 * 1. Check for existing valid token (stored after callback)
 * 2. Fetch user profile if missing
 * 3. Fetch initial inbox if needed
 * 4. Handle token expiry/invalidation gracefully
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAppStore } from '@/store';
import { useEmails } from './useEmails';
import {
  getStoredAccessToken,
  isAuthenticated as checkIsAuthenticated,
  setTokenTimestamp,
} from '@/services/auth';
import type { AppStore } from '@/types/store';

export interface BootstrapState {
  isInitializing: boolean;
  hasError: boolean;
  error?: Error;
}

/**
 * Result type for the bootstrap hook
 */
export interface BootstrapResult extends BootstrapState {
  retry: () => void;
}

/**
 * Token verification result
 */
interface TokenVerification {
  isValid: boolean;
  token: string | null;
  needsProfileFetch: boolean;
  needsInboxFetch: boolean;
}

/**
 * Verify stored token and determine what needs to be fetched
 */
function verifyToken(store: AppStore): TokenVerification {
  const token = getStoredAccessToken();
  const hasValidToken = checkIsAuthenticated();

  // If persisted state says authenticated but no valid token exists, clear the state
  if (store.isAuthenticated && !hasValidToken) {
    store.setIsAuthenticated(false);
    store.setUser(null);
    store.setAccessToken(null);
    return { isValid: false, token: null, needsProfileFetch: false, needsInboxFetch: false };
  }

  return {
    isValid: hasValidToken && !!token,
    token,
    needsProfileFetch: hasValidToken && !store.user,
    needsInboxFetch: hasValidToken && store.emails.inbox.length === 0,
  };
}

/**
 * Hook for bootstrapping authentication and initial data fetch
 *
 * This hook handles the post-OAuth callback initialization:
 * - After authorization code flow, tokens are already stored by AuthCallback
 * - This hook verifies the tokens and fetches user profile + initial inbox
 * - No duplicate fetching - checks state before making API calls
 */
export function useBootstrapAuthAndInbox(): BootstrapResult {
  const { setUser, setAccessToken, setIsAuthenticated } = useAppStore();
  const { fetchInbox } = useEmails();

  // Local state for bootstrap status
  const [state, setState] = useState<BootstrapState>({
    isInitializing: true,
    hasError: false,
  });

  // Track if bootstrap has completed to prevent re-running
  const hasBootstrapped = useRef(false);
  const retryCallback = useRef<(() => void) | null>(null);

  /**
   * Main bootstrap function - runs once on mount
   */
  const bootstrap = useCallback(async () => {
    // Skip if already bootstrapped
    if (hasBootstrapped.current) {
      return;
    }

    const store = useAppStore.getState();
    const verification = verifyToken(store);

    // If no valid token, we're done (user needs to log in)
    if (!verification.isValid) {
      setState({ isInitializing: false, hasError: false });
      hasBootstrapped.current = true;
      return;
    }

    // We have a valid token - set it in the store
    if (verification.token) {
      setAccessToken(verification.token);

      // Mark token as fresh (prevents immediate expiration check)
      setTokenTimestamp();
    }

    // Fetch user profile if needed
    if (verification.needsProfileFetch) {
      try {
        const { GmailService } = await import('@/services/gmail');
        const gmail = new GmailService(verification.token!);
        const profile = await gmail.getUserProfile();

        setUser({ emailAddress: profile.emailAddress });
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
        // Clear invalid tokens
        setIsAuthenticated(false);
        setUser(null);
        setAccessToken(null);
        setState({
          isInitializing: false,
          hasError: true,
          error: error instanceof Error ? error : new Error('Failed to fetch user profile'),
        });
        hasBootstrapped.current = true;
        return;
      }
    } else {
      // User already persisted, ensure auth state is correct
      setIsAuthenticated(true);
    }

    // Fetch initial inbox if needed (avoid duplicate fetches)
    if (verification.needsInboxFetch) {
      try {
        await fetchInbox();
      } catch (error) {
        console.error('Failed to fetch inbox:', error);
        // Don't fail completely - user can retry manually
        setState({
          isInitializing: false,
          hasError: true,
          error: error instanceof Error ? error : new Error('Failed to fetch inbox'),
        });
        hasBootstrapped.current = true;
        return;
      }
    }

    // Bootstrap complete
    setState({ isInitializing: false, hasError: false });
    hasBootstrapped.current = true;
  }, [setAccessToken, setUser, setIsAuthenticated, fetchInbox]);

  /**
   * Retry function - allows user to retry after error
   */
  const retry = useCallback(() => {
    hasBootstrapped.current = false;
    setState({ isInitializing: true, hasError: false });
    // bootstrap will run on next render due to state change
  }, []);

  // Store retry callback ref
  retryCallback.current = retry;

  // Run bootstrap on mount
  useEffect(() => {
    if (!hasBootstrapped.current && state.isInitializing) {
      bootstrap();
    }
  }, [state.isInitializing, bootstrap]);

  return {
    isInitializing: state.isInitializing,
    hasError: state.hasError,
    error: state.error,
    retry: retryCallback.current ?? retry,
  };
}
