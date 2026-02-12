/**
 * Vercel Edge Runtime Gmail Pub/Sub Webhook Handler with Upstash Redis
 */

interface EmailEvent {
  id: string;
  timestamp: number;
  messageId: string;
  data?: string;
  publishTime?: string;
}

const KV_EVENTS_KEY = 'email:events';
const MAX_EVENTS = 100;
const TTL = 300; // 5 minutes

// Upstash REST API configuration
const UPSTASH_REST_URL = process.env.KV_REST_API_URL || '';
const UPSTASH_REST_TOKEN = process.env.KV_REST_API_TOKEN || '';

/**
 * Store event in Upstash Redis
 */
async function storeEventInRedis(event: EmailEvent): Promise<void> {
  if (!UPSTASH_REST_URL || !UPSTASH_REST_TOKEN) {
    console.warn('Upstash credentials not found, skipping storage');
    return;
  }

  try {
    // LPUSH to add to beginning of list
    // Send the event JSON as the body (Upstash treats the body value as the element)
    const eventStr = JSON.stringify(event);
    await fetch(`${UPSTASH_REST_URL}/lpush/${KV_EVENTS_KEY}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${UPSTASH_REST_TOKEN}`,
      },
      body: eventStr,
    });

    // LTRIM to keep only MAX_EVENTS
    await fetch(`${UPSTASH_REST_URL}/ltrim/${KV_EVENTS_KEY}/0/${MAX_EVENTS - 1}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${UPSTASH_REST_TOKEN}`,
      },
    });

    // EXPIRE to set TTL
    await fetch(`${UPSTASH_REST_URL}/expire/${KV_EVENTS_KEY}/${TTL}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${UPSTASH_REST_TOKEN}`,
      },
    });
  } catch (error) {
    console.error('Error storing event in Redis:', error);
  }
}

/**
 * Get events from Upstash Redis
 */
async function getEventsFromRedis(limit: number = 50): Promise<string[]> {
  if (!UPSTASH_REST_URL || !UPSTASH_REST_TOKEN) {
    console.warn('Upstash credentials not found');
    return [];
  }

  try {
    const response = await fetch(`${UPSTASH_REST_URL}/lrange/${KV_EVENTS_KEY}/0/${limit - 1}`, {
      headers: {
        'Authorization': `Bearer ${UPSTASH_REST_TOKEN}`,
      },
    });

    if (!response.ok) {
      console.error('Redis response not OK:', response.status, response.statusText);
      return [];
    }

    const data = await response.json();
    // Upstash returns { result: [array of elements] }
    // Each element should be a JSON string representing an event
    const rawEvents = data.result || [];
    return rawEvents;
  } catch (error) {
    console.error('Error fetching events from Redis:', error);
    return [];
  }
}

/**
 * Verify webhook HMAC signature
 */
async function verifyWebhookSignature(
  signature: string,
  payload: Uint8Array,
  secret: string
): Promise<boolean> {
  if (!signature || !payload || !secret) {
    return false;
  }

  try {
    const sigBytes = base64UrlToBytes(signature);
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const computed = await crypto.subtle.sign('HMAC', key, payload.buffer as ArrayBuffer);

    if (sigBytes.length !== computed.byteLength) {
      return false;
    }

    const computedBytes = new Uint8Array(computed);
    let result = 0;
    for (let i = 0; i < sigBytes.length; i++) {
      result |= sigBytes[i] ^ computedBytes[i];
    }
    return result === 0;
  } catch {
    return false;
  }
}

function base64UrlToBytes(base64Url: string): Uint8Array {
  let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function validatePayload(body: any): { valid: boolean; error?: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body is missing or not an object' };
  }
  if (!body.message) {
    return { valid: false, error: 'Missing "message" field in payload' };
  }
  if (!body.message.messageId) {
    return { valid: false, error: 'Missing "messageId" in message' };
  }
  return { valid: true };
}

function extractSignature(headers: Headers): string | null {
  return headers.get('x-goog-signature') || headers.get('X-Goog-Signature');
}

/**
 * Vercel Edge Function handler
 */
export default async function handler(request: Request) {
  const url = new URL(request.url);
  const method = request.method;

  // Handle GET - retrieve recent events from Redis
  if (method === 'GET') {
    try {
      const since = parseInt(url.searchParams.get('since') || '0', 10);
      const limit = Math.min(parseInt(url.searchParams.get('limit') || '10', 10), 100);

      const rawEvents = await getEventsFromRedis(limit);

      const events: EmailEvent[] = rawEvents
        .map((e: string) => JSON.parse(e))
        .filter((e: EmailEvent) => e.timestamp > since)
        .sort((a: EmailEvent, b: EmailEvent) => a.timestamp - b.timestamp);

      return Response.json({
        events,
        count: events.length,
      });
    } catch (error) {
      console.error('Error retrieving events:', error);
      return Response.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  // Handle POST - Gmail webhook
  if (method === 'POST') {
    console.log('Received Gmail webhook at:', new Date().toISOString());

    const rawBody = await request.text();
    let body: any;

    try {
      body = JSON.parse(rawBody);
    } catch {
      return Response.json({ error: 'Invalid JSON' }, { status: 200 });
    }

    const secret = process.env.GOOGLE_PUBSUB_VERIFICATION_TOKEN || '';

    // Verify signature if secret is configured
    if (secret) {
      const signature = extractSignature(request.headers);
      if (!signature) {
        console.error('Webhook rejected: Missing signature');
        return Response.json(
          { error: 'Unauthorized', message: 'Missing signature header' },
          { status: 401 }
        );
      }

      const payloadBytes = new TextEncoder().encode(rawBody);
      const isValid = await verifyWebhookSignature(signature, payloadBytes, secret);

      if (!isValid) {
        console.error('Webhook rejected: Invalid signature');
        return Response.json(
          { error: 'Unauthorized', message: 'Invalid signature' },
          { status: 401 }
        );
      }
      console.log('Signature verification passed');
    } else {
      console.warn('WARNING: GOOGLE_PUBSUB_VERIFICATION_TOKEN not set');
    }

    // Validate payload
    const validation = validatePayload(body);
    if (!validation.valid) {
      console.error('Webhook rejected:', validation.error);
      return Response.json(
        { error: 'Bad Request', message: validation.error },
        { status: 400 }
      );
    }

    // Decode message data if present
    let decodedData: string | undefined;
    if (body.message.data) {
      try {
        let base64 = body.message.data.replace(/-/g, '+').replace(/_/g, '/');
        while (base64.length % 4) base64 += '=';
        decodedData = atob(base64);
      } catch {}
    }

    // Create and store event
    const event: EmailEvent = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      messageId: body.message.messageId,
      data: decodedData,
      publishTime: body.message.publishTime,
    };

    await storeEventInRedis(event);

    console.log('Event stored in Redis:', event.id, 'Message:', body.message.messageId);

    return Response.json({
      success: true,
      eventId: event.id,
      messageId: body.message.messageId,
    });
  }

  return Response.json({ error: 'Method not allowed' }, { status: 405 });
}

/**
 * Edge Runtime Configuration
 */
export const config = {
  runtime: 'edge',
};
