import { describe, it, expect } from 'vitest';
import { parseMessage, extractBodyFromParts } from '../parsers';
import type { GmailMessage } from '@/types/email';

// Helper to encode to base64url
function base64UrlEncode(str: string): string {
  const utf8Bytes = new TextEncoder().encode(str);
  const binary = Array.from(utf8Bytes, (byte) => String.fromCharCode(byte)).join('');
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

describe('parsers', () => {
  describe('parseMessage', () => {
    const mockMessage: GmailMessage = {
      id: 'msg123',
      threadId: 'thread456',
      snippet: 'Test snippet',
      payload: {
        headers: [
          { name: 'From', value: 'Sender Name <sender@example.com>' },
          { name: 'To', value: 'recipient@example.com' },
          { name: 'Subject', value: 'Test Subject' },
          { name: 'Date', value: 'Fri, 07 Feb 2025 14:30:00 +0000' },
        ],
        body: {
          data: base64UrlEncode('Test email body'),
        },
      },
    };

    it('should parse a simple message with plain text body', () => {
      const result = parseMessage(mockMessage);

      expect(result.id).toBe('msg123');
      expect(result.threadId).toBe('thread456');
      expect(result.snippet).toBe('Test snippet');
      expect(result.subject).toBe('Test Subject');
      expect(result.from.email).toBe('sender@example.com');
      expect(result.from.name).toBe('Sender Name');
      expect(result.to).toEqual([{ email: 'recipient@example.com', name: 'recipient@example.com' }]);
      expect(result.body).toBe('Test email body');
      expect(result.isUnread).toBe(false);
    });

    it('should parse message with HTML body', () => {
      const message: GmailMessage = {
        ...mockMessage,
        payload: {
          ...mockMessage.payload!,
          mimeType: 'text/html',
          body: {
            data: base64UrlEncode('<p>HTML body</p>'),
          },
        },
      };

      const result = parseMessage(message);
      expect(result.body).toBe('<p>HTML body</p>');
    });

    it('should parse message with multipart payload', () => {
      const message: GmailMessage = {
        ...mockMessage,
        payload: {
          headers: mockMessage.payload!.headers,
          parts: [
            {
              mimeType: 'text/plain',
              body: {
                data: base64UrlEncode('Plain text body'),
              },
            },
          ],
        },
      };

      const result = parseMessage(message);
      expect(result.body).toBe('Plain text body');
    });

    it('should handle nested parts for body extraction', () => {
      const message: GmailMessage = {
        ...mockMessage,
        payload: {
          headers: mockMessage.payload!.headers,
          parts: [
            {
              mimeType: 'multipart/alternative',
              parts: [
                {
                  mimeType: 'text/plain',
                  body: {
                    data: base64UrlEncode('Nested body'),
                  },
                },
              ],
            },
          ],
        },
      };

      const result = parseMessage(message);
      expect(result.body).toBe('Nested body');
    });

    it('should handle message with missing headers', () => {
      const message: GmailMessage = {
        id: 'msg123',
        threadId: 'thread456',
        payload: {
          headers: [],
          body: {
            data: base64UrlEncode('Body'),
          },
        },
      };

      const result = parseMessage(message);

      expect(result.subject).toBe('(No subject)');
      expect(result.from.email).toBe('unknown@example.com');
      expect(result.from.name).toBe('Unknown');
      expect(result.to).toEqual([]);
    });

    it('should parse CC recipients', () => {
      const message: GmailMessage = {
        ...mockMessage,
        payload: {
          ...mockMessage.payload!,
          headers: [
            ...mockMessage.payload!.headers!,
            { name: 'Cc', value: 'cc1@example.com, CC Name <cc2@example.com>' },
          ],
          body: {
            data: base64UrlEncode('Body'),
          },
        },
      };

      const result = parseMessage(message);

      expect(result.cc).toEqual([
        { email: 'cc1@example.com', name: 'cc1@example.com' },
        { email: 'cc2@example.com', name: 'CC Name' },
      ]);
    });

    it('should detect UNREAD label', () => {
      const message: GmailMessage = {
        ...mockMessage,
        labelIds: ['UNREAD', 'INBOX'],
        payload: mockMessage.payload,
      };

      const result = parseMessage(message);
      expect(result.isUnread).toBe(true);
      expect(result.labels).toEqual(['UNREAD', 'INBOX']);
    });

    it('should handle Unicode characters in body', () => {
      const unicodeText = 'Hello 世界 \ud83d\ude00'; // Hello world with emoji
      const message: GmailMessage = {
        ...mockMessage,
        payload: {
          ...mockMessage.payload!,
          body: {
            data: base64UrlEncode(unicodeText),
          },
        },
      };

      const result = parseMessage(message);
      expect(result.body).toBe(unicodeText);
    });

    it('should handle missing body data', () => {
      const message: GmailMessage = {
        ...mockMessage,
        payload: {
          headers: mockMessage.payload!.headers,
        },
      };

      const result = parseMessage(message);
      expect(result.body).toBe('');
    });

    it('should handle invalid date string', () => {
      const message: GmailMessage = {
        ...mockMessage,
        payload: {
          headers: [
            { name: 'From', value: 'sender@example.com' },
            { name: 'To', value: 'recipient@example.com' },
            { name: 'Subject', value: 'Test' },
            { name: 'Date', value: 'invalid-date' },
          ],
          body: {
            data: base64UrlEncode('Body'),
          },
        },
      };

      const result = parseMessage(message);
      expect(result.date).toBeInstanceOf(Date);
    });

    it('should extract name from From header properly', () => {
      const message: GmailMessage = {
        ...mockMessage,
        payload: {
          headers: [
            { name: 'From', value: '"Quoted Name" <email@example.com>' },
            { name: 'To', value: 'recipient@example.com' },
            { name: 'Subject', value: 'Test' },
            { name: 'Date', value: 'Fri, 07 Feb 2025 14:30:00 +0000' },
          ],
          body: {
            data: base64UrlEncode('Body'),
          },
        },
      };

      const result = parseMessage(message);
      expect(result.from.name).toBe('Quoted Name');
      expect(result.from.email).toBe('email@example.com');
    });

    it('should handle multiple To recipients', () => {
      const message: GmailMessage = {
        ...mockMessage,
        payload: {
          headers: [
            { name: 'From', value: 'sender@example.com' },
            { name: 'To', value: 'to1@example.com, To Two <to2@example.com>' },
            { name: 'Subject', value: 'Test' },
            { name: 'Date', value: 'Fri, 07 Feb 2025 14:30:00 +0000' },
          ],
          body: {
            data: base64UrlEncode('Body'),
          },
        },
      };

      const result = parseMessage(message);
      expect(result.to).toHaveLength(2);
      expect(result.to[0].email).toBe('to1@example.com');
      expect(result.to[1].email).toBe('to2@example.com');
      expect(result.to[1].name).toBe('To Two');
    });

    it('should prefer text/plain over text/html', () => {
      const message: GmailMessage = {
        ...mockMessage,
        payload: {
          headers: mockMessage.payload!.headers,
          parts: [
            {
              mimeType: 'text/html',
              body: {
                data: base64UrlEncode('<p>HTML</p>'),
              },
            },
            {
              mimeType: 'text/plain',
              body: {
                data: base64UrlEncode('Plain text'),
              },
            },
          ],
        },
      };

      const result = parseMessage(message);
      expect(result.body).toBe('Plain text');
    });

    it('should handle no snippet gracefully', () => {
      const message: GmailMessage = {
        id: 'msg123',
        threadId: 'thread456',
        payload: {
          headers: mockMessage.payload!.headers,
          body: {
            data: base64UrlEncode('Body'),
          },
        },
      };

      const result = parseMessage(message);
      expect(result.snippet).toBe('');
    });
  });

  describe('extractBodyFromParts', () => {
    it('should extract text/plain body from parts', () => {
      const parts = [
        {
          mimeType: 'text/plain',
          body: {
            data: base64UrlEncode('Plain text'),
          },
        },
      ];

      const result = extractBodyFromParts(parts);
      expect(result).toBe('Plain text');
    });

    it('should extract text/html body from parts', () => {
      const parts = [
        {
          mimeType: 'text/html',
          body: {
            data: base64UrlEncode('<p>HTML</p>'),
          },
        },
      ];

      const result = extractBodyFromParts(parts);
      expect(result).toBe('<p>HTML</p>');
    });

    it('should search nested parts for body', () => {
      const parts = [
        {
          mimeType: 'multipart/mixed',
          parts: [
            {
              mimeType: 'text/plain',
              body: {
                data: base64UrlEncode('Found in nested'),
              },
            },
          ],
        },
      ];

      const result = extractBodyFromParts(parts);
      expect(result).toBe('Found in nested');
    });

    it('should return empty string if no body found', () => {
      const parts = [
        {
          mimeType: 'application/octet-stream',
        },
      ];

      const result = extractBodyFromParts(parts);
      expect(result).toBe('');
    });

    it('should handle empty parts array', () => {
      const result = extractBodyFromParts([]);
      expect(result).toBe('');
    });

    it('should handle deeply nested parts', () => {
      const parts = [
        {
          mimeType: 'multipart/alternative',
          parts: [
            {
              mimeType: 'multipart/mixed',
              parts: [
                {
                  mimeType: 'text/plain',
                  body: {
                    data: base64UrlEncode('Deeply nested'),
                  },
                },
              ],
            },
          ],
        },
      ];

      const result = extractBodyFromParts(parts);
      expect(result).toBe('Deeply nested');
    });

    it('should stop at first matching body', () => {
      const parts = [
        {
          mimeType: 'text/plain',
          body: {
            data: base64UrlEncode('First'),
          },
        },
        {
          mimeType: 'text/plain',
          body: {
            data: base64UrlEncode('Second'),
          },
        },
      ];

      const result = extractBodyFromParts(parts);
      expect(result).toBe('First');
    });
  });
});
