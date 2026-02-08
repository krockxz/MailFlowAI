import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createApiMethods, type ApiMethods } from '../api';
import { parseMessage } from '../parsers';
import type { GmailMessage } from '@/types/email';

// Mock the parsers module
vi.mock('../parsers', () => ({
  parseMessage: vi.fn(),
}));

describe('api', () => {
  const mockToken = 'test-access-token';
  let apiMethods: ApiMethods;

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    apiMethods = createApiMethods(() => mockToken);
    vi.mocked(parseMessage).mockImplementation((msg: GmailMessage) => ({
      id: msg.id,
      threadId: msg.threadId,
      snippet: msg.snippet || '',
      subject: 'Mock Subject',
      from: { email: 'mock@example.com', name: 'Mock' },
      to: [{ email: 'recipient@example.com', name: 'Recipient' }],
      date: new Date(),
      body: 'Mock body',
      isUnread: false,
      labels: msg.labelIds || [],
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('createApiMethods', () => {
    it('should throw EmailError when no token available', async () => {
      const noTokenApi = createApiMethods(() => null);

      await expect(noTokenApi.getUserProfile()).rejects.toThrow('No access token');
    });
  });

  describe('getUserProfile', () => {
    it('should fetch user profile successfully', async () => {
      const mockProfile = {
        emailAddress: 'test@example.com',
        messagesTotal: 100,
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockProfile,
      } as Response);

      const result = await apiMethods.getUserProfile();

      expect(result).toEqual(mockProfile);
      expect(fetch).toHaveBeenCalledWith(
        'https://www.googleapis.com/gmail/v1/users/me/profile',
        expect.objectContaining({
          headers: {
            Authorization: `Bearer ${mockToken}`,
          },
        })
      );
    });

    it('should handle API errors', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        statusText: 'Unauthorized',
      } as Response);

      await expect(apiMethods.getUserProfile()).rejects.toThrow('Failed to get profile: Unauthorized');
    });
  });

  describe('listMessages', () => {
    it('should list messages with default parameters', async () => {
      const mockResponse = {
        messages: [
          { id: 'msg1', threadId: 'thread1' },
          { id: 'msg2', threadId: 'thread2' },
        ],
        nextPageToken: 'token123',
        resultSizeEstimate: 2,
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await apiMethods.listMessages();

      expect(result.messages).toHaveLength(2);
      expect(result.nextPageToken).toBe('token123');
      expect(result.resultSizeEstimate).toBe(2);
    });

    it('should pass custom labelIds', async () => {
      const mockResponse = {
        messages: [],
        resultSizeEstimate: 0,
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      await apiMethods.listMessages(['SENT'], 50);

      const url = vi.mocked(fetch).mock.calls[0][0] as string;
      expect(url).toContain('labelIds=SENT');
    });

    it('should pass pageToken when provided', async () => {
      const mockResponse = {
        messages: [],
        resultSizeEstimate: 0,
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      await apiMethods.listMessages(['INBOX'], 50, 'pageToken123');

      const url = vi.mocked(fetch).mock.calls[0][0] as string;
      expect(url).toContain('pageToken=pageToken123');
    });

    it('should pass maxResults parameter', async () => {
      const mockResponse = {
        messages: [],
        resultSizeEstimate: 0,
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      await apiMethods.listMessages(['INBOX'], 100);

      const url = vi.mocked(fetch).mock.calls[0][0] as string;
      expect(url).toContain('maxResults=100');
    });
  });

  describe('getMessage', () => {
    it('should fetch a single message', async () => {
      const mockMessage: GmailMessage = {
        id: 'msg123',
        threadId: 'thread456',
        snippet: 'Test snippet',
        payload: {
          headers: [],
        },
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockMessage,
      } as Response);

      const result = await apiMethods.getMessage('msg123');

      expect(result).toEqual(mockMessage);
      expect(fetch).toHaveBeenCalledWith(
        'https://www.googleapis.com/gmail/v1/users/me/messages/msg123',
        expect.objectContaining({
          headers: {
            Authorization: `Bearer ${mockToken}`,
          },
        })
      );
    });

    it('should handle fetch errors', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
      } as Response);

      await expect(apiMethods.getMessage('msg123')).rejects.toThrow('Failed to get message: Not Found');
    });
  });

  describe('getBatchMessages', () => {
    it('should fetch multiple messages in parallel', async () => {
      const mockMessage1: GmailMessage = {
        id: 'msg1',
        threadId: 'thread1',
        payload: { headers: [] },
      };
      const mockMessage2: GmailMessage = {
        id: 'msg2',
        threadId: 'thread2',
        payload: { headers: [] },
      };

      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockMessage1,
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockMessage2,
        } as Response);

      const result = await apiMethods.getBatchMessages(['msg1', 'msg2']);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('msg1');
      expect(result[1].id).toBe('msg2');
    });

    it('should handle errors in batch fetch', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        statusText: 'Error',
      } as Response);

      await expect(apiMethods.getBatchMessages(['msg1'])).rejects.toThrow('Failed to get message: Error');
    });
  });

  describe('searchMessages', () => {
    it('should search messages with query', async () => {
      const mockResponse = {
        messages: [
          { id: 'msg1', threadId: 'thread1' },
        ],
        resultSizeEstimate: 1,
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await apiMethods.searchMessages('from:test@example.com');

      expect(result.messages).toHaveLength(1);
      const url = vi.mocked(fetch).mock.calls[0][0] as string;
      expect(url).toContain('q=from%3Atest%40example.com');
    });

    it('should pass maxResults parameter', async () => {
      const mockResponse = {
        messages: [],
        resultSizeEstimate: 0,
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      await apiMethods.searchMessages('test', 100);

      const url = vi.mocked(fetch).mock.calls[0][0] as string;
      expect(url).toContain('maxResults=100');
    });

    it('should handle search errors', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        statusText: 'Bad Request',
      } as Response);

      await expect(apiMethods.searchMessages('test')).rejects.toThrow('Search failed: Bad Request');
    });
  });

  describe('sendEmail', () => {
    it('should send email successfully', async () => {
      const mockResponse = {
        id: 'sent-msg-123',
        threadId: 'thread-456',
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await apiMethods.sendEmail({
        to: ['recipient@example.com'],
        subject: 'Test Subject',
        body: 'Test body',
      });

      expect(result.id).toBe('sent-msg-123');
      expect(result.threadId).toBe('thread-456');
    });

    it('should include CC recipients', async () => {
      const mockResponse = {
        id: 'sent-msg-123',
        threadId: 'thread-456',
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      await apiMethods.sendEmail({
        to: ['recipient@example.com'],
        subject: 'Test',
        body: 'Body',
        cc: ['cc@example.com'],
      });

      const callArgs = vi.mocked(fetch).mock.calls[0];
      const body = JSON.parse(callArgs[1]?.body as string);
      expect(body.raw).toBeTruthy();
    });

    it('should include BCC recipients', async () => {
      const mockResponse = {
        id: 'sent-msg-123',
        threadId: 'thread-456',
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      await apiMethods.sendEmail({
        to: ['recipient@example.com'],
        subject: 'Test',
        body: 'Body',
        bcc: ['bcc@example.com'],
      });

      expect(fetch).toHaveBeenCalled();
    });

    it('should include thread headers for replies', async () => {
      const mockResponse = {
        id: 'sent-msg-123',
        threadId: 'thread-456',
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      await apiMethods.sendEmail({
        to: ['recipient@example.com'],
        subject: 'Test',
        body: 'Body',
        threadId: 'original-thread-123',
      });

      const callArgs = vi.mocked(fetch).mock.calls[0];
      const body = JSON.parse(callArgs[1]?.body as string);
      expect(body.threadId).toBe('original-thread-123');
    });

    it('should handle send errors', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        text: async () => 'Send failed',
      } as Response);

      await expect(
        apiMethods.sendEmail({
          to: ['recipient@example.com'],
          subject: 'Test',
          body: 'Body',
        })
      ).rejects.toThrow('Failed to send email:');
    });

    it('should encode subject properly', async () => {
      const mockResponse = {
        id: 'sent-msg-123',
        threadId: 'thread-456',
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      await apiMethods.sendEmail({
        to: ['recipient@example.com'],
        subject: 'Test Subject with Unicode: \u4e2d\u6587',
        body: 'Body',
      });

      expect(fetch).toHaveBeenCalled();
    });
  });

  describe('modifyMessage', () => {
    it('should modify message labels', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
      } as Response);

      await expect(
        apiMethods.modifyMessage('msg123', ['STARRED'], ['UNREAD'])
      ).resolves.not.toThrow();

      const callArgs = vi.mocked(fetch).mock.calls[0];
      expect(callArgs[0]).toContain('/messages/msg123/modify');
      const body = JSON.parse(callArgs[1]?.body as string);
      expect(body.addLabelIds).toEqual(['STARRED']);
      expect(body.removeLabelIds).toEqual(['UNREAD']);
    });

    it('should handle modify errors', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
      } as Response);

      await expect(
        apiMethods.modifyMessage('msg123', ['LABEL'])
      ).rejects.toThrow('Failed to modify message: Not Found');
    });
  });

  describe('markAsRead', () => {
    it('should mark message as read', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
      } as Response);

      await apiMethods.markAsRead('msg123');

      const callArgs = vi.mocked(fetch).mock.calls[0];
      const body = JSON.parse(callArgs[1]?.body as string);
      expect(body.removeLabelIds).toEqual(['UNREAD']);
      expect(body.addLabelIds).toEqual([]);
    });
  });

  describe('markAsUnread', () => {
    it('should mark message as unread', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
      } as Response);

      await apiMethods.markAsUnread('msg123');

      const callArgs = vi.mocked(fetch).mock.calls[0];
      const body = JSON.parse(callArgs[1]?.body as string);
      expect(body.addLabelIds).toEqual(['UNREAD']);
      expect(body.removeLabelIds).toEqual([]);
    });
  });

  describe('watch', () => {
    it('should set up watch for push notifications', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
      } as Response);

      await apiMethods.watch('projects/my-project/topics/my-topic');

      const callArgs = vi.mocked(fetch).mock.calls[0];
      expect(callArgs[0]).toContain('/users/me/watch');
      const body = JSON.parse(callArgs[1]?.body as string);
      expect(body.topicName).toBe('projects/my-project/topics/my-topic');
      expect(body.labelIds).toEqual(['INBOX']);
    });

    it('should handle watch errors', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        text: async () => 'Watch setup failed',
      } as Response);

      await expect(apiMethods.watch('topic-name')).rejects.toThrow('Failed to set up watch:');
    });
  });

  describe('stop', () => {
    it('should stop watching for push notifications', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
      } as Response);

      await apiMethods.stop();

      expect(fetch).toHaveBeenCalledWith(
        'https://www.googleapis.com/gmail/v1/users/me/stop',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('should handle stop errors', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        statusText: 'Error',
      } as Response);

      await expect(apiMethods.stop()).rejects.toThrow('Failed to stop watch: Error');
    });
  });

  describe('getThread', () => {
    it('should fetch and parse thread messages', async () => {
      const mockThreadResponse = {
        messages: [
          {
            id: 'msg1',
            threadId: 'thread1',
            snippet: 'First message',
            payload: { headers: [] },
          },
          {
            id: 'msg2',
            threadId: 'thread1',
            snippet: 'Second message',
            payload: { headers: [] },
          },
        ],
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockThreadResponse,
      } as Response);

      const result = await apiMethods.getThread('thread1');

      expect(result).toHaveLength(2);
      expect(parseMessage).toHaveBeenCalledTimes(2);
    });

    it('should return empty array if no messages', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      } as Response);

      const result = await apiMethods.getThread('thread1');

      expect(result).toEqual([]);
    });

    it('should handle thread fetch errors', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
      } as Response);

      await expect(apiMethods.getThread('thread1')).rejects.toThrow('Failed to get thread: Not Found');
    });
  });
});
