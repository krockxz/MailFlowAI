'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { exchangeCodeForToken } from '@/services/gmail/oauth';
import { getOAuthConfig } from '@/services/auth';
import { storeToken, setTimestamp } from '@/lib/token-storage';
import { useAppStore } from '@/store';
import { createAuthError, logError } from '@/lib/errors';

type CallbackStatus = 'loading' | 'success' | 'error';

interface CallbackError {
  code: string;
  message: string;
}

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<CallbackStatus>('loading');
  const [error, setError] = useState<CallbackError | null>(null);

  const setIsAuthenticated = useAppStore((state) => state.setIsAuthenticated);
  const setAccessToken = useAppStore((state) => state.setAccessToken);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const errorParam = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        if (errorParam) {
          setError({
            code: errorParam,
            message: errorDescription || `OAuth error: ${errorParam}`,
          });
          setStatus('error');
          return;
        }

        if (!code) {
          setError({
            code: 'missing_code',
            message: 'No authorization code received from Google.',
          });
          setStatus('error');
          return;
        }

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

        sessionStorage.removeItem('oauth_state');
        sessionStorage.removeItem('oauth_timestamp');

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

        storeToken('access', tokens.access_token);
        setAccessToken(tokens.access_token);

        if (tokens.refresh_token) {
          storeToken('refresh', tokens.refresh_token);
        }

        setTimestamp(Date.now());
        setIsAuthenticated(true);
        setStatus('success');

        setTimeout(() => {
          router.replace('/');
        }, 500);

      } catch (err) {
        logError(createAuthError({
          userMessage: err instanceof Error
            ? err.message
            : 'Failed to exchange authorization code for tokens.',
          originalError: err instanceof Error ? err : undefined,
        }));
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
  }, [searchParams, router, setIsAuthenticated, setAccessToken]);

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
              <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Sign In Failed</h1>
          </div>

          {error && (
            <div className="mb-6">
              <p className="text-neutral-600 dark:text-neutral-400 mb-2">{error.message}</p>
              {error.code !== 'missing_code' && error.code !== 'exchange_failed' && (
                <p className="text-sm text-neutral-500 dark:text-neutral-500">Error code: {error.code}</p>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => router.replace('/')}
              className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-md hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors font-medium"
            >
              Go to Home
            </button>
            <button
              onClick={() => {
                sessionStorage.clear();
                router.replace('/');
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
          <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-neutral-600 dark:text-neutral-400 text-lg">Signed in successfully</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-neutral-300 border-t-neutral-900 dark:border-neutral-700 dark:border-t-neutral-100 mb-4" />
          <p className="text-neutral-600 dark:text-neutral-400 text-lg">Completing sign in...</p>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
