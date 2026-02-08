import type {
  Email,
  EmailAddress,
  GmailMessage,
  GmailMessagePayload,
} from '@/types/email';
import {
  base64UrlDecode,
  extractEmailAddress,
  extractName,
} from '@/lib/utils';

/**
 * Parse a Gmail message to our Email format
 */
export function parseMessage(message: GmailMessage): Email {
  const headers = message.payload?.headers || [];
  const getHeader = (name: string): string => {
    const header = headers.find(
      (h) => h.name.toLowerCase() === name.toLowerCase()
    );
    return header?.value || '';
  };

  const fromStr = getHeader('From');
  const toStr = getHeader('To');
  const ccStr = getHeader('Cc');
  const subject = getHeader('Subject') || '(No subject)';
  const dateStr = getHeader('Date');

  // Parse from address
  let from: EmailAddress = { email: 'unknown@example.com', name: 'Unknown' };
  try {
    from = {
      email: extractEmailAddress(fromStr),
      name: extractName(fromStr) || extractEmailAddress(fromStr),
    };
  } catch {
    // Keep default value
  }

  // Parse to addresses
  let to: EmailAddress[] = [];
  try {
    to = toStr
      .split(',')
      .map((addr) => ({
        email: extractEmailAddress(addr.trim()),
        name: extractName(addr.trim()) || extractEmailAddress(addr.trim()),
      }))
      .filter((addr) => addr.email);
  } catch {
    // Keep empty array
  }

  // Parse cc addresses
  let cc: EmailAddress[] = [];
  try {
    cc = ccStr
      .split(',')
      .map((addr) => ({
        email: extractEmailAddress(addr.trim()),
        name: extractName(addr.trim()) || extractEmailAddress(addr.trim()),
      }))
      .filter((addr) => addr.email);
  } catch {
    // Keep empty array
  }

  // Parse date
  let date = new Date();
  try {
    date = new Date(dateStr);
  } catch {
    // Keep current date
  }

  // Extract body
  let body = '';
  if (message.payload?.body?.data) {
    body = base64UrlDecode(message.payload.body.data);
  } else if (message.payload?.parts) {
    // Find text/plain or text/html part
    const textPart = message.payload.parts.find(
      (part) => part.mimeType === 'text/plain' || part.mimeType === 'text/html'
    );
    if (textPart?.body?.data) {
      body = base64UrlDecode(textPart.body.data);
    } else {
      // Recursively search for body
      body = extractBodyFromParts(message.payload.parts);
    }
  }

  return {
    id: message.id,
    threadId: message.threadId,
    snippet: message.snippet || '',
    subject,
    from,
    to,
    cc: cc.length > 0 ? cc : undefined,
    date,
    body,
    isUnread: message.labelIds?.includes('UNREAD') || false,
    labels: message.labelIds || [],
  };
}

/**
 * Extract body from nested parts
 */
export function extractBodyFromParts(parts: GmailMessagePayload[]): string {
  for (const part of parts) {
    if (part.body?.data) {
      if (part.mimeType === 'text/plain' || part.mimeType === 'text/html') {
        return base64UrlDecode(part.body.data);
      }
    }
    if (part.parts) {
      const body = extractBodyFromParts(part.parts);
      if (body) return body;
    }
  }
  return '';
}
