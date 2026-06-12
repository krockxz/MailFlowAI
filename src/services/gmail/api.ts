import ky from 'ky';
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

export function createApiMethods(getToken: () => string | null): ApiMethods {
  const ensureAuthenticated = () => {
    const token = getToken();
    if (!token) {
      throw new EmailError('No access token');
    }
    return token;
  };

  function api(token: string) {
    return ky.create({
      prefix: GMAIL_API_BASE,
      headers: { Authorization: `Bearer ${token}` },
      throwHttpErrors: false,
    });
  }

  const json = async <T>(res: Response): Promise<T> => {
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || res.statusText);
    }
    return res.json();
  };

  return {
    async getUserProfile() {
      const token = ensureAuthenticated();
      const res = await api(token).get('users/me/profile');
      return json(res);
    },

    async listMessages(labelIds = ['INBOX'], maxResults = 50, pageToken?: string) {
      const token = ensureAuthenticated();
      const searchParams: Record<string, string> = { maxResults: String(maxResults) };
      if (labelIds.length) searchParams.labelIds = labelIds.join(',');
      if (pageToken) searchParams.pageToken = pageToken;

      const res = await api(token).get('users/me/messages', { searchParams });
      return json(res);
    },

    async getMessage(id: string) {
      const token = ensureAuthenticated();
      const res = await api(token).get(`users/me/messages/${id}`);
      return json<GmailMessage>(res);
    },

    async getBatchMessages(ids: string[]) {
      const results = await Promise.allSettled(ids.map((id) => this.getMessage(id)));
      return results
        .filter((r): r is PromiseFulfilledResult<GmailMessage> => r.status === 'fulfilled')
        .map((r) => r.value);
    },

    async searchMessages(query: string, maxResults = 50) {
      const token = ensureAuthenticated();
      const res = await api(token).get('users/me/messages/search', {
        searchParams: { q: query, maxResults: String(maxResults) },
      });
      return json(res);
    },

    async sendEmail(options) {
      const token = ensureAuthenticated();
      const utf8Bytes = new TextEncoder().encode(options.subject);
      const base64Subject = btoa(String.fromCharCode(...utf8Bytes));

      const emailLines = [
        `To: ${options.to.join(', ')}`,
        `Subject: =?utf-8?B?${base64Subject}?=`,
        'Content-Type: text/plain; charset=utf-8',
        'MIME-Version: 1.0',
      ];

      if (options.cc?.length) emailLines.push(`Cc: ${options.cc.join(', ')}`);
      if (options.bcc?.length) emailLines.push(`Bcc: ${options.bcc.join(', ')}`);
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

      const res = await api(token).post('users/me/messages/send', {
        json: { raw: base64Raw, threadId: options.threadId },
      });

      if (!res.ok) {
        const error = await res.text();
        throw new EmailError(`Failed to send email: ${error}`);
      }
      return res.json();
    },

    async modifyMessage(id, addLabels, removeLabels) {
      const token = ensureAuthenticated();
      const res = await api(token).post(`users/me/messages/${id}/modify`, {
        json: { addLabelIds: addLabels || [], removeLabelIds: removeLabels || [] },
      });
      if (!res.ok) throw new Error(`Failed to modify message: ${res.statusText}`);
    },

    async markAsRead(id: string) {
      return this.modifyMessage(id, [], ['UNREAD']);
    },

    async markAsUnread(id: string) {
      return this.modifyMessage(id, ['UNREAD'], []);
    },

    async watch(topicName: string) {
      const token = ensureAuthenticated();
      const res = await api(token).post('users/me/watch', {
        json: { topicName, labelIds: ['INBOX'] },
      });
      if (!res.ok) {
        const error = await res.text();
        throw new Error(`Failed to set up watch: ${error}`);
      }
    },

    async stop() {
      const token = ensureAuthenticated();
      const res = await api(token).post('users/me/stop');
      if (!res.ok) throw new Error(`Failed to stop watch: ${res.statusText}`);
    },

    async getThread(threadId: string) {
      const token = ensureAuthenticated();
      const res = await api(token).get(`users/me/threads/${threadId}`);
      if (!res.ok) throw new Error(`Failed to get thread: ${res.statusText}`);
      const data = await res.json() as { messages?: GmailMessage[] };
      if (!data.messages) return [];
      return data.messages.map((msg) => parseMessage(msg));
    },
  };
}
