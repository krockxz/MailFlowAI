import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as auth from '../auth';
import { storeToken, getToken, setTimestamp, getTimestamp, clearAllTokens } from '@/lib/token-storage';

// Mock token-storage module
vi.mock('@/lib/token-storage', () => ({
  storeToken: vi.fn(),
  getToken: vi.fn(),
  setTimestamp: vi.fn(),
  getTimestamp: vi.fn(),
  clearAllTokens: vi.fn(),
}));

// Mock GmailService with a proper class
vi.mock('../gmail', () => {
  const getUserProfile = vi.fn(() => Promise.resolve({ emailAddress: 'user@example.com', messagesTotal: 100 }));
  return {
    GmailService: class {
      constructor(token) {
        this.accessToken = token;
      }
      accessToken = '';
      getUserProfile = getUserProfile;
      static exchangeCodeForToken = vi.fn();
      static refreshToken = vi.fn();
      static getAuthUrl = vi.fn((clientId, redirectUri, state) =>
        `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}${state ? `&state=${state}` : ''}`
      );
    },
  };
});

describe('auth service', () => {
  let GmailService: any;

  beforeEach(async () => {
    // Get mocked GmailService class
    const gmailModule = await import('../gmail');
    GmailService = gmailModule.GmailService;

    vi.clearAllMocks();
    // Mock sessionStorage
    vi.stubGlobal('sessionStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    });
    // Mock window.location
    vi.stubGlobal('location', { href: '', origin: 'http://localhost:3000' });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('getOAuthConfig', () => {
    it('should return config from environment variables', () => {
      const config = auth.getOAuthConfig();

      // Just verify the structure, values come from actual env
      expect(config).toHaveProperty('clientId');
      expect(config).toHaveProperty('clientSecret');
      expect(config).toHaveProperty('redirectUri');
      expect(typeof config.clientId).toBe('string');
      expect(typeof config.clientSecret).toBe('string');
      expect(typeof config.redirectUri).toBe('string');
    });
  });

  describe('generateState', () => {
    it('should generate a random state string', () => {
      const state1 = auth.generateState();
      const state2 = auth.generateState();

      expect(state1).toBeTruthy();
      expect(state2).toBeTruthy();
      expect(state1).not.toBe(state2);
    });

    it('should generate string of expected length', () => {
      const state = auth.generateState();

      // Two random strings of 11 chars each = 22 chars
      expect(state.length).toBe(22);
    });

    it('should contain only alphanumeric characters', () => {
      const state = auth.generateState();

      expect(state).toMatch(/^[a-z0-9]+$/i);
    });
  });

  describe('storeOAuthState and verifyOAuthState', () => {
    it('should store and verify OAuth state', () => {
      const state = 'test-state-123';
      const mockTimestamp = Date.now().toString();

      vi.mocked(sessionStorage.getItem).mockImplementation((key) => {
        if (key === 'oauth_state') return state;
        if (key === 'oauth_timestamp') return mockTimestamp;
        return null;
      });

      auth.storeOAuthState(state);

      expect(sessionStorage.setItem).toHaveBeenCalledWith('oauth_state', state);
      expect(sessionStorage.setItem).toHaveBeenCalledWith('oauth_timestamp', expect.any(String));

      const result = auth.verifyOAuthState(state);
      expect(result).toBe(true);
    });

    it('should return false for wrong state', () => {
      vi.mocked(sessionStorage.getItem).mockImplementation((key) => {
        if (key === 'oauth_state') return 'different-state';
        if (key === 'oauth_timestamp') return Date.now().toString();
        return null;
      });

      const result = auth.verifyOAuthState('test-state');
      expect(result).toBe(false);
    });

    it('should return false when state is missing', () => {
      vi.mocked(sessionStorage.getItem).mockReturnValue(null);

      const result = auth.verifyOAuthState('any-state');
      expect(result).toBe(false);
    });

    it('should return false when timestamp is missing', () => {
      vi.mocked(sessionStorage.getItem).mockImplementation((key) => {
        if (key === 'oauth_state') return 'test-state';
        return null;
      });

      const result = auth.verifyOAuthState('test-state');
      expect(result).toBe(false);
    });

    it('should return false for expired state (older than 10 minutes)', () => {
      const expiredTimestamp = (Date.now() - 11 * 60 * 1000).toString();

      vi.mocked(sessionStorage.getItem).mockImplementation((key) => {
        if (key === 'oauth_state') return 'test-state';
        if (key === 'oauth_timestamp') return expiredTimestamp;
        return null;
      });

      const result = auth.verifyOAuthState('test-state');
      expect(result).toBe(false);
    });

    it('should clear state on expiration', () => {
      const expiredTimestamp = (Date.now() - 11 * 60 * 1000).toString();

      vi.mocked(sessionStorage.getItem).mockImplementation((key) => {
        if (key === 'oauth_state') return 'test-state';
        if (key === 'oauth_timestamp') return expiredTimestamp;
        return null;
      });

      auth.verifyOAuthState('test-state');

      expect(sessionStorage.removeItem).toHaveBeenCalledWith('oauth_state');
      expect(sessionStorage.removeItem).toHaveBeenCalledWith('oauth_timestamp');
    });

    it('should accept state within 10 minutes', () => {
      const recentTimestamp = (Date.now() - 5 * 60 * 1000).toString();

      vi.mocked(sessionStorage.getItem).mockImplementation((key) => {
        if (key === 'oauth_state') return 'test-state';
        if (key === 'oauth_timestamp') return recentTimestamp;
        return null;
      });

      const result = auth.verifyOAuthState('test-state');
      expect(result).toBe(true);
    });
  });

  describe('clearOAuthState', () => {
    it('should clear OAuth state from sessionStorage', () => {
      auth.clearOAuthState();

      expect(sessionStorage.removeItem).toHaveBeenCalledWith('oauth_state');
      expect(sessionStorage.removeItem).toHaveBeenCalledWith('oauth_timestamp');
    });
  });

  describe('storeTokens and getStoredAccessToken', () => {
    it('should store access and refresh tokens', () => {
      auth.storeTokens('access-token-123', 'refresh-token-456');

      expect(storeToken).toHaveBeenCalledWith('access', 'access-token-123');
      expect(storeToken).toHaveBeenCalledWith('refresh', 'refresh-token-456');
      expect(setTimestamp).toHaveBeenCalled();
    });

    it('should store only access token when refresh token not provided', () => {
      auth.storeTokens('access-token-123');

      expect(storeToken).toHaveBeenCalledWith('access', 'access-token-123');
      expect(storeToken).not.toHaveBeenCalledWith('refresh', expect.any(String));
    });

    it('should retrieve stored access token', () => {
      vi.mocked(getToken).mockReturnValue('stored-access-token');

      const token = auth.getStoredAccessToken();

      expect(getToken).toHaveBeenCalledWith('access');
      expect(token).toBe('stored-access-token');
    });

    it('should return null when no access token stored', () => {
      vi.mocked(getToken).mockReturnValue(null);

      const token = auth.getStoredAccessToken();

      expect(token).toBeNull();
    });
  });

  describe('isTokenExpired', () => {
    it('should return true when no timestamp', () => {
      vi.mocked(getTimestamp).mockReturnValue(null);

      const result = auth.isTokenExpired();

      expect(result).toBe(true);
    });

    it('should return false for fresh token (< 55 minutes)', () => {
      const freshTimestamp = Date.now() - 30 * 60 * 1000; // 30 minutes ago
      vi.mocked(getTimestamp).mockReturnValue(freshTimestamp);

      const result = auth.isTokenExpired();

      expect(result).toBe(false);
    });

    it('should return true for expired token (> 55 minutes)', () => {
      const expiredTimestamp = Date.now() - 60 * 60 * 1000; // 60 minutes ago
      vi.mocked(getTimestamp).mockReturnValue(expiredTimestamp);

      const result = auth.isTokenExpired();

      expect(result).toBe(true);
    });

    it('should return false at exactly 55 minutes', () => {
      const edgeTimestamp = Date.now() - 55 * 60 * 1000; // exactly 55 minutes
      vi.mocked(getTimestamp).mockReturnValue(edgeTimestamp);

      const result = auth.isTokenExpired();

      expect(result).toBe(false);
    });
  });

  describe('refreshAccessToken', () => {
    beforeEach(() => {
      vi.mocked(getToken).mockImplementation((type) => {
        if (type === 'refresh') return 'stored-refresh-token';
        return null;
      });
    });

    it('should refresh access token successfully', async () => {
      const mockTokens = {
        access_token: 'new-access-token',
        expires_in: 3600,
      };

      GmailService.refreshToken.mockResolvedValue(mockTokens);

      const result = await auth.refreshAccessToken();

      expect(result).toBe('new-access-token');
      expect(GmailService.refreshToken).toHaveBeenCalledWith(
        'stored-refresh-token',
        expect.any(String),
        expect.any(String)
      );
      expect(storeToken).toHaveBeenCalledWith('access', 'new-access-token');
    });

    it('should throw error when no refresh token', async () => {
      vi.mocked(getToken).mockImplementation((type) => {
        if (type === 'refresh') return null;
        return null;
      });

      await expect(auth.refreshAccessToken()).rejects.toThrow('No refresh token available');
    });

    it('should handle refresh errors', async () => {
      vi.mocked(getToken).mockImplementation((type) => {
        if (type === 'refresh') return 'invalid-refresh-token';
        return null;
      });

      GmailService.refreshToken.mockRejectedValue(new Error('Invalid refresh token'));

      await expect(auth.refreshAccessToken()).rejects.toThrow('Invalid refresh token');
    });
  });

  describe('getValidAccessToken', () => {
    beforeEach(() => {
      vi.mocked(getToken).mockImplementation((type) => {
        if (type === 'access') return 'stored-access-token';
        if (type === 'refresh') return 'stored-refresh-token';
        return null;
      });
    });

    it('should return existing token if not expired', async () => {
      const freshTimestamp = Date.now() - 30 * 60 * 1000;
      vi.mocked(getTimestamp).mockReturnValue(freshTimestamp);

      GmailService.refreshToken.mockResolvedValue({
        access_token: 'new-access-token',
        expires_in: 3600,
      });

      const result = await auth.getValidAccessToken();

      expect(result).toBe('stored-access-token');
      expect(GmailService.refreshToken).not.toHaveBeenCalled();
    });

    it('should refresh if token expired', async () => {
      const expiredTimestamp = Date.now() - 60 * 60 * 1000;
      vi.mocked(getTimestamp).mockReturnValue(expiredTimestamp);

      GmailService.refreshToken.mockResolvedValue({
        access_token: 'new-access-token',
        expires_in: 3600,
      });

      const result = await auth.getValidAccessToken();

      expect(result).toBe('new-access-token');
      expect(GmailService.refreshToken).toHaveBeenCalled();
    });

    it('should refresh if no token stored', async () => {
      vi.mocked(getToken).mockImplementation((type) => {
        if (type === 'access') return null;
        if (type === 'refresh') return 'stored-refresh-token';
        return null;
      });

      GmailService.refreshToken.mockResolvedValue({
        access_token: 'new-access-token',
        expires_in: 3600,
      });

      const result = await auth.getValidAccessToken();

      expect(result).toBe('new-access-token');
      expect(GmailService.refreshToken).toHaveBeenCalled();
    });
  });

  describe('clearTokens', () => {
    it('should clear all tokens', () => {
      auth.clearTokens();

      expect(clearAllTokens).toHaveBeenCalled();
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when token exists and not expired', () => {
      vi.mocked(getToken).mockReturnValue('valid-token');
      vi.mocked(getTimestamp).mockReturnValue(Date.now() - 30 * 60 * 1000);

      const result = auth.isAuthenticated();

      expect(result).toBe(true);
    });

    it('should return false when no token', () => {
      vi.mocked(getToken).mockReturnValue(null);

      const result = auth.isAuthenticated();

      expect(result).toBe(false);
    });

    it('should return false when token expired', () => {
      vi.mocked(getToken).mockReturnValue('expired-token');
      vi.mocked(getTimestamp).mockReturnValue(Date.now() - 60 * 60 * 1000);

      const result = auth.isAuthenticated();

      expect(result).toBe(false);
    });
  });

  describe('initiateOAuth', () => {
    it('should generate state and redirect to OAuth URL', () => {
      auth.initiateOAuth();

      expect(sessionStorage.setItem).toHaveBeenCalledWith('oauth_state', expect.any(String));
      expect(sessionStorage.setItem).toHaveBeenCalledWith('oauth_timestamp', expect.any(String));
      expect(location.href).toContain('https://accounts.google.com/o/oauth2/v2/auth');
      expect(location.href).toContain('client_id=');
      expect(location.href).toContain('redirect_uri=');
      expect(location.href).toContain('state=');
    });
  });

  describe('handleOAuthCallback', () => {
    beforeEach(() => {
      vi.mocked(sessionStorage.getItem).mockImplementation((key) => {
        if (key === 'oauth_state') return 'test-state';
        if (key === 'oauth_timestamp') return Date.now().toString();
        return null;
      });
    });

    it('should exchange code and return tokens', async () => {
      const mockTokens = {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        expires_in: 3600,
      };

      GmailService.exchangeCodeForToken.mockResolvedValue(mockTokens);

      const result = await auth.handleOAuthCallback('auth-code-123', 'test-state');

      expect(result).toEqual({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        userProfile: { emailAddress: 'user@example.com' },
      });
      expect(GmailService.exchangeCodeForToken).toHaveBeenCalledWith(
        'auth-code-123',
        expect.any(String),
        expect.any(String),
        expect.any(String)
      );
    });

    it('should throw error for invalid state', async () => {
      await expect(auth.handleOAuthCallback('auth-code', 'wrong-state')).rejects.toThrow('Invalid OAuth state');
    });

    it('should clear OAuth state after verification', async () => {
      const mockTokens = {
        access_token: 'token',
        refresh_token: 'refresh',
        expires_in: 3600,
      };

      GmailService.exchangeCodeForToken.mockResolvedValue(mockTokens);

      await auth.handleOAuthCallback('auth-code', 'test-state');

      // State is cleared inside verifyOAuthState when verified
      expect(sessionStorage.removeItem).toHaveBeenCalledWith('oauth_state');
      expect(sessionStorage.removeItem).toHaveBeenCalledWith('oauth_timestamp');
    });
  });
});
