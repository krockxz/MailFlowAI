/**
 * CopilotKit action definitions
 * These are the actions the AI assistant can execute
 */

/**
 * Compose email action parameters
 */
export interface ComposeEmailParams {
  to: string;
  subject: string;
  body: string;
  cc?: string;
  bcc?: string;
}

/**
 * Send email confirmation result
 */
export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Search emails parameters
 */
export interface SearchEmailsParams {
  query?: string;
  sender?: string;
  subject?: string;
  dateFrom?: string; // ISO date string
  dateTo?: string; // ISO date string
  isUnread?: boolean;
}

/**
 * Open email parameters
 */
export interface OpenEmailParams {
  emailId?: string;
  sender?: string;
  subject?: string;
  latest?: boolean;
}

/**
 * Reply to email parameters
 */
export interface ReplyEmailParams {
  emailId?: string; // If not provided, use currently selected email
  body: string;
  cc?: string;
}
