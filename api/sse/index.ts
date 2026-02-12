/**
 * SSE Notifications Module
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
  NewEmailData,
  EmailReadData,
  EmailSentData,
  ConnectionData,
} from './types';

// Utility exports
export {
  formatSSEMessage,
  createKeepAliveMessage,
  SSE_HEADERS,
} from './types';
