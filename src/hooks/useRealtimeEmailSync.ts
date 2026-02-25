import { useEffect, useRef, useCallback, useState } from 'react';
import { useAppStore } from '@/store';
import { useEmails } from './useEmails';
import { showInfo, showError } from '@/lib/toast';

/**
 * SSE connection error type
 */
interface SSEError extends Error {
  type?: 'connection' | 'authentication' | 'network' | 'unknown';
}

/**
 * Options for real-time email sync
 */
interface RealtimeSyncOptions {
  /**
   * Polling interval in milliseconds (default: 30000 = 30 seconds)
   * used as fallback if SSE is not connected
   */
  pollingInterval?: number;

  /**
   * Whether to enable automatic sync
   */
  enabled?: boolean;
}

/**
 * Reconnection configuration with exponential backoff
 */
const RECONNECT_CONFIG = {
  initialDelay: 1000,      // Start with 1 second
  maxDelay: 30000,         // Max 30 seconds
  backoffMultiplier: 1.5,  // Multiply delay by 1.5 each retry
  maxAttempts: Infinity,   // Keep trying forever
};

/**
 * Calculate next reconnection delay with exponential backoff
 */
function calculateReconnectDelay(attemptNumber: number): number {
  const delay = Math.min(
    RECONNECT_CONFIG.initialDelay * Math.pow(RECONNECT_CONFIG.backoffMultiplier, attemptNumber),
    RECONNECT_CONFIG.maxDelay
  );
  return delay;
}

/**
 * Hook for real-time email synchronization using Server-Sent Events (EventSource)
 * with polling fallback and exponential backoff reconnection.
 */
export function useRealtimeEmailSync(options: RealtimeSyncOptions = {}) {
  const {
    pollingInterval = 30000,
    enabled = true,
  } = options;

  const { fetchInbox } = useEmails();
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  const eventSourceRef = useRef<EventSource | null>(null);
  const intervalRef = useRef<number | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const lastSyncTime = useRef<Date>(new Date());
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<SSEError | null>(null);
  // Track if we've shown disconnection toast to avoid spamming
  const hasShownDisconnectToastRef = useRef(false);
  // Track if we were previously connected to show reconnection toast
  const wasConnectedRef = useRef(false);

  /**
   * Manual sync trigger
   */
  const sync = useCallback(async () => {
    if (!isAuthenticated) {
      return;
    }

    try {
      await fetchInbox();
      lastSyncTime.current = new Date();
      useAppStore.getState().setLastSyncTime(lastSyncTime.current);
    } catch (error) {
      console.error('Sync failed:', error);
    }
  }, [fetchInbox, isAuthenticated]);

  /**
   * Clean up all connection resources (EventSource and any pending timeouts)
   * This is called before creating new connections and during unmount
   */
  const cleanup = useCallback(() => {
    // Close SSE connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    // Clear any pending reconnection timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  /**
   * Connect to SSE endpoint with reconnection logic
   */
  const connect = useCallback(() => {
    if (!isAuthenticated) {
      return;
    }

    // Clean up existing connection AND any pending reconnection timeouts
    // This prevents memory leaks when connect() is called multiple times
    cleanup();

    // Build SSE URL - use the Gmail events endpoint which polls webhook
    const baseUrl = import.meta.env.VITE_API_URL || window.location.origin;
    const sseUrl = `${baseUrl}/api/sse/gmail-events`;

    try {
      const eventSource = new EventSource(sseUrl);
      eventSourceRef.current = eventSource;

      // Connection opened
      eventSource.onopen = () => {
        setIsConnected(true);
        setError(null); // Clear any previous errors
        reconnectAttemptsRef.current = 0; // Reset reconnect counter on successful connection
        hasShownDisconnectToastRef.current = false; // Reset disconnect toast flag

        // Show reconnection success toast if we were previously disconnected
        if (wasConnectedRef.current) {
          showInfo('Real-time sync reconnected');
        }
        wasConnectedRef.current = true;
      };

      // Handle new email events
      eventSource.addEventListener('email:new', () => {
        // Show browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('New Email Received', {
            body: 'A new email has arrived in your inbox.',
            icon: '/vite.svg',
          });
        }

        // Trigger sync immediately
        sync();
        useAppStore.getState().setHasNewEmails(true);
      });

      // Handle connection errors
      eventSource.onerror = (error) => {
        console.error('SSE connection error:', error);
        setIsConnected(false);

        // Create an error object with type information
        const sseError: SSEError = new Error('SSE connection failed');
        sseError.type = 'connection';
        setError(sseError);

        // Show user-facing toast notification (only once per disconnection event)
        if (!hasShownDisconnectToastRef.current) {
          showError(
            'Real-time sync disconnected. Using polling mode instead.',
            () => connect() // Allow manual retry via toast
          );
          hasShownDisconnectToastRef.current = true;
        }

        // EventSource will automatically attempt to reconnect, but we implement
        // additional exponential backoff logic for better control
        const eventSourceInstance = eventSourceRef.current;

        if (eventSourceInstance && eventSourceInstance.readyState === EventSource.CLOSED) {
          // Connection is closed, schedule reconnection with exponential backoff
          const delay = calculateReconnectDelay(reconnectAttemptsRef.current);

          // Clear any existing timeout before scheduling a new one
          // This prevents multiple timeouts from accumulating
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }

          reconnectTimeoutRef.current = window.setTimeout(() => {
            reconnectAttemptsRef.current++;
            setError(null); // Clear error on retry
            connect();
          }, delay);
        }
      };

    } catch (error) {
      console.error('Failed to initialize EventSource:', error);

      // If initialization fails, schedule reconnection attempt
      const delay = calculateReconnectDelay(reconnectAttemptsRef.current);

      // Clear any existing timeout before scheduling a new one
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      reconnectTimeoutRef.current = window.setTimeout(() => {
        reconnectAttemptsRef.current++;
        connect();
      }, delay);
    }
  }, [sync, isAuthenticated, cleanup]);

  /**
   * Set up SSE connection and fallback polling
   */
  useEffect(() => {
    if (!enabled || !isAuthenticated) {
      return;
    }

    // Initial sync
    sync();

    // Connect to SSE endpoint
    connect();

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Set up polling interval (as backup or if SSE fails)
    // This provides robustness by ensuring we sync even if SSE is down
    intervalRef.current = window.setInterval(() => {
      sync();
    }, pollingInterval);

    // Cleanup
    return () => {
      // Use the cleanup function to properly close SSE and clear timeouts
      cleanup();

      // Clear polling interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, pollingInterval, sync, connect, cleanup, isAuthenticated]);

  return {
    sync,
    isConnected,
    error,
    lastSyncTime: lastSyncTime.current,
  };
}

/**
 * Hook for setting up Gmail watch
 */
export function useGmailWatch() {
  const startWatching = useCallback(async (_topicName: string) => {
    // In a real app, this would call the backend to set up the watch
  }, []);

  const stopWatching = useCallback(async () => {
    // In a real app, this would call the backend to stop watching
  }, []);

  return { startWatching, stopWatching };
}
