/**
 * SSE Types and Utilities for Email Notifications
 */

export type SSEEventType =
  | 'email:new'
  | 'email:read'
  | 'email:sent'
  | 'connection'
  | 'keepalive';

export interface SSEEvent<T = unknown> {
  type: SSEEventType;
  data: T;
  timestamp: number;
}

export interface NewEmailData {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  snippet: string;
  date: string;
  isUnread: boolean;
}

export interface EmailReadData {
  id: string;
  threadId: string;
  isRead: boolean;
}

export interface EmailSentData {
  id: string;
  threadId: string;
  to: string[];
  subject: string;
  timestamp: string;
}

export interface ConnectionData {
  status: 'connected' | 'disconnected';
  clientId?: string;
}

export function formatSSEMessage(event: string, data: unknown): string {
  const dataStr = typeof data === 'string' ? data : JSON.stringify(data);
  return `event: ${event}\ndata: ${dataStr}\n\n`;
}

export function createKeepAliveMessage(): string {
  return ': keep-alive\n\n';
}

export const SSE_HEADERS = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache, no-transform',
  'Connection': 'keep-alive',
  'X-Accel-Buffering': 'no',
  'X-Content-Type-Options': 'nosniff',
} as const;
