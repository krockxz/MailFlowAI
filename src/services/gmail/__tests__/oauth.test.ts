import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getAuthUrl, exchangeCodeForToken, refreshToken } from '../oauth';

describe('oauth', () => {
  const mockClientId = 'test-client-id.apps.googleusercontent.com';
  const mockClientSecret = 'test-client-secret';
  const mockRedirectUri = 'http://localhost:3000/auth/callback';
  const mockCode = 'test-auth-code';
  const mockRefreshTokenValue = 'test-refresh-token';

  beforeEach(() => {
    // Mock fetch globally
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('getAuthUrl', () => {
    it('should generate OAuth URL with correct parameters', () => {
      const url = getAuthUrl(mockClientId, mockRedirectUri);

      expect(url).toContain('https://accounts.google.com/o/oauth2/v2/auth');
      expect(url).toContain(`client_id=${encodeURIComponent(mockClientId)}`);
      expect(url).toContain(`redirect_uri=${encodeURIComponent(mockRedirectUri)}`);
      expect(url).toContain('response_type=code');
      expect(url).toContain('scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fgmail.modify');
      expect(url).toContain('access_type=offline');
      expect(url).toContain('prompt=consent');
    });

    it('should include state parameter when provided', () => {
      const state = 'random-state-123';
      const url = getAuthUrl(mockClientId, mockRedirectUri, state);

      expect(url).toContain(`state=${state}`);
    });

    it('should not include state parameter when not provided', () => {
      const url = getAuthUrl(mockClientId, mockRedirectUri);

      expect(url).not.toContain('state=');
    });

    it('should handle special characters in redirect URI', () => {
      const redirectUri = 'http://localhost:3000/auth/callback?param=value';
      const url = getAuthUrl(mockClientId, redirectUri);

      expect(url).toContain(`redirect_uri=${encodeURIComponent(redirectUri)}`);
    });
  });

  describe('exchangeCodeForToken', () => {
    it('should exchange code for access token', async () => {
      const mockTokenResponse = {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        expires_in: 3600,
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTokenResponse,
      } as Response);

      const result = await exchangeCodeForToken(
        mockCode,
        mockClientId,
        mockClientSecret,
        mockRedirectUri
      );

      expect(result).toEqual(mockTokenResponse);
      expect(fetch).toHaveBeenCalledWith(
        'https://oauth2.googleapis.com/token',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        })
      );
    });

    it('should include correct parameters in request body', async () => {
      const mockTokenResponse = {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        expires_in: 3600,
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTokenResponse,
      } as Response);

      await exchangeCodeForToken(mockCode, mockClientId, mockClientSecret, mockRedirectUri);

      const callArgs = vi.mocked(fetch).mock.calls[0];
      const body = callArgs[1]?.body as URLSearchParams;

      expect(body?.get('code')).toBe(mockCode);
      expect(body?.get('client_id')).toBe(mockClientId);
      expect(body?.get('client_secret')).toBe(mockClientSecret);
      expect(body?.get('redirect_uri')).toBe(mockRedirectUri);
      expect(body?.get('grant_type')).toBe('authorization_code');
    });

    it('should handle error responses', async () => {
      const errorText = 'invalid_grant';

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        text: async () => errorText,
      } as Response);

      await expect(
        exchangeCodeForToken(mockCode, mockClientId, mockClientSecret, mockRedirectUri)
      ).rejects.toThrow(`Token exchange failed: ${errorText}`);
    });

    it('should handle network errors', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

      await expect(
        exchangeCodeForToken(mockCode, mockClientId, mockClientSecret, mockRedirectUri)
      ).rejects.toThrow('Network error');
    });

    it('should handle responses without refresh token', async () => {
      const mockTokenResponse = {
        access_token: 'test-access-token',
        expires_in: 3600,
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTokenResponse,
      } as Response);

      const result = await exchangeCodeForToken(
        mockCode,
        mockClientId,
        mockClientSecret,
        mockRedirectUri
      );

      expect(result.access_token).toBe('test-access-token');
      expect(result.refresh_token).toBeUndefined();
    });
  });

  describe('refreshToken', () => {
    it('should refresh access token', async () => {
      const mockRefreshResponse = {
        access_token: 'new-access-token',
        expires_in: 3600,
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockRefreshResponse,
      } as Response);

      const result = await refreshToken(mockRefreshTokenValue, mockClientId, mockClientSecret);

      expect(result).toEqual(mockRefreshResponse);
    });

    it('should include correct parameters in request body', async () => {
      const mockRefreshResponse = {
        access_token: 'new-access-token',
        expires_in: 3600,
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockRefreshResponse,
      } as Response);

      await refreshToken(mockRefreshTokenValue, mockClientId, mockClientSecret);

      const callArgs = vi.mocked(fetch).mock.calls[0];
      const body = callArgs[1]?.body as URLSearchParams;

      expect(body?.get('refresh_token')).toBe(mockRefreshTokenValue);
      expect(body?.get('client_id')).toBe(mockClientId);
      expect(body?.get('client_secret')).toBe(mockClientSecret);
      expect(body?.get('grant_type')).toBe('refresh_token');
    });

    it('should handle error responses', async () => {
      const errorText = 'invalid_grant';

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        text: async () => errorText,
      } as Response);

      await expect(
        refreshToken(mockRefreshTokenValue, mockClientId, mockClientSecret)
      ).rejects.toThrow(`Token refresh failed: ${errorText}`);
    });

    it('should handle network errors', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

      await expect(
        refreshToken(mockRefreshTokenValue, mockClientId, mockClientSecret)
      ).rejects.toThrow('Network error');
    });
  });
});
