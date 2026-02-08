/**
 * Token Storage Abstraction Layer
 *
 * This module provides a secure storage abstraction for OAuth tokens.
 * Currently uses sessionStorage (cleared when tab closes, more secure than localStorage).
 * The abstraction makes future migration to httpOnly cookies easier.
 */

/**
 * Token type identifiers
 */
export type TokenType = 'access' | 'refresh';

/**
 * Storage keys for different token types
 */
const STORAGE_KEYS = {
  access: 'gmail_access_token',
  refresh: 'gmail_refresh_token',
  timestamp: 'gmail_token_timestamp',
} as const;

/**
 * Token storage interface
 * Defines the contract for token storage implementations
 */
export interface TokenStorage {
  /**
   * Store a token (access or refresh)
   */
  storeToken(type: TokenType, value: string): void;

  /**
   * Retrieve a token by type
   */
  getToken(type: TokenType): string | null;

  /**
   * Remove a specific token
   */
  removeToken(type: TokenType): void;

  /**
   * Store the token timestamp
   */
  setTimestamp(timestamp: number): void;

  /**
   * Get the token timestamp
   */
  getTimestamp(): number | null;

  /**
   * Clear all tokens and metadata
   */
  clearAll(): void;
}

/**
 * SessionStorage-based token storage implementation
 * Uses sessionStorage for security (cleared when tab closes)
 */
class SessionStorageTokenStorage implements TokenStorage {
  storeToken(type: TokenType, value: string): void {
    try {
      sessionStorage.setItem(STORAGE_KEYS[type], value);
    } catch (error) {
      console.error(`Failed to store ${type} token:`, error);
    }
  }

  getToken(type: TokenType): string | null {
    try {
      return sessionStorage.getItem(STORAGE_KEYS[type]);
    } catch (error) {
      console.error(`Failed to retrieve ${type} token:`, error);
      return null;
    }
  }

  removeToken(type: TokenType): void {
    try {
      sessionStorage.removeItem(STORAGE_KEYS[type]);
    } catch (error) {
      console.error(`Failed to remove ${type} token:`, error);
    }
  }

  setTimestamp(timestamp: number): void {
    try {
      sessionStorage.setItem(STORAGE_KEYS.timestamp, timestamp.toString());
    } catch (error) {
      console.error('Failed to store token timestamp:', error);
    }
  }

  getTimestamp(): number | null {
    try {
      const value = sessionStorage.getItem(STORAGE_KEYS.timestamp);
      return value ? parseInt(value, 10) : null;
    } catch (error) {
      console.error('Failed to retrieve token timestamp:', error);
      return null;
    }
  }

  clearAll(): void {
    try {
      sessionStorage.removeItem(STORAGE_KEYS.access);
      sessionStorage.removeItem(STORAGE_KEYS.refresh);
      sessionStorage.removeItem(STORAGE_KEYS.timestamp);
    } catch (error) {
      console.error('Failed to clear tokens:', error);
    }
  }
}

/**
 * Legacy storage keys (used in localStorage before migration)
 */
const LEGACY_STORAGE_KEYS = {
  access: 'access_token',
  refresh: 'refresh_token',
  timestamp: 'token_timestamp',
} as const;

/**
 * Check if legacy tokens exist in localStorage
 * This is used to migrate tokens from localStorage to sessionStorage
 */
export function hasLegacyToken(): boolean {
  try {
    return (
      localStorage.getItem(LEGACY_STORAGE_KEYS.access) !== null ||
      localStorage.getItem(LEGACY_STORAGE_KEYS.refresh) !== null
    );
  } catch (error) {
    console.error('Failed to check for legacy tokens:', error);
    return false;
  }
}

/**
 * Migrate tokens from localStorage to sessionStorage
 * Copies tokens to sessionStorage and clears them from localStorage
 */
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

    if (accessToken || refreshToken || timestamp) {
      console.log('Migrated tokens from localStorage to sessionStorage');
    }
  } catch (error) {
    console.error('Failed to migrate tokens:', error);
  }
}

/**
 * Default storage instance
 * Export as singleton for use throughout the app
 */
export const storage = new SessionStorageTokenStorage();

/**
 * Auto-migrate on module load if legacy tokens exist
 */
if (hasLegacyToken()) {
  migrateToken();
}

/**
 * Convenience exports for backward compatibility
 * These allow direct function calls without accessing the storage instance
 */

export function storeToken(type: TokenType, value: string): void {
  storage.storeToken(type, value);
}

export function getToken(type: TokenType): string | null {
  return storage.getToken(type);
}

export function removeToken(type: TokenType): void {
  storage.removeToken(type);
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
