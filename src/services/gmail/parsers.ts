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
    const extractedEmail = extractEmailAddress(fromStr);
    const extractedName = extractName(fromStr);
    if (extractedEmail) {
      from = {
        email: extractedEmail,
        name: extractedName || extractedEmail,
      };
    }
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
  let bodyIsHtml = false;
  if (message.payload?.body?.data) {
    body = base64UrlDecode(message.payload.body.data);
    bodyIsHtml = message.payload.mimeType === 'text/html';
  } else if (message.payload?.parts) {
    // Prefer text/plain over text/html
    const textPart = message.payload.parts.find(
      (part) => part.mimeType === 'text/plain'
    ) || message.payload.parts.find(
      (part) => part.mimeType === 'text/html'
    );
    if (textPart?.body?.data) {
      body = base64UrlDecode(textPart.body.data);
      bodyIsHtml = textPart.mimeType === 'text/html';
    } else {
      // Recursively search for body
      const { body: extractedBody, isHtml } = extractBodyFromParts(message.payload.parts);
      body = extractedBody;
      bodyIsHtml = isHtml;
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
    bodyIsHtml,
    isUnread: message.labelIds?.includes('UNREAD') || false,
    labels: message.labelIds || [],
  };
}

/**
 * Extract body from nested parts
 * Prefers text/plain over text/html
 * @returns Object with body content and whether it's HTML
 */
export function extractBodyFromParts(parts: GmailMessagePayload[]): { body: string; isHtml: boolean } {
  // First pass: look for text/plain
  for (const part of parts) {
    if (part.body?.data && part.mimeType === 'text/plain') {
      return { body: base64UrlDecode(part.body.data), isHtml: false };
    }
    if (part.parts) {
      const result = extractBodyFromParts(part.parts);
      if (result.body) return result;
    }
  }
  // Second pass: look for text/html
  for (const part of parts) {
    if (part.body?.data && part.mimeType === 'text/html') {
      return { body: base64UrlDecode(part.body.data), isHtml: true };
    }
    if (part.parts) {
      const result = extractBodyFromPartsNestedHtml(part.parts);
      if (result.body) return result;
    }
  }
  return { body: '', isHtml: false };
}

/**
 * Extract HTML body from nested parts (second pass helper)
 * @returns Object with body content and whether it's HTML
 */
function extractBodyFromPartsNestedHtml(parts: GmailMessagePayload[]): { body: string; isHtml: boolean } {
  for (const part of parts) {
    if (part.body?.data && part.mimeType === 'text/html') {
      return { body: base64UrlDecode(part.body.data), isHtml: true };
    }
    if (part.parts) {
      const result = extractBodyFromPartsNestedHtml(part.parts);
      if (result.body) return result;
    }
  }
  return { body: '', isHtml: false };
}
