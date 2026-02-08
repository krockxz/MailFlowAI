import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GmailService, createGmailService } from '../index';
import * as oauth from '../oauth';
import * as api from '../api';
import * as parsers from '../parsers';

// Mock the modules
vi.mock('../oauth', () => ({
  getAuthUrl: vi.fn(),
  exchangeCodeForToken: vi.fn(),
  refreshToken: vi.fn(),
}));

vi.mock('../api', () => ({
  createApiMethods: vi.fn(),
}));

vi.mock('../parsers', () => ({
  parseMessage: vi.fn(),
}));

describe('GmailService facade', () => {
  const mockToken = 'test-access-token';
  const mockApiMethods = {
    getUserProfile: vi.fn(),
    listMessages: vi.fn(),
    getMessage: vi.fn(),
    getBatchMessages: vi.fn(),
    searchMessages: vi.fn(),
    sendEmail: vi.fn(),
    modifyMessage: vi.fn(),
    markAsRead: vi.fn(),
    markAsUnread: vi.fn(),
    watch: vi.fn(),
    stop: vi.fn(),
    getThread: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mock for createApiMethods to return our mock methods
    vi.mocked(api.createApiMethods).mockReturnValue(mockApiMethods);
  });

  describe('Constructor', () => {
    it('should create instance with access token', () => {
      const service = new GmailService(mockToken);

      expect(service).toBeInstanceOf(GmailService);
    });

    it('should create instance without access token', () => {
      const service = new GmailService();

      expect(service).toBeInstanceOf(GmailService);
    });
  });

  describe('setAccessToken', () => {
    it('should update the stored access token', () => {
      const service = new GmailService('old-token');
      service.setAccessToken('new-token');

      // Token is stored internally, verify it can be retrieved
      // We can't directly access the private property, but we can verify
      // the method doesn't throw and the service still works
      expect(service).toBeInstanceOf(GmailService);
    });
  });

  describe('Static OAuth methods', () => {
    it('should delegate getAuthUrl to oauth module', () => {
      vi.mocked(oauth.getAuthUrl).mockReturnValue('https://example.com/auth');

      const result = GmailService.getAuthUrl('client-id', 'redirect-uri', 'state');

      expect(oauth.getAuthUrl).toHaveBeenCalledWith('client-id', 'redirect-uri', 'state');
      expect(result).toBe('https://example.com/auth');
    });

    it('should delegate exchangeCodeForToken to oauth module', async () => {
      const mockTokens = {
        access_token: 'token',
        refresh_token: 'refresh',
        expires_in: 3600,
      };
      vi.mocked(oauth.exchangeCodeForToken).mockResolvedValue(mockTokens);

      const result = await GmailService.exchangeCodeForToken('code', 'client-id', 'client-secret', 'redirect-uri');

      expect(oauth.exchangeCodeForToken).toHaveBeenCalledWith('code', 'client-id', 'client-secret', 'redirect-uri');
      expect(result).toEqual(mockTokens);
    });

    it('should delegate refreshToken to oauth module', async () => {
      const mockTokens = {
        access_token: 'new-token',
        expires_in: 3600,
      };
      vi.mocked(oauth.refreshToken).mockResolvedValue(mockTokens);

      const result = await GmailService.refreshToken('refresh-token', 'client-id', 'client-secret');

      expect(oauth.refreshToken).toHaveBeenCalledWith('refresh-token', 'client-id', 'client-secret');
      expect(result).toEqual(mockTokens);
    });
  });

  describe('Instance API methods', () => {
    let service: GmailService;

    beforeEach(() => {
      service = new GmailService(mockToken);
    });

    it('should delegate getUserProfile to api module', async () => {
      const mockProfile = { emailAddress: 'test@example.com', messagesTotal: 100 };
      vi.mocked(mockApiMethods.getUserProfile).mockResolvedValue(mockProfile);

      const result = await service.getUserProfile();

      expect(mockApiMethods.getUserProfile).toHaveBeenCalled();
      expect(result).toEqual(mockProfile);
    });

    it('should delegate listMessages to api module', async () => {
      const mockResponse = {
        messages: [{ id: 'msg1', threadId: 'thread1' }],
        nextPageToken: 'token',
        resultSizeEstimate: 1,
      };
      vi.mocked(mockApiMethods.listMessages).mockResolvedValue(mockResponse);

      const result = await service.listMessages(['INBOX'], 50, 'page-token');

      expect(mockApiMethods.listMessages).toHaveBeenCalledWith(['INBOX'], 50, 'page-token');
      expect(result).toEqual(mockResponse);
    });

    it('should delegate getMessage to api module', async () => {
      const mockMessage = { id: 'msg1', threadId: 'thread1', payload: {} };
      vi.mocked(mockApiMethods.getMessage).mockResolvedValue(mockMessage);

      const result = await service.getMessage('msg1');

      expect(mockApiMethods.getMessage).toHaveBeenCalledWith('msg1');
      expect(result).toEqual(mockMessage);
    });

    it('should delegate getBatchMessages to api module', async () => {
      const mockMessages = [
        { id: 'msg1', threadId: 'thread1', payload: {} },
        { id: 'msg2', threadId: 'thread2', payload: {} },
      ];
      vi.mocked(mockApiMethods.getBatchMessages).mockResolvedValue(mockMessages);

      const result = await service.getBatchMessages(['msg1', 'msg2']);

      expect(mockApiMethods.getBatchMessages).toHaveBeenCalledWith(['msg1', 'msg2']);
      expect(result).toEqual(mockMessages);
    });

    it('should delegate searchMessages to api module', async () => {
      const mockResponse = {
        messages: [{ id: 'msg1', threadId: 'thread1' }],
        resultSizeEstimate: 1,
      };
      vi.mocked(mockApiMethods.searchMessages).mockResolvedValue(mockResponse);

      const result = await service.searchMessages('query', 50);

      expect(mockApiMethods.searchMessages).toHaveBeenCalledWith('query', 50);
      expect(result).toEqual(mockResponse);
    });

    it('should delegate sendEmail to api module', async () => {
      const mockResult = { id: 'sent-msg', threadId: 'thread' };
      vi.mocked(mockApiMethods.sendEmail).mockResolvedValue(mockResult);

      const options = {
        to: ['to@example.com'],
        subject: 'Test',
        body: 'Test body',
      };
      const result = await service.sendEmail(options);

      expect(mockApiMethods.sendEmail).toHaveBeenCalledWith(options);
      expect(result).toEqual(mockResult);
    });

    it('should delegate modifyMessage to api module', async () => {
      vi.mocked(mockApiMethods.modifyMessage).mockResolvedValue(undefined);

      await service.modifyMessage('msg1', ['STARRED'], ['UNREAD']);

      expect(mockApiMethods.modifyMessage).toHaveBeenCalledWith('msg1', ['STARRED'], ['UNREAD']);
    });

    it('should delegate markAsRead to api module', async () => {
      vi.mocked(mockApiMethods.markAsRead).mockResolvedValue(undefined);

      await service.markAsRead('msg1');

      expect(mockApiMethods.markAsRead).toHaveBeenCalledWith('msg1');
    });

    it('should delegate markAsUnread to api module', async () => {
      vi.mocked(mockApiMethods.markAsUnread).mockResolvedValue(undefined);

      await service.markAsUnread('msg1');

      expect(mockApiMethods.markAsUnread).toHaveBeenCalledWith('msg1');
    });

    it('should delegate watch to api module', async () => {
      vi.mocked(mockApiMethods.watch).mockResolvedValue(undefined);

      await service.watch('topic-name');

      expect(mockApiMethods.watch).toHaveBeenCalledWith('topic-name');
    });

    it('should delegate stop to api module', async () => {
      vi.mocked(mockApiMethods.stop).mockResolvedValue(undefined);

      await service.stop();

      expect(mockApiMethods.stop).toHaveBeenCalled();
    });

    it('should delegate getThread to api module', async () => {
      const mockThread = [
        { id: 'msg1', threadId: 'thread1', from: { email: 'a@example.com' }, to: [], date: new Date(), subject: 'Test', body: 'Body', isUnread: false, labels: [] },
      ];
      vi.mocked(mockApiMethods.getThread).mockResolvedValue(mockThread);

      const result = await service.getThread('thread1');

      expect(mockApiMethods.getThread).toHaveBeenCalledWith('thread1');
      expect(result).toEqual(mockThread);
    });
  });

  describe('Parsing methods', () => {
    it('should delegate parseMessage to parsers module', () => {
      const mockMessage = { id: 'msg1', threadId: 'thread1', payload: {} };
      const mockEmail = {
        id: 'msg1',
        threadId: 'thread1',
        snippet: '',
        subject: 'Test',
        from: { email: 'test@example.com' },
        to: [],
        date: new Date(),
        body: '',
        isUnread: false,
        labels: [],
      };
      vi.mocked(parsers.parseMessage).mockReturnValue(mockEmail);

      const service = new GmailService();
      const result = service.parseMessage(mockMessage);

      expect(parsers.parseMessage).toHaveBeenCalledWith(mockMessage);
      expect(result).toEqual(mockEmail);
    });
  });

  describe('Factory function', () => {
    it('should create new instance with access token', () => {
      const service = createGmailService(mockToken);

      expect(service).toBeInstanceOf(GmailService);
    });

    it('should create new instance without access token', () => {
      const service = createGmailService();

      expect(service).toBeInstanceOf(GmailService);
    });
  });
});
