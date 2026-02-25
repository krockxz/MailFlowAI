import { GmailService } from './gmail';
import {
  storeToken,
  getToken,
  getTimestamp,
  setTimestamp,
  clearAllTokens,
} from '@/lib/token-storage';

/**
 * OAuth configuration
 * These should be set in environment variables
 */
export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

/**
 * Get OAuth config from environment or defaults
 */
export function getOAuthConfig(): OAuthConfig {
  return {
    clientId: import.meta.env.VITE_GMAIL_CLIENT_ID || '',
    clientSecret: import.meta.env.VITE_GMAIL_CLIENT_SECRET || '',
    redirectUri: import.meta.env.VITE_GMAIL_REDIRECT_URI ||
      `${window.location.origin}/auth/callback`,
  };
}

/**
 * Generate random state for OAuth flow
 * Uses cryptographically secure random values for CSRF protection
 */
export function generateState(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Store OAuth state
 */
export function storeOAuthState(state: string): void {
  sessionStorage.setItem('oauth_state', state);
  sessionStorage.setItem('oauth_timestamp', Date.now().toString());
}

/**
 * Get stored access token
 * Refresh token is preferred if more recent than access token
 */
export function getStoredAccessToken(): string | null {
  // Logic simplified as token-storage only tracks one timestamp
  const token = getToken('access');
  return token || null;
}

/**
 * Set a fresh timestamp for the access token (marks it as valid)
 */
export function setTokenTimestamp(): void {
  const timestamp = Date.now();
  setTimestamp(timestamp);
}

/**
 * Check if token is expired (tokens expire in 1 hour)
 */
export function isTokenExpired(): boolean {
  const timestamp = getTimestamp();

  // If no timestamp stored, token is expired
  if (!timestamp) {
    return true;
  }

  // Token is expired if older than 55 minutes (1 hour)
  const age = Date.now() - Number(timestamp);
  return age > 55 * 60 * 1000;
}

/**
 * Initiate OAuth flow
 */
export function initiateOAuth(): void {
  const config = getOAuthConfig();
  const state = generateState();
  storeOAuthState(state);

  const authUrl = GmailService.getAuthUrl(
    config.clientId,
    config.redirectUri,
    state
  );

  window.location.href = authUrl;
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(): Promise<string> {
  const refreshToken = getToken('refresh');

  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const config = getOAuthConfig();
  const tokens = await GmailService.refreshToken(
    refreshToken,
    config.clientId,
    config.clientSecret
  );

  storeToken('access', tokens.access_token);
  // Gmail API replaces refresh token sometimes, but if not we keep the old one.
  // Assuming tokens object might have refresh_token
  if (tokens.refresh_token) {
    storeToken('refresh', tokens.refresh_token);
  }
  return tokens.access_token;
}

/**
 * Get valid access token (refreshing if necessary)
 */
export async function getValidAccessToken(): Promise<string> {
  const storedToken = getStoredAccessToken();

  if (!storedToken || isTokenExpired()) {
    return refreshAccessToken();
  }

  return storedToken;
}

/**
 * Check if user is authenticated
 * Returns true if user has a valid, non-expired access token
 */
export function isAuthenticated(): boolean {
  return !!getStoredAccessToken() && !isTokenExpired();
}

/**
 * Clear stored tokens (logout)
 * Also syncs with Zustand store to keep authentication state in sync
 */
export function clearTokens(): void {
  clearAllTokens();

  // Sync with store - set isAuthenticated to false when tokens are cleared
  import('@/store/useAppStore').then(({ useAppStore }) => {
    useAppStore.getState().setIsAuthenticated(false);
  });
}
