import { useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '@/store';
import { useEmails } from './useEmails';
import { isAuthenticated } from '@/services/auth';

/**
 * Options for real-time email sync
 */
interface RealtimeSyncOptions {
  /**
   * Polling interval in milliseconds (default: 30000 = 30 seconds)
   * Use a shorter interval for more frequent updates
   */
  pollingInterval?: number;

  /**
   * Whether to enable automatic sync
   */
  enabled?: boolean;
}

/**
 * Hook for real-time email synchronization
 *
 * Note: True push notifications require a backend server for Gmail Pub/Sub webhooks.
 * This implementation uses polling as a client-side fallback.
 *
 * For full push notifications, you would need:
 * 1. A backend server (Node.js/Express, Cloud Functions, etc.)
 * 2. Google Cloud Pub/Sub topic
 * 3. Gmail watch API setup
 * 4. Webhook endpoint to receive push notifications
 */
export function useRealtimeEmailSync(options: RealtimeSyncOptions = {}) {
  const {
    pollingInterval = 30000,
    enabled = true,
  } = options;

  const { fetchInbox } = useEmails();
  const intervalRef = useRef<number | null>(null);
  const lastSyncTime = useRef<Date>(new Date());
  const previousEmailCount = useRef<number>(0);

  /**
   * Manual sync trigger
   */
  const sync = useCallback(async () => {
    if (!isAuthenticated()) {
      return;
    }

    try {
      await fetchInbox();

      // Check if new emails arrived since last sync
      const currentEmails = useAppStore.getState().emails.inbox;
      const newCount = currentEmails.length;

      if (newCount > previousEmailCount.current) {
        // New emails detected
        const newEmails = newCount - previousEmailCount.current;

        // Show browser notification if permitted
        if (Notification.permission === 'granted') {
          new Notification('New Email', {
            body: `You have ${newEmails} new email${newEmails > 1 ? 's' : ''}`,
            icon: '/vite.svg',
          });
        }

        useAppStore.getState().setHasNewEmails(true);
      }

      previousEmailCount.current = newCount;
      lastSyncTime.current = new Date();
      useAppStore.getState().setLastSyncTime(lastSyncTime.current);
    } catch (error) {
      console.error('Sync failed:', error);
    }
  }, [fetchInbox]);

  /**
   * Set up automatic polling
   */
  useEffect(() => {
    if (!enabled || !isAuthenticated()) {
      return;
    }

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Initial sync
    sync();

    // Set up polling interval
    intervalRef.current = window.setInterval(() => {
      sync();
    }, pollingInterval);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, pollingInterval, sync]);

  /**
   * Time since last sync
   */
  const timeSinceLastSync = useCallback(() => {
    return Date.now() - lastSyncTime.current.getTime();
  }, []);

  /**
   * Check if sync is stale (older than 2x polling interval)
   */
  const isSyncStale = useCallback(() => {
    return timeSinceLastSync() > pollingInterval * 2;
  }, [pollingInterval, timeSinceLastSync]);

  return {
    sync,
    timeSinceLastSync,
    isSyncStale,
    lastSyncTime: lastSyncTime.current,
  };
}

/**
 * Hook for setting up Gmail watch (requires backend)
 *
 * This is a placeholder for the full implementation.
 * To enable true push notifications:
 *
 * 1. Create a Google Cloud Pub/Sub topic
 * 2. Set up a webhook endpoint on your server
 * 3. Call this function to start watching
 *
 * Backend webhook endpoint example (Node.js/Express):
 *
 * ```javascript
 * app.post('/api/webhook/gmail', async (req, res) => {
 *   const message = req.body.message;
 *   const data = JSON.parse(Buffer.from(message.data, 'base64').toString());
 *
 *   if (message.data) {
 *     // Handle new email notification
 *     // Emit to client via WebSocket or SSE
 *   }
 *
 *   res.status(200).send('OK');
 * });
 * ```
 */
export function useGmailWatch() {
  const startWatching = useCallback(async (topicName: string) => {
    // This would call your backend endpoint
    // which then calls Gmail watch API
    console.log('Starting Gmail watch for topic:', topicName);
  }, []);

  const stopWatching = useCallback(async () => {
    // This would call your backend endpoint
    // which then calls Gmail stop API
    console.log('Stopping Gmail watch');
  }, []);

  return { startWatching, stopWatching };
}
