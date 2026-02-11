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
    } as any);

    // Mock useGoogleLogin
    vi.spyOn(googleAuth, 'useGoogleLogin').mockReturnValue(mockLogin);

    // Mock GmailService
    const MockGmailService = class {
      accessToken: string;
      constructor(token: string) {
        this.accessToken = token;
      }
      getUserProfile = vi.fn().mockResolvedValue({
        emailAddress: 'user@example.com',
        messagesTotal: 100,
      });
    };
    vi.spyOn(gmailService, 'GmailService').mockImplementation(MockGmailService as any);

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

    vi.spyOn(googleAuth, 'useGoogleLogin').mockImplementation(({ onSuccess }) => {
      setTimeout(() => {
        if (onSuccess) onSuccess({ access_token: 'test-token' } as any);
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
});
