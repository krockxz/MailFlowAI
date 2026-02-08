import { useEffect, useRef, useCallback, useState } from 'react';
import { useAppStore } from '@/store';
import { useEmails } from './useEmails';
import { isAuthenticated } from '@/services/auth';
import { io, Socket } from 'socket.io-client';

/**
 * Options for real-time email sync
 */
interface RealtimeSyncOptions {
  /**
   * Polling interval in milliseconds (default: 30000 = 30 seconds)
   * used as fallback if WebSocket is not connected
   */
  pollingInterval?: number;

  /**
   * Whether to enable automatic sync
   */
  enabled?: boolean;
}

/**
 * Hook for real-time email synchronization using WebSockets (Socket.io)
 * with polling fallback.
 */
export function useRealtimeEmailSync(options: RealtimeSyncOptions = {}) {
  const {
    pollingInterval = 30000,
    enabled = true,
  } = options;

  const { fetchInbox } = useEmails();
  const socketRef = useRef<Socket | null>(null);
  const intervalRef = useRef<number | null>(null);
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
      console.log('Syncing emails...');
      await fetchInbox();
      lastSyncTime.current = new Date();
      useAppStore.getState().setLastSyncTime(lastSyncTime.current);
    } catch (error) {
      console.error('Sync failed:', error);
    }
  }, [fetchInbox]);

  /**
   * Set up WebSocket connection and fallback polling
   */
  useEffect(() => {
    if (!enabled || !isAuthenticated()) {
      return;
    }

    // Initial sync
    sync();

    // Connect to WebSocket server
    // Assuming the server is running on the same host but port 8080
    // In production, this would be an environment variable
    const socketUrl = 'http://localhost:8080';

    try {
      socketRef.current = io(socketUrl, {
        reconnectionDelayMax: 10000,
      });

      socketRef.current.on('connect', () => {
        console.log('Connected to real-time sync server');
        setIsConnected(true);
      });

      socketRef.current.on('disconnect', () => {
        console.log('Disconnected from real-time sync server');
        setIsConnected(false);
      });

      socketRef.current.on('email:new', (data) => {
        console.log('New email notification received:', data);

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

    } catch (error) {
      console.error('Failed to initialize Socket.io:', error);
    }

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Set up polling interval (as backup or if socket fails)
    intervalRef.current = window.setInterval(() => {
      // Only poll if not connected to socket, or just as a safety net every 30s
      // Here we poll anyway to be safe, but you could make it conditional
      sync();
    }, pollingInterval);

    // Cleanup
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, pollingInterval, sync]);

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
  const startWatching = useCallback(async (topicName: string) => {
    // In a real app, this would call the backend to set up the watch
    console.log('Starting Gmail watch for topic:', topicName);
  }, []);

  const stopWatching = useCallback(async () => {
    console.log('Stopping Gmail watch');
  }, []);

  return { startWatching, stopWatching };
}
