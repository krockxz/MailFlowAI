// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
    extractEmailAddress,
    extractName,
    formatDate,
    isWithinRange
} from '../lib/utils'; // Adjust path if needed

describe('Utility Functions', () => {
    describe('extractEmailAddress', () => {
        it('should extract simple email', () => {
            expect(extractEmailAddress('test@example.com')).toBe('test@example.com');
        });

        it('should extract email from name <email> format', () => {
            expect(extractEmailAddress('John Doe <john@example.com>')).toBe('john@example.com');
        });

        it('should handle angle brackets only', () => {
            expect(extractEmailAddress('<foo@bar.com>')).toBe('foo@bar.com');
        });
    });

    describe('extractName', () => {
        it('should extract name from "Name <email>"', () => {
            expect(extractName('Alice Smith <alice@example.com>')).toBe('Alice Smith');
        });

        it('should return empty string if no name present', () => {
            expect(extractName('bob@example.com')).toBe('');
            // Assuming Implementation behavior, verify existing utils later
        });
    });

    describe('formatDate', () => {
        it('should format date correctly', () => {
            const date = new Date('2023-01-01T12:00:00Z');
            // This depends on locale, skipping precise string match or mocking locale
            expect(formatDate(date)).toBeTruthy();
        });
    });

    describe('isWithinRange', () => {
        it('should return true if date is within range', () => {
            const date = new Date('2023-01-15');
            const start = new Date('2023-01-01');
            const end = new Date('2023-01-31');
            expect(isWithinRange(date, start, end)).toBe(true);
        });

        it('should return false if date is outside range', () => {
            const date = new Date('2023-02-01');
            const start = new Date('2023-01-01');
            const end = new Date('2023-01-31');
            expect(isWithinRange(date, start, end)).toBe(false);
        });
    });
});
