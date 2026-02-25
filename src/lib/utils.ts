import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import isToday from 'dayjs/plugin/isToday';
import isYesterday from 'dayjs/plugin/isYesterday';

dayjs.extend(relativeTime);
dayjs.extend(isToday);
dayjs.extend(isYesterday);

/**
 * DATE UTILITY PATTERN
 *
 * This module uses dayjs for all date formatting and comparison operations.
 *
 * Usage Pattern:
 * - Use new Date() or Date.now() for creating timestamps
 * - Use formatDate() / formatFullDate() for display formatting
 * - Use isWithinRange() / isWithinLastDays() for date comparisons
 *
 * Rationale:
 * - dayjs provides consistent, timezone-aware formatting
 * - Native Date is sufficient and zero-cost for timestamp creation
 * - This separation keeps bundle size optimized
 */

/**
 * Merge Tailwind CSS classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format email date for display in lists (short format).
 * Uses dayjs for consistent formatting: shows time for today,
 * "Yesterday" for yesterday, day of week for last 7 days,
 * otherwise "MMM D" format.
 *
 * @param date - The date to format (native Date object created via new Date())
 * @returns Formatted date string for display
 */
export function formatDate(date: Date): string {
  const d = dayjs(date);
  if (d.isToday()) return d.format('HH:mm');
  if (d.isYesterday()) return 'Yesterday';
  if (dayjs().diff(d, 'day') < 7) return d.format('ddd');
  return d.format('MMM D');
}

/**
 * Format full date for display in email detail view.
 * Uses dayjs for consistent "MMMM D, YYYY at h:mm A" format.
 *
 * @param date - The date to format (native Date object created via new Date())
 * @returns Formatted full date string for display
 */
export function formatFullDate(date: Date): string {
  return dayjs(date).format('MMMM D, YYYY [at] h:mm A');
}

/**
 * Decode Base64URL to string (Gmail-specific, keep custom)
 */
export function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) base64 += '=';
  try {
    const decoded = atob(base64);
    const bytes = new Uint8Array(decoded.length);
    for (let i = 0; i < decoded.length; i++) {
      bytes[i] = decoded.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  } catch {
    return str;
  }
}

/**
 * Encode string to Base64URL (Gmail-specific, keep custom)
 */
export function base64UrlEncode(str: string): string {
  const utf8Bytes = new TextEncoder().encode(str);
  const binary = Array.from(utf8Bytes, (byte) => String.fromCharCode(byte)).join('');
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Extract email address from a formatted string
 * Returns the original address if no angle brackets found
 */
export function extractEmailAddress(address: string): string {
  if (!address || address.trim() === '') return '';
  const match = address.match(/<(.+?)>/);
  return match ? match[1] : address;
}

/**
 * Extract name from email address string
 */
export function extractName(address: string): string {
  const match = address.match(/(.+?)\s*<.+?>/);
  return match ? match[1].replace(/^["']|["']$/g, '') : '';
}

/**
 * Truncate text (simple enough to keep custom - YAGNI)
 */
export function truncate(text: string, maxLength: number): string {
  return text.length <= maxLength ? text : text.slice(0, maxLength) + '...';
}

/**
 * Get initials from a name
 */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Generate a consistent gradient color class for avatar based on email
 * Uses a hash function to map emails to preset gradient combinations
 */
export function getAvatarColor(email: string): string {
  const gradients = [
    'bg-gradient-to-br from-violet-500 to-purple-600',
    'bg-gradient-to-br from-blue-500 to-cyan-500',
    'bg-gradient-to-br from-emerald-500 to-teal-500',
    'bg-gradient-to-br from-orange-500 to-amber-500',
    'bg-gradient-to-br from-pink-500 to-rose-500',
    'bg-gradient-to-br from-indigo-500 to-blue-600',
    'bg-gradient-to-br from-red-500 to-orange-500',
    'bg-gradient-to-br from-teal-500 to-emerald-500',
    'bg-gradient-to-br from-purple-500 to-pink-500',
    'bg-gradient-to-br from-cyan-500 to-blue-500',
  ];

  // Simple hash function for email
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = email.charCodeAt(i) + ((hash << 5) - hash);
  }

  return gradients[Math.abs(hash) % gradients.length];
}

/**
 * Check if a date is within the last N days from today.
 * Uses dayjs diff() for accurate day calculation.
 *
 * @param date - The date to check (native Date object created via new Date())
 * @param days - Number of days to look back
 * @returns true if the date is within the specified range
 */
export function isWithinLastDays(date: Date, days: number): boolean {
  return dayjs().diff(dayjs(date), 'day') <= days && dayjs(date).diff(dayjs(), 'day') <= 0;
}

/**
 * Check if a date is within a specific date range (inclusive).
 * Uses dayjs isBefore()/isAfter() for comparison.
 *
 * @param date - The date to check (native Date object created via new Date())
 * @param start - Optional start date (inclusive)
 * @param end - Optional end date (inclusive)
 * @returns true if the date is within the specified range
 */
export function isWithinRange(date: Date, start?: Date, end?: Date): boolean {
  const d = dayjs(date);
  if (start && d.isBefore(dayjs(start))) return false;
  if (end && d.isAfter(dayjs(end))) return false;
  return true;
}

/**
 * Format date for email reply quoting (e.g., "On January 1, 2025 at 10:30 AM").
 * Uses dayjs for consistent formatting in reply/forward contexts.
 *
 * @param date - The date to format (native Date object created via new Date())
 * @returns Formatted date string for reply quotes
 */
export function formatReplyDate(date: Date): string {
  return dayjs(date).format('MMMM D, YYYY [at] h:mm A');
}

/**
 * Creates a debounced function that delays invoking func until after wait milliseconds
 * have elapsed since the last time the debounced function was invoked.
 *
 * @param func - The function to debounce
 * @param wait - The number of milliseconds to delay
 * @returns A new debounced function with a `cancel` method to clear pending calls
 *
 * @example
 * ```ts
 * const debouncedSearch = debounce((value: string) => {
 *   performSearch(value);
 * }, 300);
 *
 * debouncedSearch('query');
 * debouncedSearch.cancel(); // Cancel pending invocation
 * ```
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) & { cancel: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const debounced = (...args: Parameters<T>) => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, wait);
  };

  debounced.cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debounced;
}
