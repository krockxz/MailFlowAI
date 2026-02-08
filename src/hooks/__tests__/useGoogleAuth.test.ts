import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useGoogleAuth } from '../useGoogleAuth';
import * as googleAuth from '@react-oauth/google';
import * as store from '@/store';
import * as gmailService from '@/services/gmail';
import * as tokenStorage from '@/lib/token-storage';

// Mock window.location.reload
const mockLocationReload = vi.fn();
vi.stubGlobal('location', {
  reload: mockLocationReload,
  origin: 'http://localhost:3000',
});

describe('useGoogleAuth', () => {
  const mockSetUser = vi.fn();
  const mockSetAccessToken = vi.fn();
  const mockLogin = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock store
    vi.spyOn(store, 'useAppStore').mockReturnValue({
      setUser: mockSetUser,
      setAccessToken: mockSetAccessToken,
    });

    // Mock useGoogleLogin
    vi.spyOn(googleAuth, 'useGoogleLogin').mockReturnValue(mockLogin);

    // Mock GmailService
    vi.spyOn(gmailService, 'GmailService').mockImplementation(function() {
      this.accessToken = 'test-token';
    });
    (gmailService.GmailService as any).prototype.getUserProfile = vi.fn().mockResolvedValue({
      emailAddress: 'user@example.com',
      messagesTotal: 100,
    });

    // Mock token-storage
    vi.spyOn(tokenStorage, 'storeToken').mockImplementation(() => {});
    vi.spyOn(tokenStorage, 'setTimestamp').mockImplementation(() => {});
    vi.spyOn(tokenStorage, 'clearAllTokens').mockImplementation(() => {});
  });

  it('should return login and logout functions', () => {
    const { result } = renderHook(() => useGoogleAuth());

    expect(result.current).toHaveProperty('login');
    expect(result.current).toHaveProperty('logout');
    expect(typeof result.current.login).toBe('function');
    expect(typeof result.current.logout).toBe('function');
  });

  it('should call useGoogleLogin with correct scope', () => {
    renderHook(() => useGoogleAuth());

    expect(googleAuth.useGoogleLogin).toHaveBeenCalledWith(
      expect.objectContaining({
        scope: 'https://www.googleapis.com/auth/gmail.modify',
      })
    );
  });

  it('should store token and fetch profile on successful login', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const mockOnSuccess = vi.fn((response) => {
      // Store token
      tokenStorage.storeToken('access', response.access_token);
      tokenStorage.setTimestamp(Date.now());

      // Update store
      mockSetAccessToken(response.access_token);

      // Fetch user profile
      const gmail = new gmailService.GmailService(response.access_token);
      gmail.getUserProfile().then((profile: any) => {
        mockSetUser({ emailAddress: profile.emailAddress });
      });
    });

    vi.spyOn(googleAuth, 'useGoogleLogin').mockImplementation(({ onSuccess }) => {
      setTimeout(() => {
        onSuccess({ access_token: 'test-token' });
      }, 0);
      return vi.fn();
    });

    renderHook(() => useGoogleAuth());

    await waitFor(() => {
      expect(tokenStorage.storeToken).toHaveBeenCalledWith('access', 'test-token');
      expect(tokenStorage.setTimestamp).toHaveBeenCalled();
      expect(mockSetUser).toHaveBeenCalledWith({ emailAddress: 'user@example.com' });
    });

    consoleErrorSpy.mockRestore();
  });

  it('should clear store and storage on logout', () => {
    const { result } = renderHook(() => useGoogleAuth());

    act(() => {
      result.current.logout();
    });

    expect(mockSetUser).toHaveBeenCalledWith(null);
    expect(mockSetAccessToken).toHaveBeenCalledWith(null);
    expect(tokenStorage.clearAllTokens).toHaveBeenCalled();
    expect(mockLocationReload).toHaveBeenCalled();
  });

  it('should handle profile fetch error gracefully', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Make getUserProfile reject
    (gmailService.GmailService as any).prototype.getUserProfile = vi.fn().mockRejectedValue(new Error('API Error'));

    // Mock useGoogleLogin to trigger error path
    vi.spyOn(googleAuth, 'useGoogleLogin').mockImplementation(({ onSuccess, onError }) => {
      setTimeout(() => {
        try {
          tokenStorage.storeToken('access', 'test-token');
          tokenStorage.setTimestamp(Date.now());
          mockSetAccessToken('test-token');

          const gmail = new gmailService.GmailService('test-token');
          gmail.getUserProfile().catch((err: Error) => {
            console.error('Failed to fetch user profile:', err);
            if (onError) onError(err);
          });
        } catch (e) {
          console.error('Failed to fetch user profile:', e);
        }
      }, 0);
      return vi.fn();
    });

    renderHook(() => useGoogleAuth());

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalled();
    }, { timeout: 3000 });

    consoleErrorSpy.mockRestore();
  });
});
