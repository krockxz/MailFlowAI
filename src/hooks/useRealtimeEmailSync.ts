import { useEffect, useRef, useCallback, useState } from 'react';
import { useAppStore } from '@/store';
import { useEmails } from './useEmails';
import { isAuthenticated } from '@/services/auth';

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
  const eventSourceRef = useRef<EventSource | null>(null);
  const intervalRef = useRef<number | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const lastSyncTime = useRef<Date>(new Date());
  const [isConnected, setIsConnected] = useState(false);

  /**
   * Manual sync trigger
   */
  const sync = useCallback(async () => {
    if (!isAuthenticated()) {
      return;
    }

    try {
      await fetchInbox();
      lastSyncTime.current = new Date();
      useAppStore.getState().setLastSyncTime(lastSyncTime.current);
    } catch (error) {
      console.error('Sync failed:', error);
    }
  }, [fetchInbox]);

  /**
   * Connect to SSE endpoint with reconnection logic
   */
  const connect = useCallback(() => {
    if (!isAuthenticated()) {
      return;
    }

    // Clean up existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    // Build SSE URL - use the Gmail events endpoint which polls webhook
    const baseUrl = import.meta.env.VITE_API_URL || window.location.origin;
    const sseUrl = `${baseUrl}/api/sse/gmail-events`;

    try {
      const eventSource = new EventSource(sseUrl);
      eventSourceRef.current = eventSource;

      // Connection opened
      eventSource.onopen = () => {
        console.log('SSE connection established');
        setIsConnected(true);
        reconnectAttemptsRef.current = 0; // Reset reconnect counter on successful connection
      };

      // Handle new email events
      eventSource.addEventListener('email:new', () => {
        // Show browser notification
        if (Notification.permission === 'granted') {
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

        // EventSource will automatically attempt to reconnect, but we implement
        // additional exponential backoff logic for better control
        const eventSourceInstance = eventSourceRef.current;

        if (eventSourceInstance && eventSourceInstance.readyState === EventSource.CLOSED) {
          // Connection is closed, schedule reconnection with exponential backoff
          const delay = calculateReconnectDelay(reconnectAttemptsRef.current);
          console.log(`SSE connection closed. Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1})`);

          reconnectTimeoutRef.current = window.setTimeout(() => {
            reconnectAttemptsRef.current++;
            connect();
          }, delay);
        }
      };

    } catch (error) {
      console.error('Failed to initialize EventSource:', error);

      // If initialization fails, schedule reconnection attempt
      const delay = calculateReconnectDelay(reconnectAttemptsRef.current);
      reconnectTimeoutRef.current = window.setTimeout(() => {
        reconnectAttemptsRef.current++;
        connect();
      }, delay);
    }
  }, [sync]);

  /**
   * Set up SSE connection and fallback polling
   */
  useEffect(() => {
    if (!enabled || !isAuthenticated()) {
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
      // Close SSE connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }

      // Clear reconnection timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      // Clear polling interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, pollingInterval, sync, connect]);

  return {
    sync,
    isConnected,
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
