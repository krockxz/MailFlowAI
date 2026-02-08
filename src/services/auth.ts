import { GmailService } from './gmail';
import {
  storeToken,
  getToken,
  setTimestamp,
  getTimestamp,
  clearAllTokens
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
 */
export function generateState(): string {
  return Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15);
}

/**
 * Store OAuth state in session storage
 */
export function storeOAuthState(state: string): void {
  sessionStorage.setItem('oauth_state', state);
  sessionStorage.setItem('oauth_timestamp', Date.now().toString());
}

/**
 * Verify OAuth state
 */
export function verifyOAuthState(state: string): boolean {
  const storedState = sessionStorage.getItem('oauth_state');
  const timestamp = sessionStorage.getItem('oauth_timestamp');

  if (!storedState || !timestamp) {
    return false;
  }

  // State should match and be less than 10 minutes old
  const age = Date.now() - parseInt(timestamp);
  if (age > 10 * 60 * 1000) {
    sessionStorage.removeItem('oauth_state');
    sessionStorage.removeItem('oauth_timestamp');
    return false;
  }

  return storedState === state;
}

/**
 * Clear OAuth state
 */
export function clearOAuthState(): void {
  sessionStorage.removeItem('oauth_state');
  sessionStorage.removeItem('oauth_timestamp');
}

/**
 * Handle OAuth callback
 */
export async function handleOAuthCallback(
  code: string,
  state: string
): Promise<{
  accessToken: string;
  refreshToken?: string;
  userProfile: { emailAddress: string };
}> {
  // Verify state
  if (!verifyOAuthState(state)) {
    throw new Error('Invalid OAuth state');
  }

  clearOAuthState();

  const config = getOAuthConfig();

  // Exchange code for tokens
  const tokens = await GmailService.exchangeCodeForToken(
    code,
    config.clientId,
    config.clientSecret,
    config.redirectUri
  );

  // Get user profile
  const gmail = new GmailService(tokens.access_token);
  const profile = await gmail.getUserProfile();

  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    userProfile: {
      emailAddress: profile.emailAddress,
    },
  };
}

/**
 * Store tokens using secure storage abstraction
 */
export function storeTokens(accessToken: string, refreshToken?: string): void {
  storeToken('access', accessToken);
  if (refreshToken) {
    storeToken('refresh', refreshToken);
  }
  setTimestamp(Date.now());
}

/**
 * Get stored access token
 */
export function getStoredAccessToken(): string | null {
  return getToken('access');
}

/**
 * Get stored refresh token
 */
export function getStoredRefreshToken(): string | null {
  return getToken('refresh');
}

/**
 * Check if token is expired (tokens expire in 1 hour)
 */
export function isTokenExpired(): boolean {
  const timestamp = getTimestamp();
  if (!timestamp) return true;

  const age = Date.now() - timestamp;
  // Consider expired after 55 minutes (token is valid for 1 hour)
  return age > 55 * 60 * 1000;
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(): Promise<string> {
  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const config = getOAuthConfig();
  const tokens = await GmailService.refreshToken(
    refreshToken,
    config.clientId,
    config.clientSecret
  );

  storeTokens(tokens.access_token, refreshToken);
  return tokens.access_token;
}

/**
 * Get valid access token, refreshing if necessary
 */
export async function getValidAccessToken(): Promise<string> {
  const storedToken = getStoredAccessToken();

  if (!storedToken || isTokenExpired()) {
    return refreshAccessToken();
  }

  return storedToken;
}

/**
 * Clear stored tokens (logout)
 */
export function clearTokens(): void {
  clearAllTokens();
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!getStoredAccessToken() && !isTokenExpired();
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
