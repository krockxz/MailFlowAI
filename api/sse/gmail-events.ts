/**
 * SSE Endpoint with KV Integration
 *
 * This SSE endpoint polls Vercel KV for new Gmail webhook events
 * and broadcasts them to connected clients via Server-Sent Events.
 *
 * @route GET /api/sse/gmail-events
 * @runtime edge
 */

import { kv } from '@vercel/kv';
import type { SSEEvent, ConnectionData } from './types';
import { formatSSEMessage, createKeepAliveMessage, SSE_HEADERS } from './types';

interface EmailEvent {
  id: string;
  timestamp: number;
  messageId: string;
  data?: string;
  publishTime?: string;
}

const KV_EVENTS_KEY = 'email:events';
const EVENT_POLL_INTERVAL = 1000; // Poll every second when using KV

/**
 * Fetch new events from KV storage
 */
async function fetchNewEvents(since: number): Promise<EmailEvent[]> {
  try {
    const rawEvents = await kv.lrange(KV_EVENTS_KEY, 0, 49);

    const events: EmailEvent[] = rawEvents
      .map((e: string) => JSON.parse(e))
      .filter((e: EmailEvent) => e.timestamp > since)
      .sort((a: EmailEvent, b: EmailEvent) => a.timestamp - b.timestamp);

    return events;
  } catch (error) {
    console.error('Error fetching events from KV:', error);
    return [];
  }
}

/**
 * GET /api/sse/gmail-events
 *
 * Establishes an SSE connection that polls for new Gmail webhook events
 * from Vercel KV and broadcasts them to the client in real-time.
 */
export async function GET(): Promise<Response> {
  const clientId = crypto.randomUUID();
  const encoder = new TextEncoder();

  let controller: ReadableStreamDefaultController<Uint8Array> | null = null;
  let pollTimer: ReturnType<typeof setInterval> | null = null;
  let keepAliveTimer: ReturnType<typeof setInterval> | null = null;
  let lastPollTime = Date.now();

  /**
   * Poll for new events and broadcast to client
   */
  const pollForEvents = async () => {
    if (!controller) return;

    try {
      const newEvents = await fetchNewEvents(lastPollTime);

      if (newEvents.length > 0) {
        // Update last poll time to the latest event timestamp
        lastPollTime = Math.max(...newEvents.map(e => e.timestamp));

        // Send each event to the client
        for (const event of newEvents) {
          const sseEvent: SSEEvent<{ messageId: string; timestamp: number }> = {
            type: 'email:new',
            data: {
              messageId: event.messageId,
              timestamp: event.timestamp,
            },
            timestamp: event.timestamp,
          };

          try {
            controller.enqueue(
              encoder.encode(formatSSEMessage('email:new', sseEvent))
            );
          } catch {
            // Stream closed, stop polling
            return;
          }
        }
      }
    } catch (error) {
      console.error('Error polling for events:', error);
    }
  };

  /**
   * Create the SSE stream
   */
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

      // Start polling for events
      pollForEvents(); // Initial poll
      pollTimer = setInterval(pollForEvents, EVENT_POLL_INTERVAL);

      // Start keep-alive timer (15 seconds)
      keepAliveTimer = setInterval(() => {
        if (controller) {
          try {
            controller.enqueue(encoder.encode(createKeepAliveMessage()));
          } catch {
            // Stream closed
          }
        }
      }, 15000);
    },

    cancel() {
      // Cleanup when client disconnects
      if (pollTimer) {
        clearInterval(pollTimer);
      }
      if (keepAliveTimer) {
        clearInterval(keepAliveTimer);
      }
    },
  });

  // Return SSE response
  return new Response(stream, {
    headers: SSE_HEADERS,
  });
}

/**
 * Edge Runtime Configuration
 */
export const config = {
  runtime: 'edge',
};

/**
 * Default export
 */
export default function handler(): Promise<Response> {
  return GET();
}
