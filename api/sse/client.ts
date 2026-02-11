/**
 * SSE Client Hook for Email Notifications
 *
 * Provides a React hook for consuming the SSE endpoint and handling
 * real-time email notifications in the application.
 */

import { useEffect, useCallback, useRef, useState } from 'react';
import type {
  SSEEvent,
  SSEEventType,
  NewEmailData,
  EmailReadData,
  EmailSentData,
  ConnectionData,
} from './types';

/**
 * SSE Event Handler Type
 */
export type SSEEventHandler<T = unknown> = (event: SSEEvent<T>) => void;

/**
 * SSE Client Options
 */
export interface UseSSEOptions {
  /**
   * URL of the SSE endpoint
   * @default '/api/sse/notifications'
   */
  url?: string;

  /**
   * Whether to automatically connect
   * @default true
   */
  autoConnect?: boolean;

  /**
   * Reconnection attempt delay in ms
   * @default 3000
   */
  reconnectInterval?: number;

  /**
   * Maximum reconnection attempts (-1 for infinite)
   * @default -1
   */
  maxReconnectAttempts?: number;

  /**
   * Event handlers for specific event types
   */
  onNewEmail?: SSEEventHandler<NewEmailData>;
  onEmailRead?: SSEEventHandler<EmailReadData>;
  onEmailSent?: SSEEventHandler<EmailSentData>;
  onConnection?: SSEEventHandler<ConnectionData>;

  /**
   * Generic handler for all events
   */
  onEvent?: SSEEventHandler;

  /**
   * Error handler
   */
  onError?: (error: Event) => void;

  /**
   * Connection state change handler
   */
  onConnectionChange?: (connected: boolean) => void;
}

/**
 * SSE Client State
 */
export interface SSEClientState {
  connected: boolean;
  connecting: boolean;
  error: Error | null;
  clientId: string | null;
}

/**
 * React hook for SSE connection
 *
 * @example
 * ```tsx
 * const { connected, clientId } = useSSE({
 *   onNewEmail: (event) => {
 *     console.log('New email:', event.data);
 *     // Update UI with new email
 *   },
 *   onConnectionChange: (connected) => {
 *     console.log('Connection status:', connected);
 *   },
 * });
 * ```
 */
export function useSSE(options: UseSSEOptions = {}) {
  const {
    url = '/api/sse/notifications',
    autoConnect = true,
    reconnectInterval = 3000,
    maxReconnectAttempts = -1,
    onNewEmail,
    onEmailRead,
    onEmailSent,
    onConnection,
    onEvent,
    onError,
    onConnectionChange,
  } = options;

  const [state, setState] = useState<SSEClientState>({
    connected: false,
    connecting: false,
    error: null,
    clientId: null,
  });

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Connect to SSE endpoint
   */
  const connect = useCallback(() => {
    if (eventSourceRef.current?.readyState === EventSource.OPEN) {
      return; // Already connected
    }

    // Clear any pending reconnection
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    setState((prev) => ({ ...prev, connecting: true, error: null }));

    try {
      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      // Connection opened
      eventSource.onopen = () => {
        setState((prev) => ({
          ...prev,
          connected: true,
          connecting: false,
          error: null,
        }));
        reconnectAttemptsRef.current = 0;
        onConnectionChange?.(true);
      };

      // Generic message handler (for messages without specific event type)
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as SSEEvent;
          onEvent?.(data);
        } catch (error) {
          console.error('Failed to parse SSE message:', error);
        }
      };

      // Error handler
      eventSource.onerror = (error) => {
        setState((prev) => ({
          ...prev,
          connected: false,
          connecting: false,
          error: error instanceof Error ? error : new Error('SSE connection error'),
        }));
        onConnectionChange?.(false);
        onError?.(error);

        // Attempt reconnection
        if (
          maxReconnectAttempts === -1 ||
          reconnectAttemptsRef.current < maxReconnectAttempts
        ) {
          reconnectAttemptsRef.current++;
          reconnectTimeoutRef.current = setTimeout(() => {
            eventSource.close();
            connect();
          }, reconnectInterval);
        } else {
          eventSource.close();
        }
      };

      // New email event
      eventSource.addEventListener('new_email', (event) => {
        try {
          const data = JSON.parse(event.data) as SSEEvent<NewEmailData>;
          onNewEmail?.(data);
          onEvent?.(data);
        } catch (error) {
          console.error('Failed to parse new_email event:', error);
        }
      });

      // Email read event
      eventSource.addEventListener('email_read', (event) => {
        try {
          const data = JSON.parse(event.data) as SSEEvent<EmailReadData>;
          onEmailRead?.(data);
          onEvent?.(data);
        } catch (error) {
          console.error('Failed to parse email_read event:', error);
        }
      });

      // Email sent event
      eventSource.addEventListener('email_sent', (event) => {
        try {
          const data = JSON.parse(event.data) as SSEEvent<EmailSentData>;
          onEmailSent?.(data);
          onEvent?.(data);
        } catch (error) {
          console.error('Failed to parse email_sent event:', error);
        }
      });

      // Connection status event
      eventSource.addEventListener('connection', (event) => {
        try {
          const data = JSON.parse(event.data) as SSEEvent<ConnectionData>;
          if (data.data.status === 'connected' && data.data.clientId) {
            setState((prev) => ({ ...prev, clientId: data.data.clientId ?? null }));
          }
          onConnection?.(data);
          onEvent?.(data);
        } catch (error) {
          console.error('Failed to parse connection event:', error);
        }
      });

    } catch (error) {
      setState((prev) => ({
        ...prev,
        connected: false,
        connecting: false,
        error: error instanceof Error ? error : new Error('Failed to create SSE connection'),
      }));
      onConnectionChange?.(false);
    }
  }, [
    url,
    reconnectInterval,
    maxReconnectAttempts,
    onNewEmail,
    onEmailRead,
    onEmailSent,
    onConnection,
    onEvent,
    onError,
    onConnectionChange,
  ]);

  /**
   * Disconnect from SSE endpoint
   */
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setState((prev) => ({
      ...prev,
      connected: false,
      connecting: false,
      clientId: null,
    }));
    onConnectionChange?.(false);
  }, [onConnectionChange]);

  /**
   * Reconnect to SSE endpoint
   */
  const reconnect = useCallback(() => {
    disconnect();
    connect();
  }, [disconnect, connect]);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect]); // Only run on mount/unmount

  return {
    ...state,
    connect,
    disconnect,
    reconnect,
  };
}

/**
 * Export types for external use
 */
export type {
  SSEEvent,
  SSEEventType,
  NewEmailData,
  EmailReadData,
  EmailSentData,
  ConnectionData,
};
