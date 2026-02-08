/**
 * Gmail Service - Facade for modular Gmail API operations
 *
 * This module provides a backward-compatible facade to the refactored Gmail service.
 * The public API remains the same as the original monolithic GmailService class.
 *
 * @module services/gmail
 */

import { getAuthUrl, exchangeCodeForToken, refreshToken } from './oauth';
import { createApiMethods, ApiMethods } from './api';
import { parseMessage } from './parsers';
import { EmailError } from './types';

/**
 * Gmail API Service
 *
 * Facade class that delegates to specialized modules while maintaining
 * backward compatibility with existing code.
 */
export class GmailService {
  private accessToken: string | null = null;
  private api: ApiMethods;

  constructor(accessToken?: string) {
    if (accessToken) {
      this.accessToken = accessToken;
    }
    // Create API methods with a callback to get the current access token
    this.api = createApiMethods(() => this.accessToken);
  }

  /**
   * Set the access token
   */
  setAccessToken(token: string): void {
    this.accessToken = token;
  }

  // Static OAuth methods (delegated to oauth module)

  /**
   * Get the OAuth URL for authentication
   */
  static getAuthUrl = getAuthUrl;

  /**
   * Exchange authorization code for access token
   */
  static exchangeCodeForToken = exchangeCodeForToken;

  /**
   * Refresh the access token
   */
  static refreshToken = refreshToken;

  // Instance API methods (delegated to api module)

  /**
   * Get user profile
   */
  getUserProfile() {
    return this.api.getUserProfile();
  }

  /**
   * List messages
   */
  listMessages(labelIds?: string[], maxResults?: number, pageToken?: string) {
    return this.api.listMessages(labelIds, maxResults, pageToken);
  }

  /**
   * Get a single message
   */
  getMessage(id: string) {
    return this.api.getMessage(id);
  }

  /**
   * Get multiple messages in batch
   */
  getBatchMessages(ids: string[]) {
    return this.api.getBatchMessages(ids);
  }

  /**
   * Search messages
   */
  searchMessages(query: string, maxResults?: number) {
    return this.api.searchMessages(query, maxResults);
  }

  /**
   * Send an email
   */
  sendEmail(options: {
    to: string[];
    subject: string;
    body: string;
    cc?: string[];
    bcc?: string[];
    threadId?: string;
  }) {
    return this.api.sendEmail(options);
  }

  /**
   * Modify labels (mark as read/unread, etc.)
   */
  modifyMessage(id: string, addLabels?: string[], removeLabels?: string[]) {
    return this.api.modifyMessage(id, addLabels, removeLabels);
  }

  /**
   * Mark message as read
   */
  markAsRead(id: string) {
    return this.api.markAsRead(id);
  }

  /**
   * Mark message as unread
   */
  markAsUnread(id: string) {
    return this.api.markAsUnread(id);
  }

  /**
   * Set up watch for push notifications
   */
  watch(topicName: string) {
    return this.api.watch(topicName);
  }

  /**
   * Stop watching for push notifications
   */
  stop() {
    return this.api.stop();
  }

  /**
   * Get a full thread with all messages
   */
  getThread(threadId: string) {
    return this.api.getThread(threadId);
  }

  // Parsing methods (delegated to parsers module)

  /**
   * Parse a Gmail message to our Email format
   */
  parseMessage = parseMessage;
}

/**
 * Create a Gmail service instance
 *
 * Factory function for creating a GmailService with an optional access token.
 *
 * @param accessToken - Optional OAuth access token
 * @returns A new GmailService instance
 */
export function createGmailService(accessToken?: string): GmailService {
  return new GmailService(accessToken);
}

/**
 * Re-export EmailError for convenience
 */
export { EmailError };
