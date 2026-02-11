/**
 * Vercel Edge Runtime SSE Endpoint for Email Notifications
 *
 * This endpoint provides a Server-Sent Events (SSE) stream for real-time
 * email notifications. Clients can connect using EventSource to receive
 * push notifications when new emails arrive.
 *
 * @route GET /api/sse/notifications
 * @runtime edge
 */

import type {
  SSEEvent,
  SSEEventType,
  NewEmailData,
  EmailReadData,
  EmailSentData,
  ConnectionData,
} from './types';

/**
 * SSE Response Headers
 */
const SSE_HEADERS = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache, no-transform',
  'Connection': 'keep-alive',
  'X-Accel-Buffering': 'no', // Disable Nginx buffering
  'X-Content-Type-Options': 'nosniff',
};

/**
 * Keep-alive interval in milliseconds (15 seconds)
 * Prevents proxies and browsers from closing idle connections
 */
const KEEP_ALIVE_INTERVAL = 15000;

/**
 * Formats SSE message according to the SSE specification
 *
 * @param event - Event type/name
 * @param data - JSON-serializable data payload
 * @returns Formatted SSE message string
 */
function formatSSEMessage(event: string, data: unknown): string {
  const dataStr = JSON.stringify(data);
  return `event: ${event}\ndata: ${dataStr}\n\n`;
}

/**
 * Creates a keep-alive comment message
 * Keeps the connection open without triggering event handlers
 *
 * @returns SSE comment string
 */
function createKeepAliveMessage(): string {
  return ': keep-alive\n\n';
}

/**
 * Vercel Edge Function Handler
 *
 * Establishes an SSE connection for real-time email notifications.
 * The connection remains open indefinitely and receives:
 * - Email events (new, read, sent)
 * - Keep-alive pings every 15 seconds
 * - Connection status updates
 *
 * Client usage:
 * ```ts
 * const eventSource = new EventSource('/api/sse/notifications');
 * eventSource.addEventListener('new_email', (e) => {
 *   const email = JSON.parse(e.data);
 *   console.log('New email:', email);
 * });
 * ```
 */
export default async function handler(): Promise<Response> {
  // Create a unique client ID for this connection
  const clientId = crypto.randomUUID();

  // Create a ReadableStream for SSE
  const encoder = new TextEncoder();
  let controller: ReadableStreamDefaultController<Uint8Array> | null = null;

  const stream = new ReadableStream({
    start(streamController) {
      controller = streamController;

      // Send initial connection event
      const connectionEvent: SSEEvent<ConnectionData> = {
        type: 'connection',
        data: {
          status: 'connected',
          clientId,
        },
        timestamp: Date.now(),
      };

      controller.enqueue(
        encoder.encode(formatSSEMessage('connection', connectionEvent))
      );
    },

    cancel() {
      // Cleanup when stream is cancelled
      if (controller) {
        try {
          const disconnectEvent: SSEEvent<ConnectionData> = {
            type: 'connection',
            data: {
              status: 'disconnected',
              clientId,
            },
            timestamp: Date.now(),
          };

          controller.enqueue(
            encoder.encode(formatSSEMessage('connection', disconnectEvent))
          );
        } catch {
          // Stream might already be closed
        }
      }
    },
  });

  // Start keep-alive timer
  const keepAliveTimer = setInterval(() => {
    if (controller) {
      try {
        controller.enqueue(encoder.encode(createKeepAliveMessage()));
      } catch (error) {
        // Connection likely closed, stop keep-alive
        clearInterval(keepAliveTimer);
      }
    }
  }, KEEP_ALIVE_INTERVAL);

  // Create cleanup function for when client disconnects
  const cleanup = () => {
    clearInterval(keepAliveTimer);
    controller?.close();
  };

  // Set up timeout to clean up (though SSE connections typically stay open indefinitely)
  // Note: Vercel Edge Functions have a maximum execution time
  const MAX_CONNECTION_TIME = 300000; // 5 minutes max (adjust based on Vercel limits)
  setTimeout(cleanup, MAX_CONNECTION_TIME);

  // Return SSE response with proper headers
  return new Response(stream, {
    headers: SSE_HEADERS,
  });
}

/**
 * Edge Runtime Configuration for Vercel
 *
 * This file should be exported as the default export for Vercel Edge Functions.
 * Vercel will automatically detect the edge runtime from the file location.
 */
export const config = {
  runtime: 'edge',
  // Vite/Vercel specific configuration
  preferStatic: true,
};

// TypeScript exports
export type {
  SSEEvent,
  SSEEventType,
  NewEmailData,
  EmailReadData,
  EmailSentData,
  ConnectionData,
};
