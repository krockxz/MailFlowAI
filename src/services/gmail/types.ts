/**
 * Gmail service constants and types
 */

export const OAUTH_SCOPE = 'https://www.googleapis.com/auth/gmail.modify';
export const GMAIL_API_BASE = 'https://www.googleapis.com/gmail/v1';

/**
 * Custom error class for email operations
 */
export class EmailError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EmailError';
  }
}
