// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock localStorage and sessionStorage for Node environment
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: (key: string) => store[key] ?? null,
        setItem: (key: string, value: string) => { store[key] = value; },
        removeItem: (key: string) => { delete store[key]; },
        clear: () => { store = {}; },
    };
})();

const sessionStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: (key: string) => store[key] ?? null,
        setItem: (key: string, value: string) => { store[key] = value; },
        removeItem: (key: string) => { delete store[key]; },
        clear: () => { store = {}; },
    };
})();

// Assign to globalThis
globalThis.localStorage = localStorageMock as any;
globalThis.sessionStorage = sessionStorageMock as any;

// Mock console.error to prevent error output during tests
const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

// Import after mocks are set up
import {
    storeToken,
    getToken,
    removeToken,
    setTimestamp,
    getTimestamp,
    clearAllTokens,
    hasLegacyToken,
    migrateToken,
    storage,
} from './token-storage';

describe('TokenStorage - Session Storage Implementation', () => {
    beforeEach(() => {
        // Clear both storages before each test
        (globalThis.sessionStorage as any).clear();
        (globalThis.localStorage as any).clear();
    });

    afterEach(() => {
        // Clear error logs between tests
        consoleErrorSpy.mockClear();
    });

    describe('storeToken() / getToken() - Basic storage operations', () => {
        it('should store and retrieve access token', () => {
            storeToken('access', 'test-access-token');
            expect(getToken('access')).toBe('test-access-token');
        });

        it('should store and retrieve refresh token', () => {
            storeToken('refresh', 'test-refresh-token');
            expect(getToken('refresh')).toBe('test-refresh-token');
        });

        it('should return null for non-existent token', () => {
            expect(getToken('access')).toBeNull();
            expect(getToken('refresh')).toBeNull();
        });

        it('should overwrite existing token', () => {
            storeToken('access', 'first-token');
            storeToken('access', 'second-token');
            expect(getToken('access')).toBe('second-token');
        });

        it('should store tokens with different keys', () => {
            storeToken('access', 'access-token');
            storeToken('refresh', 'refresh-token');
            expect(getToken('access')).toBe('access-token');
            expect(getToken('refresh')).toBe('refresh-token');
        });

        it('should handle empty string token', () => {
            storeToken('access', '');
            expect(getToken('access')).toBe('');
        });

        it('should handle special characters in token', () => {
            const specialToken = 'token.with/special-chars_123';
            storeToken('access', specialToken);
            expect(getToken('access')).toBe(specialToken);
        });
    });

    describe('removeToken() - Token removal', () => {
        it('should remove access token', () => {
            storeToken('access', 'test-token');
            removeToken('access');
            expect(getToken('access')).toBeNull();
        });

        it('should remove refresh token', () => {
            storeToken('refresh', 'test-refresh');
            removeToken('refresh');
            expect(getToken('refresh')).toBeNull();
        });

        it('should handle removing non-existent token', () => {
            expect(() => removeToken('access')).not.toThrow();
            expect(getToken('access')).toBeNull();
        });

        it('should remove only specified token type', () => {
            storeToken('access', 'access-token');
            storeToken('refresh', 'refresh-token');
            removeToken('access');
            expect(getToken('access')).toBeNull();
            expect(getToken('refresh')).toBe('refresh-token');
        });
    });

    describe('setTimestamp() / getTimestamp() - Timestamp storage', () => {
        it('should store and retrieve timestamp', () => {
            const timestamp = Date.now();
            setTimestamp(timestamp);
            expect(getTimestamp()).toBe(timestamp);
        });

        it('should return null when no timestamp set', () => {
            expect(getTimestamp()).toBeNull();
        });

        it('should overwrite existing timestamp', () => {
            setTimestamp(1000);
            setTimestamp(2000);
            expect(getTimestamp()).toBe(2000);
        });

        it('should handle zero timestamp', () => {
            setTimestamp(0);
            expect(getTimestamp()).toBe(0);
        });

        it('should handle negative timestamp', () => {
            setTimestamp(-1000);
            expect(getTimestamp()).toBe(-1000);
        });

        it('should parse string to number correctly', () => {
            setTimestamp(1234567890);
            expect(getTimestamp()).toBe(1234567890);
        });
    });

    describe('clearAllTokens() - Clear all tokens', () => {
        it('should clear all tokens and timestamp', () => {
            storeToken('access', 'access-token');
            storeToken('refresh', 'refresh-token');
            setTimestamp(12345);

            clearAllTokens();

            expect(getToken('access')).toBeNull();
            expect(getToken('refresh')).toBeNull();
            expect(getTimestamp()).toBeNull();
        });

        it('should handle clearing when nothing is stored', () => {
            expect(() => clearAllTokens()).not.toThrow();
        });

        it('should not affect other sessionStorage keys', () => {
            (globalThis.sessionStorage as any).setItem('other-key', 'other-value');
            storeToken('access', 'test-token');

            clearAllTokens();

            expect((globalThis.sessionStorage as any).getItem('other-key')).toBe('other-value');
        });
    });

    describe('TokenStorage class methods', () => {
        it('should use store instance directly', () => {
            storage.storeToken('access', 'instance-token');
            expect(storage.getToken('access')).toBe('instance-token');
        });

        it('should handle all methods through instance', () => {
            storage.storeToken('access', 'test-access');
            storage.storeToken('refresh', 'test-refresh');
            storage.setTimestamp(99999);

            expect(storage.getToken('access')).toBe('test-access');
            expect(storage.getToken('refresh')).toBe('test-refresh');
            expect(storage.getTimestamp()).toBe(99999);

            storage.removeToken('access');
            expect(storage.getToken('access')).toBeNull();

            storage.clearAll();
            expect(storage.getToken('refresh')).toBeNull();
            expect(storage.getTimestamp()).toBeNull();
        });
    });
});

describe('Token Migration - localStorage to sessionStorage', () => {
    beforeEach(() => {
        // Clear both storages before each test
        (globalThis.sessionStorage as any).clear();
        (globalThis.localStorage as any).clear();
    });

    describe('hasLegacyToken() - Detect legacy tokens', () => {
        it('should return true when legacy access token exists', () => {
            (globalThis.localStorage as any).setItem('access_token', 'legacy-access');
            expect(hasLegacyToken()).toBe(true);
        });

        it('should return true when legacy refresh token exists', () => {
            (globalThis.localStorage as any).setItem('refresh_token', 'legacy-refresh');
            expect(hasLegacyToken()).toBe(true);
        });

        it('should return true when both tokens exist', () => {
            (globalThis.localStorage as any).setItem('access_token', 'legacy-access');
            (globalThis.localStorage as any).setItem('refresh_token', 'legacy-refresh');
            expect(hasLegacyToken()).toBe(true);
        });

        it('should return false when no legacy tokens exist', () => {
            expect(hasLegacyToken()).toBe(false);
        });

        it('should return false when localStorage is empty', () => {
            (globalThis.localStorage as any).clear?.();
            expect(hasLegacyToken()).toBe(false);
        });

        it('should ignore other localStorage keys', () => {
            (globalThis.localStorage as any).setItem('other-key', 'other-value');
            expect(hasLegacyToken()).toBe(false);
        });

        it('should handle empty string legacy token', () => {
            (globalThis.localStorage as any).setItem('access_token', '');
            expect(hasLegacyToken()).toBe(true);
        });
    });

    describe('migrateToken() - Migrate tokens from localStorage', () => {
        it('should migrate access token from localStorage to sessionStorage', () => {
            (globalThis.localStorage as any).setItem('access_token', 'legacy-access-token');

            migrateToken();

            expect(getToken('access')).toBe('legacy-access-token');
            expect((globalThis.localStorage as any).getItem('access_token')).toBeNull();
        });

        it('should migrate refresh token from localStorage to sessionStorage', () => {
            (globalThis.localStorage as any).setItem('refresh_token', 'legacy-refresh-token');

            migrateToken();

            expect(getToken('refresh')).toBe('legacy-refresh-token');
            expect((globalThis.localStorage as any).getItem('refresh_token')).toBeNull();
        });

        it('should migrate timestamp from localStorage to sessionStorage', () => {
            (globalThis.localStorage as any).setItem('token_timestamp', '1234567890');

            migrateToken();

            expect(getTimestamp()).toBe(1234567890);
            expect((globalThis.localStorage as any).getItem('token_timestamp')).toBeNull();
        });

        it('should migrate all tokens and timestamp together', () => {
            (globalThis.localStorage as any).setItem('access_token', 'access-token');
            (globalThis.localStorage as any).setItem('refresh_token', 'refresh-token');
            (globalThis.localStorage as any).setItem('token_timestamp', '9876543210');

            migrateToken();

            expect(getToken('access')).toBe('access-token');
            expect(getToken('refresh')).toBe('refresh-token');
            expect(getTimestamp()).toBe(9876543210);
            expect((globalThis.localStorage as any).getItem('access_token')).toBeNull();
            expect((globalThis.localStorage as any).getItem('refresh_token')).toBeNull();
            expect((globalThis.localStorage as any).getItem('token_timestamp')).toBeNull();
        });

        it('should handle partial migration (only access token)', () => {
            (globalThis.localStorage as any).setItem('access_token', 'access-token');

            migrateToken();

            expect(getToken('access')).toBe('access-token');
            expect(getToken('refresh')).toBeNull();
            expect(getTimestamp()).toBeNull();
        });

        it('should handle partial migration (only refresh token)', () => {
            (globalThis.localStorage as any).setItem('refresh_token', 'refresh-token');

            migrateToken();

            expect(getToken('access')).toBeNull();
            expect(getToken('refresh')).toBe('refresh-token');
            expect(getTimestamp()).toBeNull();
        });

        it('should handle migrating when sessionStorage already has tokens', () => {
            (globalThis.sessionStorage as any).setItem('gmail_access_token', 'existing-access');
            (globalThis.localStorage as any).setItem('access_token', 'legacy-access');

            migrateToken();

            expect(getToken('access')).toBe('legacy-access'); // Overwrites
        });

        it('should handle empty localStorage', () => {
            migrateToken();

            expect(getToken('access')).toBeNull();
            expect(getToken('refresh')).toBeNull();
            expect(getTimestamp()).toBeNull();
        });

        it('should not throw on storage errors', () => {
            // Mock localStorage.getItem to throw error
            const originalGetItem = (globalThis.localStorage as any).getItem;
            (globalThis.localStorage as any).getItem = vi.fn(() => {
                throw new Error('Storage error');
            });

            expect(() => migrateToken()).not.toThrow();

            (globalThis.localStorage as any).getItem = originalGetItem;
        });

        it('should handle invalid timestamp value', () => {
            (globalThis.localStorage as any).setItem('token_timestamp', 'invalid-number');

            migrateToken();

            // Should not crash, getTimestamp will return NaN or null
            const result = getTimestamp();
            expect(result).toBeNaN();
        });
    });

    describe('Auto-migration on module load', () => {
        it('should auto-migrate when legacy tokens exist', () => {
            // This test verifies the auto-migration behavior
            // In a real scenario, this happens on module load
            (globalThis.localStorage as any).setItem('access_token', 'auto-migrate-token');

            // Simulate module load behavior
            if (hasLegacyToken()) {
                migrateToken();
            }

            expect(getToken('access')).toBe('auto-migrate-token');
            expect((globalThis.localStorage as any).getItem('access_token')).toBeNull();
        });
    });
});

describe('Error handling', () => {
    beforeEach(() => {
        (globalThis.sessionStorage as any).clear();
        (globalThis.localStorage as any).clear();
    });

    describe('Storage quota exceeded', () => {
        it('should handle sessionStorage quota errors gracefully', () => {
            // Mock setItem to throw quota exceeded error
            const originalSetItem = (globalThis.sessionStorage as any).setItem;
            (globalThis.sessionStorage as any).setItem = vi.fn(() => {
                throw new DOMException('QuotaExceededError');
            });

            expect(() => storeToken('access', 'large-token')).not.toThrow();

            (globalThis.sessionStorage as any).setItem = originalSetItem;
        });

        it('should return null on get after storage error', () => {
            // Even if there was an error storing, getToken should handle it
            const originalGetItem = (globalThis.sessionStorage as any).getItem;
            (globalThis.sessionStorage as any).getItem = vi.fn(() => {
                throw new Error('Storage error');
            });

            expect(getToken('access')).toBeNull();

            (globalThis.sessionStorage as any).getItem = originalGetItem;
        });
    });

    describe('Concurrent storage access', () => {
        it('should handle rapid store/get operations', () => {
            for (let i = 0; i < 100; i++) {
                storeToken('access', `token-${i}`);
                expect(getToken('access')).toBe(`token-${i}`);
            }
        });

        it('should handle mixed operations', () => {
            storeToken('access', 'access-1');
            storeToken('refresh', 'refresh-1');
            removeToken('access');
            storeToken('access', 'access-2');

            expect(getToken('access')).toBe('access-2');
            expect(getToken('refresh')).toBe('refresh-1');
        });
    });
});
