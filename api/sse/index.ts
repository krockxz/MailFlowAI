/**
 * SSE Notifications Module
 *
 * This module provides Server-Sent Events (SSE) functionality for real-time
 * email notifications in the application.
 *
 * Server-side usage (Edge Function):
 * - Import handler from './notifications'
 * - Configure Edge Runtime in Vercel
 *
 * Client-side usage (React):
 * - Import useSSE hook from './client'
 * - Import types from './types'
 */

// Server-side exports
export { default } from './notifications';
export { config } from './notifications';

// Client-side exports
export { useSSE } from './client';
export type { UseSSEOptions, SSEClientState } from './client';

// Type exports
export type {
  SSEEvent,
  SSEEventType,
  SSEClient,
  NewEmailData,
  EmailReadData,
  EmailSentData,
  ConnectionData,
  BroadcastOptions,
} from './types';

// Utility exports
export {
  formatSSEMessage,
  createKeepAliveMessage,
  createNewEmailEvent,
  createEmailReadEvent,
  createEmailSentEvent,
  SSE_HEADERS,
  KEEP_ALIVE_INTERVAL,
} from './types';
