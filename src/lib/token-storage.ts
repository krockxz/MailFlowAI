import { createTokenError, logError } from './errors';

export type TokenType = 'access' | 'refresh';

const STORAGE_KEYS = {
  access: 'gmail_access_token',
  refresh: 'gmail_refresh_token',
  timestamp: 'gmail_token_timestamp',
} as const;

export interface TokenStorage {
  storeToken(type: TokenType, value: string): void;
  getToken(type: TokenType): string | null;
  setTimestamp(timestamp: number): void;
  getTimestamp(): number | null;
  clearAll(): void;
}

class SessionStorageTokenStorage implements TokenStorage {
  storeToken(type: TokenType, value: string): void {
    try {
      sessionStorage.setItem(STORAGE_KEYS[type], value);
    } catch (error) {
      logError(createTokenError({ userMessage: `Failed to store ${type} token.`, originalError: error instanceof Error ? error : undefined }));
    }
  }

  getToken(type: TokenType): string | null {
    try {
      return sessionStorage.getItem(STORAGE_KEYS[type]);
    } catch (error) {
      logError(createTokenError({ userMessage: `Failed to retrieve ${type} token.`, originalError: error instanceof Error ? error : undefined }));
      return null;
    }
  }

  setTimestamp(timestamp: number): void {
    try {
      sessionStorage.setItem(STORAGE_KEYS.timestamp, timestamp.toString());
    } catch (error) {
      logError(createTokenError({ userMessage: 'Failed to store token timestamp.', originalError: error instanceof Error ? error : undefined }));
    }
  }

  getTimestamp(): number | null {
    try {
      const value = sessionStorage.getItem(STORAGE_KEYS.timestamp);
      return value ? parseInt(value, 10) : null;
    } catch (error) {
      logError(createTokenError({ userMessage: 'Failed to retrieve token timestamp.', originalError: error instanceof Error ? error : undefined }));
      return null;
    }
  }

  clearAll(): void {
    try {
      sessionStorage.removeItem(STORAGE_KEYS.access);
      sessionStorage.removeItem(STORAGE_KEYS.refresh);
      sessionStorage.removeItem(STORAGE_KEYS.timestamp);
    } catch (error) {
      logError(createTokenError({ userMessage: 'Failed to clear tokens.', originalError: error instanceof Error ? error : undefined }));
    }
  }
}

const LEGACY_STORAGE_KEYS = {
  access: 'access_token',
  refresh: 'refresh_token',
  timestamp: 'token_timestamp',
} as const;

export function hasLegacyToken(): boolean {
  try {
    return (
      localStorage.getItem(LEGACY_STORAGE_KEYS.access) !== null ||
      localStorage.getItem(LEGACY_STORAGE_KEYS.refresh) !== null
    );
  } catch (error) {
    logError(createTokenError({ userMessage: 'Failed to check for legacy tokens.', originalError: error instanceof Error ? error : undefined }));
    return false;
  }
}

export function migrateToken(): void {
  try {
    const accessToken = localStorage.getItem(LEGACY_STORAGE_KEYS.access);
    const refreshToken = localStorage.getItem(LEGACY_STORAGE_KEYS.refresh);
    const timestamp = localStorage.getItem(LEGACY_STORAGE_KEYS.timestamp);

    if (accessToken) {
      storage.storeToken('access', accessToken);
      localStorage.removeItem(LEGACY_STORAGE_KEYS.access);
    }

    if (refreshToken) {
      storage.storeToken('refresh', refreshToken);
      localStorage.removeItem(LEGACY_STORAGE_KEYS.refresh);
    }

    if (timestamp) {
      storage.setTimestamp(parseInt(timestamp, 10));
      localStorage.removeItem(LEGACY_STORAGE_KEYS.timestamp);
    }
  } catch (error) {
    logError(createTokenError({ userMessage: 'Failed to migrate tokens.', originalError: error instanceof Error ? error : undefined }));
  }
}

export const storage = new SessionStorageTokenStorage();

if (hasLegacyToken()) {
  migrateToken();
}

export function storeToken(type: TokenType, value: string): void {
  storage.storeToken(type, value);
}

export function getToken(type: TokenType): string | null {
  return storage.getToken(type);
}

export function setTimestamp(timestamp: number): void {
  storage.setTimestamp(timestamp);
}

export function getTimestamp(): number | null {
  return storage.getTimestamp();
}

export function clearAllTokens(): void {
  storage.clearAll();
}

export default storage;
