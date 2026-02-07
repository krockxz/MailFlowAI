import type {
  Email,
  EmailAddress,
  GmailMessage,
  GmailMessagePayload,
} from '@/types/email';
import {
  base64UrlDecode,
  extractEmailAddress,
  extractName,
} from '@/lib/utils';

// Constants
const GMAIL_API_BASE = 'https://www.googleapis.com/gmail/v1';
const OAUTH_SCOPE = 'https://www.googleapis.com/auth/gmail.modify';

/**
 * Gmail API Service
 */
export class GmailService {
  private accessToken: string | null = null;

  constructor(accessToken?: string) {
    if (accessToken) {
      this.accessToken = accessToken;
    }
  }

  /**
   * Set the access token
   */
  setAccessToken(token: string) {
    this.accessToken = token;
  }

  /**
   * Get the OAuth URL for authentication
   */
  static getAuthUrl(
    clientId: string,
    redirectUri: string,
    state?: string
  ): string {
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: OAUTH_SCOPE,
      access_type: 'offline',
      prompt: 'consent',
    });

    if (state) {
      params.append('state', state);
    }

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  static async exchangeCodeForToken(
    code: string,
    clientId: string,
    clientSecret: string,
    redirectUri: string
  ): Promise<{
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  }> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Token exchange failed: ${error}`);
    }

    return response.json();
  }

  /**
   * Refresh the access token
   */
  static async refreshToken(
    refreshToken: string,
    clientId: string,
    clientSecret: string
  ): Promise<{
    access_token: string;
    expires_in: number;
  }> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Token refresh failed: ${error}`);
    }

    return response.json();
  }

  /**
   * Get user profile
   */
  async getUserProfile(): Promise<{ emailAddress: string; messagesTotal: number }> {
    if (!this.accessToken) {
      throw new Error('No access token');
    }

    const response = await fetch(`${GMAIL_API_BASE}/users/me/profile`, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get profile: ${response.statusText}`);
    }

    return response.json();
  }

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
    if (!this.accessToken) {
      throw new Error('No access token');
    }

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
          Authorization: `Bearer ${this.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to list messages: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get a single message
   */
  async getMessage(id: string): Promise<GmailMessage> {
    if (!this.accessToken) {
      throw new Error('No access token');
    }

    const response = await fetch(
      `${GMAIL_API_BASE}/users/me/messages/${id}`,
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get message: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get multiple messages in batch
   */
  async getBatchMessages(ids: string[]): Promise<GmailMessage[]> {
    const promises = ids.map((id) => this.getMessage(id));
    return Promise.all(promises);
  }

  /**
   * Parse a Gmail message to our Email format
   */
  parseMessage(message: GmailMessage): Email {
    const headers = message.payload?.headers || [];
    const getHeader = (name: string): string => {
      const header = headers.find((h) => h.name.toLowerCase() === name.toLowerCase());
      return header?.value || '';
    };

    const fromStr = getHeader('From');
    const toStr = getHeader('To');
    const ccStr = getHeader('Cc');
    const subject = getHeader('Subject') || '(No subject)';
    const dateStr = getHeader('Date');

    // Parse from address
    let from: EmailAddress = { email: 'unknown@example.com', name: 'Unknown' };
    try {
      from = {
        email: extractEmailAddress(fromStr),
        name: extractName(fromStr) || extractEmailAddress(fromStr),
      };
    } catch {}

    // Parse to addresses
    let to: EmailAddress[] = [];
    try {
      to = toStr
        .split(',')
        .map((addr) => ({
          email: extractEmailAddress(addr.trim()),
          name: extractName(addr.trim()) || extractEmailAddress(addr.trim()),
        }))
        .filter((addr) => addr.email);
    } catch {}

    // Parse cc addresses
    let cc: EmailAddress[] = [];
    try {
      cc = ccStr
        .split(',')
        .map((addr) => ({
          email: extractEmailAddress(addr.trim()),
          name: extractName(addr.trim()) || extractEmailAddress(addr.trim()),
        }))
        .filter((addr) => addr.email);
    } catch {}

    // Parse date
    let date = new Date();
    try {
      date = new Date(dateStr);
    } catch {}

    // Extract body
    let body = '';
    if (message.payload?.body?.data) {
      body = base64UrlDecode(message.payload.body.data);
    } else if (message.payload?.parts) {
      // Find text/plain or text/html part
      const textPart = message.payload.parts.find(
        (part) => part.mimeType === 'text/plain' || part.mimeType === 'text/html'
      );
      if (textPart?.body?.data) {
        body = base64UrlDecode(textPart.body.data);
      } else {
        // Recursively search for body
        body = this.extractBodyFromParts(message.payload.parts);
      }
    }

    return {
      id: message.id,
      threadId: message.threadId,
      snippet: message.snippet || '',
      subject,
      from,
      to,
      cc: cc.length > 0 ? cc : undefined,
      date,
      body,
      isUnread: message.labelIds?.includes('UNREAD') || false,
      labels: message.labelIds || [],
    };
  }

  /**
   * Extract body from nested parts
   */
  private extractBodyFromParts(parts: GmailMessagePayload[]): string {
    for (const part of parts) {
      if (part.body?.data) {
        if (part.mimeType === 'text/plain' || part.mimeType === 'text/html') {
          return base64UrlDecode(part.body.data);
        }
      }
      if (part.parts) {
        const body = this.extractBodyFromParts(part.parts);
        if (body) return body;
      }
    }
    return '';
  }

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
    if (!this.accessToken) {
      throw new Error('No access token');
    }

    const params = new URLSearchParams({
      q: query,
      maxResults: maxResults.toString(),
    });

    const response = await fetch(
      `${GMAIL_API_BASE}/users/me/messages/search?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Search failed: ${response.statusText}`);
    }

    return response.json();
  }

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
    if (!this.accessToken) {
      throw new EmailError('No access token');
    }

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
        Authorization: `Bearer ${this.accessToken}`,
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
  }

  /**
   * Modify labels (mark as read/unread, etc.)
   */
  async modifyMessage(
    id: string,
    addLabels?: string[],
    removeLabels?: string[]
  ): Promise<void> {
    if (!this.accessToken) {
      throw new Error('No access token');
    }

    const response = await fetch(
      `${GMAIL_API_BASE}/users/me/messages/${id}/modify`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
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
  }

  /**
   * Mark message as read
   */
  async markAsRead(id: string): Promise<void> {
    return this.modifyMessage(id, [], ['UNREAD']);
  }

  /**
   * Mark message as unread
   */
  async markAsUnread(id: string): Promise<void> {
    return this.modifyMessage(id, ['UNREAD'], []);
  }

  /**
   * Set up watch for push notifications
   */
  async watch(topicName: string): Promise<void> {
    if (!this.accessToken) {
      throw new Error('No access token');
    }

    const response = await fetch(
      `${GMAIL_API_BASE}/users/me/watch`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topicName,
          labelIds: ['INBOX'],
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to set up watch: ${error}`);
    }
  }

  /**
   * Stop watching for push notifications
   */
  async stop(): Promise<void> {
    if (!this.accessToken) {
      throw new Error('No access token');
    }

    const response = await fetch(
      `${GMAIL_API_BASE}/users/me/stop`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to stop watch: ${response.statusText}`);
    }
  }
}

/**
 * Custom error class for email operations
 */
export class EmailError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EmailError';
  }
}

/**
 * Create a Gmail service instance
 */
export function createGmailService(accessToken?: string): GmailService {
  return new GmailService(accessToken);
}
