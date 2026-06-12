/**
 * Email address representation
 */
export interface EmailAddress {
  name?: string;
  email: string;
}

/**
 * Email message model
 */
export interface Email {
  id: string;
  threadId: string;
  snippet: string;
  subject: string;
  from: EmailAddress;
  to: EmailAddress[];
  date: Date;
  body: string;
  bodyIsHtml?: boolean; // True if body contains HTML that should be rendered
  isUnread: boolean;
  labels: string[];
  cc?: EmailAddress[];
  bcc?: EmailAddress[];
}

/**
 * Filter state for email queries
 */
export interface FilterState {
  query?: string;
  sender?: string;
  dateFrom?: Date;
  dateTo?: Date;
  isUnread?: boolean;
}

/**
 * View types in the app
 */
export type ViewType = 'inbox' | 'sent' | 'compose' | 'detail' | 'drafts';

export interface UserProfile {
  emailAddress: string;
  name?: string;
  picture?: string;
}

export interface GmailMessage {
  id: string;
  threadId: string;
  snippet?: string;
  payload?: GmailMessagePayload;
  internalDate?: string;
  labelIds?: string[];
}

export interface GmailMessagePayload {
  headers?: GmailHeader[];
  body?: GmailMessageBody;
  parts?: GmailMessagePayload[];
  mimeType?: string;
}

export interface GmailHeader {
  name: string;
  value: string;
}

export interface GmailMessageBody {
  data?: string;
  size?: number;
}

/**
 * Pagination status enum
 */
export type PaginationStatus = 'idle' | 'loading' | 'error' | 'success';

/**
 * Pagination state for a single folder (inbox or sent)
 */
export interface FolderPaginationState {
  pageToken: string | null;
  nextPageToken: string | null;
  hasMore: boolean;
  status: PaginationStatus;
  lastLoadedAt: number | null; // timestamp for cache-aware fetching
}

/**
 * Pagination state for both inbox and sent folders
 */
export interface PaginationState {
  inbox: FolderPaginationState;
  sent: FolderPaginationState;
}

export type SortOrder = 'newest' | 'oldest' | 'sender-asc' | 'subject-asc';
