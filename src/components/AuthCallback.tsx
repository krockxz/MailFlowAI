import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { exchangeCodeForToken } from '@/services/gmail/oauth';
import { getOAuthConfig } from '@/services/auth';
import { storeToken, setTimestamp } from '@/lib/token-storage';
import { useAppStore } from '@/store';

type CallbackStatus = 'loading' | 'success' | 'error';

interface CallbackError {
  code: string;
  message: string;
}

/**
 * AuthCallback Component
 *
 * Handles the OAuth 2.0 authorization code flow callback.
 * This component is mounted at /auth/callback when Google redirects
 * back to the app after user consent.
 *
 * Flow:
 * 1. Extract `code` and `state` from URL params
 * 2. Validate state (CSRF protection)
 * 3. Exchange authorization code for access/refresh tokens
 * 4. Store tokens in sessionStorage
 * 5. Update app authentication state
 * 6. Redirect to home page
 */
export function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<CallbackStatus>('loading');
  const [error, setError] = useState<CallbackError | null>(null);

  const setIsAuthenticated = useAppStore((state) => state.setIsAuthenticated);
  const setAccessToken = useAppStore((state) => state.setAccessToken);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Extract authorization code and state from URL
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const errorParam = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        // Handle OAuth errors returned by Google
        if (errorParam) {
          setError({
            code: errorParam,
            message: errorDescription || `OAuth error: ${errorParam}`,
          });
          setStatus('error');
          return;
        }

        // Validate authorization code presence
        if (!code) {
          setError({
            code: 'missing_code',
            message: 'No authorization code received from Google.',
          });
          setStatus('error');
          return;
        }

        // Validate state parameter (CSRF protection)
        const storedState = sessionStorage.getItem('oauth_state');
        const stateTimestamp = sessionStorage.getItem('oauth_timestamp');

        if (!storedState || !stateTimestamp) {
          setError({
            code: 'invalid_state',
            message: 'OAuth state mismatch. Please try signing in again.',
          });
          setStatus('error');
          return;
        }

        // Check state age (reject if older than 10 minutes for security)
        const stateAge = Date.now() - parseInt(stateTimestamp, 10);
        if (stateAge > 10 * 60 * 1000) {
          sessionStorage.removeItem('oauth_state');
          sessionStorage.removeItem('oauth_timestamp');
          setError({
            code: 'expired_state',
            message: 'Authorization session expired. Please try signing in again.',
          });
          setStatus('error');
          return;
        }

        // Verify state matches (prevent CSRF attacks)
        if (state !== storedState) {
          sessionStorage.removeItem('oauth_state');
          sessionStorage.removeItem('oauth_timestamp');
          setError({
            code: 'state_mismatch',
            message: 'Security verification failed. Please try signing in again.',
          });
          setStatus('error');
          return;
        }

        // Clear state after validation
        sessionStorage.removeItem('oauth_state');
        sessionStorage.removeItem('oauth_timestamp');

        // Exchange authorization code for tokens
        const config = getOAuthConfig();

        if (!config.clientId || !config.clientSecret) {
          setError({
            code: 'config_error',
            message: 'OAuth configuration is missing. Please check your environment variables.',
          });
          setStatus('error');
          return;
        }

        const tokens = await exchangeCodeForToken(code, config.clientId, config.clientSecret, config.redirectUri);

        // Store access token
        storeToken('access', tokens.access_token);
        setAccessToken(tokens.access_token);

        // Store refresh token if provided (not always returned by Google)
        if (tokens.refresh_token) {
          storeToken('refresh', tokens.refresh_token);
        }

        // Set token timestamp for expiration tracking
        setTimestamp(Date.now());

        // Update app authentication state
        setIsAuthenticated(true);

        setStatus('success');

        // Redirect to home page after short delay
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 500);

      } catch (err) {
        console.error('OAuth callback error:', err);
        setError({
          code: 'exchange_failed',
          message: err instanceof Error
            ? err.message
            : 'Failed to exchange authorization code for tokens.',
        });
        setStatus('error');
      }
    };

    handleCallback();
  }, [searchParams, navigate, setIsAuthenticated, setAccessToken]);

  // Render different UI based on status
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-neutral-300 border-t-neutral-900 dark:border-neutral-700 dark:border-t-neutral-100 mb-4" />
          <p className="text-neutral-600 dark:text-neutral-400 text-lg">
            Completing sign in...
          </p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 px-4">
        <div className="max-w-md w-full bg-white dark:bg-neutral-900 rounded-lg shadow-lg p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-red-600 dark:text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
              Sign In Failed
            </h1>
          </div>

          {error && (
            <div className="mb-6">
              <p className="text-neutral-600 dark:text-neutral-400 mb-2">
                {error.message}
              </p>
              {error.code !== 'missing_code' && error.code !== 'exchange_failed' && (
                <p className="text-sm text-neutral-500 dark:text-neutral-500">
                  Error code: {error.code}
                </p>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate('/', { replace: true })}
              className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-md hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors font-medium"
            >
              Go to Home
            </button>
            <button
              onClick={() => {
                sessionStorage.clear();
                navigate('/', { replace: true });
              }}
              className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-md hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Success state (briefly shown before redirect)
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
          <svg
            className="w-6 h-6 text-green-600 dark:text-green-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <p className="text-neutral-600 dark:text-neutral-400 text-lg">
          Signed in successfully
        </p>
      </div>
    </div>
  );
}
