/**
 * SSE Endpoint with Upstash Redis Integration
 */

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
const EVENT_POLL_INTERVAL = 1000; // Poll every second

// Upstash REST API configuration
const UPSTASH_REST_URL = process.env.KV_REST_API_URL || '';
const UPSTASH_REST_TOKEN = process.env.KV_REST_API_TOKEN || '';

/**
 * Fetch new events from Upstash Redis
 */
async function fetchNewEvents(since: number): Promise<EmailEvent[]> {
  if (!UPSTASH_REST_URL || !UPSTASH_REST_TOKEN) {
    console.warn('Upstash credentials not found');
    return [];
  }

  try {
    const response = await fetch(`${UPSTASH_REST_URL}/lrange/${KV_EVENTS_KEY}/0/49`, {
      headers: {
        'Authorization': `Bearer ${UPSTASH_REST_TOKEN}`,
      },
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    const rawEvents = data.result || [];

    const events: EmailEvent[] = rawEvents
      .map((e: string) => JSON.parse(e))
      .filter((e: EmailEvent) => e.timestamp > since)
      .sort((a: EmailEvent, b: EmailEvent) => a.timestamp - b.timestamp);

    return events;
  } catch (error) {
    console.error('Error fetching events from Redis:', error);
    return [];
  }
}

/**
 * GET /api/sse/gmail-events
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
