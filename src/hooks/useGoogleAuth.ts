/**
 * Google OAuth Hook
 *
 * Handles OAuth login flow using authorization code flow with redirect.
 *
 * Flow:
 * 1. login() redirects to Google OAuth consent screen
 * 2. User approves app -> Google redirects to /auth/callback with authorization code
 * 3. AuthCallback component exchanges code for tokens and stores them
 * 4. AuthCallback redirects back to main app
 * 5. useBootstrapAuthAndInbox picks up stored tokens and initializes the app
 *
 * No fetching happens in this hook - it only initiates the OAuth redirect.
 * All post-auth initialization (profile fetch, inbox fetch) is handled by useBootstrapAuthAndInbox.
 */

import { useCallback, useMemo } from 'react';
import { useAppStore } from '@/store';
import { clearAllTokens } from '@/lib/token-storage';
import { initiateOAuth, getOAuthConfig } from '@/services/auth';

/**
 * Hook for Google OAuth authentication
 *
 * @returns {Object} Auth methods
 * @returns {Function} login - Initiates OAuth flow (redirects to Google)
 * @returns {Function} logout - Clears tokens and reloads app
 * @returns {boolean} isConfigured - Whether OAuth is properly configured
 */
export function useGoogleAuth() {
  const { logout: storeLogout } = useAppStore();

  /**
   * Check if OAuth is properly configured
   */
  const isConfigured = useMemo(() => {
    const config = getOAuthConfig();
    return Boolean(config.clientId && config.clientSecret);
  }, []);

  /**
   * Initiate OAuth login flow
   *
   * This function redirects the browser to Google's OAuth consent screen.
   * After user approval, Google will redirect to the configured redirect URI
   * with an authorization code, which is handled by the AuthCallback component.
   */
  const login = useCallback(() => {
    if (!isConfigured) {
      console.error('[useGoogleAuth] OAuth not configured. Missing VITE_GMAIL_CLIENT_ID or VITE_GMAIL_CLIENT_SECRET.');
      alert('OAuth is not configured. Please check your environment variables.');
      return;
    }

    try {
      initiateOAuth();
    } catch (error) {
      console.error('[useGoogleAuth] Failed to initiate OAuth:', error);
      alert('Failed to initiate login. Please try again.');
    }
  }, [isConfigured]);

  /**
   * Logout - Clear tokens and reload the app
   */
  const logout = useCallback(() => {
    clearAllTokens();
    storeLogout();
    // Reload to clear all in-memory state
    window.location.reload();
  }, [storeLogout]);

  return { login, logout, isConfigured };
}
