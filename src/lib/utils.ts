import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import dayjs from 'dayjs';
import isToday from 'dayjs/plugin/isToday';
import isYesterday from 'dayjs/plugin/isYesterday';

dayjs.extend(isToday);
dayjs.extend(isYesterday);

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date): string {
  const d = dayjs(date);
  if (d.isToday()) return d.format('HH:mm');
  if (d.isYesterday()) return 'Yesterday';
  if (dayjs().diff(d, 'day') < 7) return d.format('ddd');
  return d.format('MMM D');
}

export function formatFullDate(date: Date): string {
  return dayjs(date).format('MMMM D, YYYY [at] h:mm A');
}

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

export function extractEmailAddress(address: string): string {
  if (!address || address.trim() === '') return '';
  const match = address.match(/<(.+?)>/);
  return match ? match[1] : address;
}

export function extractName(address: string): string {
  const match = address.match(/(.+?)\s*<.+?>/);
  return match ? match[1].replace(/^["']|["']$/g, '') : '';
}

export function truncate(text: string, maxLength: number): string {
  return text.length <= maxLength ? text : text.slice(0, maxLength) + '...';
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

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

  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = email.charCodeAt(i) + ((hash << 5) - hash);
  }

  return gradients[Math.abs(hash) % gradients.length];
}

export function isWithinLastDays(date: Date, days: number): boolean {
  return dayjs().diff(dayjs(date), 'day') <= days && dayjs(date).diff(dayjs(), 'day') <= 0;
}

export function isWithinRange(date: Date, start?: Date, end?: Date): boolean {
  const d = dayjs(date);
  if (start && d.isBefore(dayjs(start))) return false;
  if (end && d.isAfter(dayjs(end))) return false;
  return true;
}

export function formatReplyDate(date: Date): string {
  return dayjs(date).format('MMMM D, YYYY [at] h:mm A');
}

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
