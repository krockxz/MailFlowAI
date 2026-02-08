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
 * Merge Tailwind CSS classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format email date using dayjs
 */
export function formatDate(date: Date): string {
  const d = dayjs(date);
  if (d.isToday()) return d.format('HH:mm');
  if (d.isYesterday()) return 'Yesterday';
  if (dayjs().diff(d, 'day') < 7) return d.format('ddd');
  return d.format('MMM D');
}

/**
 * Format full date using dayjs
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
 */
export function extractEmailAddress(address: string): string {
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
 * Check if date is within last N days using dayjs
 */
export function isWithinLastDays(date: Date, days: number): boolean {
  return dayjs().diff(dayjs(date), 'day') <= days && dayjs(date).diff(dayjs(), 'day') <= 0;
}

/**
 * Check if date is within a date range using dayjs
 */
export function isWithinRange(date: Date, start?: Date, end?: Date): boolean {
  const d = dayjs(date);
  if (start && d.isBefore(dayjs(start))) return false;
  if (end && d.isAfter(dayjs(end))) return false;
  return true;
}
