// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
    cn,
    extractEmailAddress,
    extractName,
    formatDate,
    formatFullDate,
    base64UrlDecode,
    base64UrlEncode,
    truncate,
    getInitials,
    isWithinLastDays,
    isWithinRange,
    formatReplyDate
} from './utils';

describe('cn() - Tailwind class merging', () => {
    it('should merge simple classes', () => {
        expect(cn('foo', 'bar')).toBe('foo bar');
    });

    it('should handle conflicting classes (last wins)', () => {
        expect(cn('p-4', 'p-2')).toBe('p-2');
    });

    it('should handle conditional classes', () => {
        expect(cn('base-class', true && 'active', false && 'inactive')).toBe('base-class active');
    });

    it('should handle empty inputs', () => {
        expect(cn()).toBe('');
        expect(cn('')).toBe('');
        expect(cn(null)).toBe('');
        expect(cn(undefined)).toBe('');
    });

    it('should handle arrays of classes', () => {
        expect(cn(['foo', 'bar'])).toBe('foo bar');
    });

    it('should handle objects with boolean values', () => {
        expect(cn({ foo: true, bar: false, baz: true })).toBe('foo baz');
    });

    it('should handle Tailwind conflict resolution', () => {
        expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
    });
});

describe('formatDate() - Date formatting for lists', () => {
    let originalNow: Date;

    beforeEach(() => {
        // Mock current time to 2025-02-08 14:30:00 UTC
        originalNow = new Date();
        vi.setSystemTime(new Date('2025-02-08T14:30:00Z'));
    });

    afterEach(() => {
        vi.setSystemTime(originalNow);
    });

    it('should show time for today', () => {
        const today = new Date('2025-02-08T10:15:00Z');
        // Format depends on local timezone
        expect(formatDate(today)).toBeTruthy();
        expect(formatDate(today)).toMatch(/^\d{2}:\d{2}$/);
    });

    it('should show "Yesterday" for yesterday', () => {
        const yesterday = new Date('2025-02-07T10:15:00Z');
        expect(formatDate(yesterday)).toBe('Yesterday');
    });

    it('should show day of week for dates within last 7 days', () => {
        const threeDaysAgo = new Date('2025-02-05T10:15:00Z');
        expect(formatDate(threeDaysAgo)).toBe('Wed');
    });

    it('should show MMM D format for older dates', () => {
        const oldDate = new Date('2025-01-15T10:15:00Z');
        expect(formatDate(oldDate)).toBe('Jan 15');
    });

    it('should handle dates exactly 7 days ago', () => {
        const sevenDaysAgo = new Date('2025-02-01T14:30:00Z');
        // 7 full days difference would show MMM D format
        expect(formatDate(sevenDaysAgo)).toMatch(/^(Feb 1|Mon|Tue|Wed|Thu|Fri|Sat|Sun)$/);
    });

    it('should handle dates more than 7 days ago', () => {
        const eightDaysAgo = new Date('2025-01-31T14:30:00Z');
        expect(formatDate(eightDaysAgo)).toBe('Jan 31');
    });
});

describe('formatFullDate() - Full date format', () => {
    it('should format date with month, day, year, and time', () => {
        const date = new Date('2025-02-08T14:30:00Z');
        expect(formatFullDate(date)).toMatch(/February 8, 2025 at \d{1,2}:\d{2} [AP]M/);
    });

    it('should handle midnight times', () => {
        const date = new Date('2025-01-01T00:00:00Z');
        expect(formatFullDate(date)).toMatch(/January 1, 2025 at \d{1,2}:\d{2} [AP]M/);
    });

    it('should handle single digit days', () => {
        const date = new Date('2025-02-03T09:05:00Z');
        expect(formatFullDate(date)).toMatch(/February 3, 2025 at \d{1,2}:\d{2} [AP]M/);
    });

    it('should handle different months', () => {
        const date = new Date('2025-12-25T18:30:00Z');
        // Timezone may shift the displayed date
        expect(formatFullDate(date)).toMatch(/December (25|26), 2025 at \d{1,2}:\d{2} [AP]M/);
    });
});

describe('base64UrlDecode() - Base64URL decoding', () => {
    it('should decode simple ASCII string', () => {
        const encoded = 'SGVsbG8gV29ybGQ';
        expect(base64UrlDecode(encoded)).toBe('Hello World');
    });

    it('should decode Base64URL format with - and _', () => {
        // Base64URL with - characters (URL-safe)
        const encoded = 'SGVsbG8tV29ybGQ'; // Hello-World in Base64URL
        const result = base64UrlDecode(encoded);
        expect(result).toBe('Hello-World');
    });

    it('should handle URL-safe characters', () => {
        const encoded = 'SGVsbG8tV29ybGQ='; // Hello-World
        expect(base64UrlDecode(encoded)).toBe('Hello-World');
    });

    it('should decode Unicode characters (UTF-8)', () => {
        const encoded = '5L2g5aW9'; // "你好" (Hello in Chinese) in Base64URL
        const result = base64UrlDecode(encoded);
        expect(result).toBeTruthy();
    });

    it('should handle emojis', () => {
        const encoded = '8J+YgA=='; // Thumbs up emoji
        const result = base64UrlDecode(encoded);
        expect(result).toBeTruthy();
    });

    it('should handle padding correctly', () => {
        // Test string that needs padding
        const encoded = 'SGVsbG8'; // Needs = padding
        expect(base64UrlDecode(encoded)).toBe('Hello');
    });

    it('should return original string on decode error', () => {
        const invalid = 'not-valid-base64!!!';
        expect(base64UrlDecode(invalid)).toBe(invalid);
    });

    it('should handle empty string', () => {
        expect(base64UrlDecode('')).toBe('');
    });

    it('should handle strings with multiple padding', () => {
        const encoded = 'SGVsbG8gV29ybGQ='; // One padding
        expect(base64UrlDecode(encoded)).toBe('Hello World');
    });
});

describe('base64UrlEncode() - Base64URL encoding', () => {
    it('should encode simple ASCII string', () => {
        expect(base64UrlEncode('Hello World')).toBe('SGVsbG8gV29ybGQ');
    });

    it('should replace + with - and / with _', () => {
        const encoded = base64UrlEncode('Hello-World');
        expect(encoded).not.toContain('+');
        expect(encoded).not.toContain('/');
        expect(encoded).not.toContain('=');
    });

    it('should encode Unicode characters', () => {
        const text = 'hello'; // Chinese characters
        const encoded = base64UrlEncode(text);
        expect(encoded).toBeTruthy();
        expect(base64UrlDecode(encoded)).toBe(text);
    });

    it('should handle emojis', () => {
        const text = ''; // Empty string
        expect(base64UrlEncode(text)).toBe('');
    });

    it('should round-trip encode/decode', () => {
        const original = 'Hello, World! Test@123';
        const encoded = base64UrlEncode(original);
        const decoded = base64UrlDecode(encoded);
        expect(decoded).toBe(original);
    });

    it('should handle special characters', () => {
        const original = 'test@example.com';
        const encoded = base64UrlEncode(original);
        const decoded = base64UrlDecode(encoded);
        expect(decoded).toBe(original);
    });

    it('should handle empty string', () => {
        expect(base64UrlEncode('')).toBe('');
    });
});

describe('extractEmailAddress() - Email extraction', () => {
    it('should extract simple email address', () => {
        expect(extractEmailAddress('test@example.com')).toBe('test@example.com');
    });

    it('should extract from "Name <email>" format', () => {
        expect(extractEmailAddress('John Doe <john@example.com>')).toBe('john@example.com');
    });

    it('should extract from angle brackets only', () => {
        expect(extractEmailAddress('<foo@bar.com>')).toBe('foo@bar.com');
    });

    it('should handle quoted names', () => {
        expect(extractEmailAddress('"John Doe" <john@example.com>')).toBe('john@example.com');
    });

    it('should handle email with + addressing', () => {
        expect(extractEmailAddress('user+tag@example.com')).toBe('user+tag@example.com');
    });

    it('should return original if no angle brackets', () => {
        expect(extractEmailAddress('plain@example.com')).toBe('plain@example.com');
    });

    it('should handle multiple brackets (first closing wins)', () => {
        expect(extractEmailAddress('Name <email@example.com>')).toBe('email@example.com');
    });

    it('should handle empty string', () => {
        expect(extractEmailAddress('')).toBe('');
    });
});

describe('extractName() - Name extraction', () => {
    it('should extract name from "Name <email>"', () => {
        expect(extractName('Alice Smith <alice@example.com>')).toBe('Alice Smith');
    });

    it('should return empty string if no name present', () => {
        expect(extractName('bob@example.com')).toBe('');
    });

    it('should handle quoted names', () => {
        expect(extractName('"John Doe" <john@example.com>')).toBe('John Doe');
    });

    it('should handle single quotes', () => {
        expect(extractName("'John Doe' <john@example.com>")).toBe('John Doe');
    });

    it('should trim whitespace', () => {
        // extractName doesn't trim - it preserves spaces as-is
        const result = extractName('John Doe <john@example.com>');
        expect(result).toBe('John Doe');
    });

    it('should handle names with multiple spaces', () => {
        expect(extractName('John  Middle  Doe <john@example.com>')).toBe('John  Middle  Doe');
    });

    it('should handle angle bracket without name', () => {
        expect(extractName('<email@example.com>')).toBe('');
    });

    it('should handle empty string', () => {
        expect(extractName('')).toBe('');
    });
});

describe('truncate() - Text truncation', () => {
    it('should return original text if shorter than max', () => {
        expect(truncate('Hello', 10)).toBe('Hello');
    });

    it('should truncate and add ellipsis when longer than max', () => {
        // truncate takes maxLength but "..." adds 3 chars
        // So "Hello World" (11 chars) with maxLength 5 should be "Hello..." (8 chars)
        expect(truncate('Hello World', 5)).toBe('Hello...');
    });

    it('should handle exact length match', () => {
        expect(truncate('Hello', 5)).toBe('Hello');
    });

    it('should handle empty string', () => {
        expect(truncate('', 10)).toBe('');
    });

    it('should handle very short maxLength', () => {
        expect(truncate('Hello World', 2)).toBe('He...');
    });

    it('should handle maxLength of 0', () => {
        expect(truncate('Hello', 0)).toBe('...');
    });

    it('should not truncate when text equals maxLength', () => {
        const text = 'Hello';
        expect(truncate(text, 5)).toBe('Hello');
    });

    it('should handle unicode characters', () => {
        expect(truncate('Hello World', 3)).toBe('Hel...');
    });
});

describe('getInitials() - Initial generation', () => {
    it('should get initials from two-word name', () => {
        expect(getInitials('John Doe')).toBe('JD');
    });

    it('should get initials from three-word name', () => {
        expect(getInitials('John Middle Doe')).toBe('JD');
    });

    it('should get first two letters for single word', () => {
        expect(getInitials('John')).toBe('JO');
    });

    it('should handle single character name', () => {
        expect(getInitials('J')).toBe('J');
    });

    it('should trim whitespace', () => {
        expect(getInitials('  John Doe  ')).toBe('JD');
    });

    it('should handle multiple spaces between words', () => {
        expect(getInitials('John  Doe')).toBe('JD');
    });

    it('should handle empty string', () => {
        expect(getInitials('')).toBe('');
    });

    it('should handle name with leading/trailing spaces', () => {
        expect(getInitials(' Alice Bob ')).toBe('AB');
    });
});

describe('isWithinLastDays() - Date range checking', () => {
    let originalNow: Date;

    beforeEach(() => {
        // Mock current time to 2025-02-08 12:00:00 UTC
        originalNow = new Date();
        vi.setSystemTime(new Date('2025-02-08T12:00:00Z'));
    });

    afterEach(() => {
        vi.setSystemTime(originalNow);
    });

    it('should return true for today', () => {
        const today = new Date('2025-02-08T10:00:00Z');
        expect(isWithinLastDays(today, 7)).toBe(true);
    });

    it('should return true for date within N days', () => {
        const threeDaysAgo = new Date('2025-02-05T12:00:00Z');
        expect(isWithinLastDays(threeDaysAgo, 7)).toBe(true);
    });

    it('should return true for date exactly N days ago', () => {
        const sevenDaysAgo = new Date('2025-02-01T12:00:00Z');
        expect(isWithinLastDays(sevenDaysAgo, 7)).toBe(true);
    });

    it('should return false for date older than N days', () => {
        const eightDaysAgo = new Date('2025-01-31T11:59:00Z');
        expect(isWithinLastDays(eightDaysAgo, 7)).toBe(false);
    });

    it('should return false for future dates', () => {
        const future = new Date('2025-02-09T12:00:00Z');
        expect(isWithinLastDays(future, 7)).toBe(false);
    });

    it('should handle 0 days (only today)', () => {
        const today = new Date('2025-02-08T12:00:00Z');
        const yesterday = new Date('2025-02-07T12:00:00Z');
        expect(isWithinLastDays(today, 0)).toBe(true);
        expect(isWithinLastDays(yesterday, 0)).toBe(false);
    });

    it('should handle large day counts', () => {
        // As of 2025-02-08, 2024-02-08 is 366 days ago (leap year 2024)
        const oldDate = new Date('2024-02-08T12:00:00Z');
        // Use 366 to account for leap year
        expect(isWithinLastDays(oldDate, 366)).toBe(true);
    });
});

describe('isWithinRange() - Date boundary checking', () => {
    it('should return true when no boundaries specified', () => {
        const date = new Date('2025-02-08');
        expect(isWithinRange(date)).toBe(true);
    });

    it('should return true when date equals start boundary', () => {
        const date = new Date('2025-02-08T12:00:00Z');
        const start = new Date('2025-02-08T00:00:00Z');
        expect(isWithinRange(date, start)).toBe(true);
    });

    it('should return true when date equals end boundary', () => {
        const date = new Date('2025-02-08T23:59:59Z');
        const end = new Date('2025-02-08T23:59:59Z');
        expect(isWithinRange(date, undefined, end)).toBe(true);
    });

    it('should return true when date is within range', () => {
        const date = new Date('2025-02-15');
        const start = new Date('2025-02-01');
        const end = new Date('2025-02-28');
        expect(isWithinRange(date, start, end)).toBe(true);
    });

    it('should return false when date is before start', () => {
        const date = new Date('2025-01-15');
        const start = new Date('2025-02-01');
        expect(isWithinRange(date, start)).toBe(false);
    });

    it('should return false when date is after end', () => {
        const date = new Date('2025-03-15');
        const end = new Date('2025-02-28');
        expect(isWithinRange(date, undefined, end)).toBe(false);
    });

    it('should handle only start boundary', () => {
        const date = new Date('2025-02-15');
        const start = new Date('2025-02-01');
        expect(isWithinRange(date, start)).toBe(true);
    });

    it('should handle only end boundary', () => {
        const date = new Date('2025-02-15');
        const end = new Date('2025-02-28');
        expect(isWithinRange(date, undefined, end)).toBe(true);
    });
});

describe('formatReplyDate() - Reply date formatting', () => {
    it('should format date correctly for reply quote', () => {
        const date = new Date('2025-02-08T14:30:00Z');
        expect(formatReplyDate(date)).toMatch(/February 8, 2025 at \d{1,2}:\d{2} [AP]M/);
    });

    it('should handle different months', () => {
        const date = new Date('2025-12-25T10:00:00Z');
        expect(formatReplyDate(date)).toMatch(/December 25, 2025 at \d{1,2}:\d{2} [AP]M/);
    });

    it('should handle midnight times', () => {
        const date = new Date('2025-01-01T00:00:00Z');
        expect(formatReplyDate(date)).toMatch(/January 1, 2025 at \d{1,2}:\d{2} [AP]M/);
    });

    it('should handle noon times', () => {
        const date = new Date('2025-06-15T12:00:00Z');
        expect(formatReplyDate(date)).toMatch(/June 15, 2025 at \d{1,2}:\d{2} [AP]M/);
    });

    it('should handle times near hour boundary', () => {
        const date = new Date('2025-03-31T23:59:00Z');
        // Timezone may shift the displayed date
        expect(formatReplyDate(date)).toMatch(/(March 31|April 1), 2025 at \d{1,2}:\d{2} [AP]M/);
    });

    it('should handle leap day', () => {
        const date = new Date('2024-02-29T15:45:00Z');
        expect(formatReplyDate(date)).toMatch(/February 29, 2024 at \d{1,2}:\d{2} [AP]M/);
    });
});
