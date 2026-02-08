import type { GmailMessage } from '@/types/email';
import { parseMessage } from './parsers';
import { EmailError, GMAIL_API_BASE } from './types';

export interface ApiMethods {
  getUserProfile(): Promise<{ emailAddress: string; messagesTotal: number }>;
  listMessages(
    labelIds?: string[],
    maxResults?: number,
    pageToken?: string
  ): Promise<{
    messages: { id: string; threadId: string }[];
    nextPageToken?: string;
    resultSizeEstimate: number;
  }>;
  getMessage(id: string): Promise<GmailMessage>;
  getBatchMessages(ids: string[]): Promise<GmailMessage[]>;
  searchMessages(
    query: string,
    maxResults?: number
  ): Promise<{
    messages: { id: string; threadId: string }[];
    resultSizeEstimate: number;
  }>;
  sendEmail(options: {
    to: string[];
    subject: string;
    body: string;
    cc?: string[];
    bcc?: string[];
    threadId?: string;
  }): Promise<{ id: string; threadId: string }>;
  modifyMessage(
    id: string,
    addLabels?: string[],
    removeLabels?: string[]
  ): Promise<void>;
  markAsRead(id: string): Promise<void>;
  markAsUnread(id: string): Promise<void>;
  watch(topicName: string): Promise<void>;
  stop(): Promise<void>;
  getThread(threadId: string): Promise<import('@/types/email').Email[]>;
}

/**
 * Factory function that creates API methods with access token retrieval
 */
export function createApiMethods(getToken: () => string | null): ApiMethods {
  const ensureAuthenticated = () => {
    const token = getToken();
    if (!token) {
      throw new EmailError('No access token');
    }
    return token;
  };

  return {
    /**
     * Get user profile
     */
    async getUserProfile(): Promise<{ emailAddress: string; messagesTotal: number }> {
      const token = ensureAuthenticated();

      const response = await fetch(`${GMAIL_API_BASE}/users/me/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get profile: ${response.statusText}`);
      }

      return response.json();
    },

    /**
     * List messages
     */
    async listMessages(
      labelIds: string[] = ['INBOX'],
      maxResults = 50,
      pageToken?: string
    ): Promise<{
      messages: { id: string; threadId: string }[];
      nextPageToken?: string;
      resultSizeEstimate: number;
    }> {
      const token = ensureAuthenticated();

      const params = new URLSearchParams({
        maxResults: maxResults.toString(),
      });

      if (labelIds.length > 0) {
        params.append('labelIds', labelIds.join(','));
      }

      if (pageToken) {
        params.append('pageToken', pageToken);
      }

      const response = await fetch(
        `${GMAIL_API_BASE}/users/me/messages?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to list messages: ${response.statusText}`);
      }

      return response.json();
    },

    /**
     * Get a single message
     */
    async getMessage(id: string): Promise<GmailMessage> {
      const token = ensureAuthenticated();

      const response = await fetch(
        `${GMAIL_API_BASE}/users/me/messages/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get message: ${response.statusText}`);
      }

      return response.json();
    },

    /**
     * Get multiple messages in batch
     */
    async getBatchMessages(ids: string[]): Promise<GmailMessage[]> {
      const promises = ids.map((id) => this.getMessage(id));
      return Promise.all(promises);
    },

    /**
     * Search messages
     */
    async searchMessages(
      query: string,
      maxResults = 50
    ): Promise<{
      messages: { id: string; threadId: string }[];
      resultSizeEstimate: number;
    }> {
      const token = ensureAuthenticated();

      const params = new URLSearchParams({
        q: query,
        maxResults: maxResults.toString(),
      });

      const response = await fetch(
        `${GMAIL_API_BASE}/users/me/messages/search?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      return response.json();
    },

    /**
     * Send an email
     */
    async sendEmail(options: {
      to: string[];
      subject: string;
      body: string;
      cc?: string[];
      bcc?: string[];
      threadId?: string;
    }): Promise<{ id: string; threadId: string }> {
      const token = ensureAuthenticated();

      // Build raw email message in RFC 2822 format
      const emailLines = [
        `To: ${options.to.join(', ')}`,
        `Subject: =?utf-8?B?${btoa(options.subject)}?=`,
        'Content-Type: text/plain; charset=utf-8',
        'MIME-Version: 1.0',
      ];

      if (options.cc && options.cc.length > 0) {
        emailLines.push(`Cc: ${options.cc.join(', ')}`);
      }
      if (options.bcc && options.bcc.length > 0) {
        emailLines.push(`Bcc: ${options.bcc.join(', ')}`);
      }
      if (options.threadId) {
        emailLines.push(`References: ${options.threadId}`);
        emailLines.push(`In-Reply-To: ${options.threadId}`);
      }

      emailLines.push('');
      emailLines.push(options.body);

      const rawMessage = emailLines.join('\r\n');
      const base64Raw = btoa(unescape(encodeURIComponent(rawMessage)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const response = await fetch(`${GMAIL_API_BASE}/users/me/messages/send`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          raw: base64Raw,
          threadId: options.threadId,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new EmailError(`Failed to send email: ${error}`);
      }

      return response.json();
    },

    /**
     * Modify labels (mark as read/unread, etc.)
     */
    async modifyMessage(
      id: string,
      addLabels?: string[],
      removeLabels?: string[]
    ): Promise<void> {
      const token = ensureAuthenticated();

      const response = await fetch(
        `${GMAIL_API_BASE}/users/me/messages/${id}/modify`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            addLabelIds: addLabels || [],
            removeLabelIds: removeLabels || [],
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to modify message: ${response.statusText}`);
      }
    },

    /**
     * Mark message as read
     */
    async markAsRead(id: string): Promise<void> {
      return this.modifyMessage(id, [], ['UNREAD']);
    },

    /**
     * Mark message as unread
     */
    async markAsUnread(id: string): Promise<void> {
      return this.modifyMessage(id, ['UNREAD'], []);
    },

    /**
     * Set up watch for push notifications
     */
    async watch(topicName: string): Promise<void> {
      const token = ensureAuthenticated();

      const response = await fetch(`${GMAIL_API_BASE}/users/me/watch`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topicName,
          labelIds: ['INBOX'],
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to set up watch: ${error}`);
      }
    },

    /**
     * Stop watching for push notifications
     */
    async stop(): Promise<void> {
      const token = ensureAuthenticated();

      const response = await fetch(`${GMAIL_API_BASE}/users/me/stop`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to stop watch: ${response.statusText}`);
      }
    },

    /**
     * Get a full thread with all messages
     */
    async getThread(threadId: string): Promise<import('@/types/email').Email[]> {
      const token = ensureAuthenticated();

      const response = await fetch(
        `${GMAIL_API_BASE}/users/me/threads/${threadId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get thread: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.messages) {
        return [];
      }

      // Parse all messages in the thread
      return data.messages.map((msg: GmailMessage) => parseMessage(msg));
    },
  };
}
