/**
 * Vercel Edge Runtime SSE Endpoint for Email Notifications
 */

import type {
  SSEEvent,
  ConnectionData,
} from './types';

const SSE_HEADERS = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache, no-transform',
  'Connection': 'keep-alive',
  'X-Accel-Buffering': 'no',
  'X-Content-Type-Options': 'nosniff',
};

function formatSSEMessage(event: string, data: unknown): string {
  const dataStr = typeof data === 'string' ? data : JSON.stringify(data);
  return `event: ${event}\ndata: ${dataStr}\n\n`;
}

/**
 * Edge Runtime Configuration
 */
export const config = {
  runtime: 'edge',
};

/**
 * SSE Handler for Email Notifications
 */
export default async function handler(): Promise<Response> {
  const clientId = crypto.randomUUID();
  const encoder = new TextEncoder();
  let controller: ReadableStreamDefaultController<Uint8Array> | null = null;
  let keepAliveTimer: ReturnType<typeof setInterval> | null = null;

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

      // Start keep-alive timer (15 seconds)
      keepAliveTimer = setInterval(() => {
        if (controller) {
          try {
            controller.enqueue(encoder.encode(': keep-alive\n\n'));
          } catch {
            // Stream closed
          }
        }
      }, 15000);
    },

    cancel() {
      if (keepAliveTimer) {
        clearInterval(keepAliveTimer);
      }
    },
  });

  return new Response(stream, {
    headers: SSE_HEADERS,
  });
}
