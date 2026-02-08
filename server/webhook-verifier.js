/**
 * Webhook Signature Verification Module
 *
 * Provides HMAC signature verification for Gmail Pub/Sub webhooks.
 * Ensures requests actually come from Google by verifying digital signatures.
 */

import crypto from 'crypto';

/**
 * Convert base64url encoding to standard base64 and return as Buffer
 * @param {string} base64Url - base64url-encoded string
 * @returns {Buffer} Decoded buffer
 */
export function decodeBase64Url(base64Url) {
  // Convert base64url to standard base64
  let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');

  // Add padding if needed
  while (base64.length % 4) {
    base64 += '=';
  }

  return Buffer.from(base64, 'base64');
}

/**
 * Verify webhook HMAC signature
 * @param {string} signature - base64url-encoded signature from request header
 * @param {Buffer} payload - Raw request body as Buffer
 * @param {string} secret - Pub/Sub verification secret from environment
 * @returns {Promise<boolean>} True if signature is valid
 */
export async function verifyWebhookSignature(signature, payload, secret) {
  if (!signature || !payload || !secret) {
    return false;
  }

  try {
    // Decode the provided signature
    const providedSignature = decodeBase64Url(signature);

    // Compute HMAC SHA-256 of the payload using the secret
    const computedHmac = crypto.createHmac('sha256', secret);
    computedHmac.update(payload);
    const computedSignature = computedHmac.digest();

    // Use timing-safe comparison to prevent timing attacks
    // Ensure both buffers are the same length before comparison
    if (providedSignature.length !== computedSignature.length) {
      console.error('Signature length mismatch:', {
        provided: providedSignature.length,
        computed: computedSignature.length
      });
      return false;
    }

    const isValid = crypto.timingSafeEqual(providedSignature, computedSignature);

    if (!isValid) {
      console.error('Signature verification failed: HMAC mismatch');
    }

    return isValid;
  } catch (error) {
    console.error('Error verifying webhook signature:', error.message);
    return false;
  }
}

/**
 * Validate Pub/Sub payload structure
 * @param {any} body - Request body to validate
 * @returns {{valid: boolean, error?: string}} Validation result
 */
export function validatePayload(body) {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body is missing or not an object' };
  }

  if (!body.message) {
    return { valid: false, error: 'Missing "message" field in payload' };
  }

  // Note: body.message.data may be empty for some Pub/Sub messages
  // (e.g., when testing the webhook)
  if (!body.message.messageId) {
    return { valid: false, error: 'Missing "messageId" in message' };
  }

  return { valid: true };
}

/**
 * Extract signature from request headers or query parameters
 * Gmail Pub/Sub sends signature in:
 * - Header: X-Goog-Signature (for POST requests)
 * - Query param: signature (for GET handshake requests)
 * @param {object} headers - Request headers
 * @param {object} query - Query parameters
 * @returns {string|null} Signature string or null if not found
 */
export function extractSignature(headers, query = {}) {
  // Check header first (standard for POST requests)
  const headerSignature = headers['x-goog-signature'] || headers['X-Goog-Signature'];
  if (headerSignature) {
    return headerSignature;
  }

  // Check query parameter (for GET handshake/verification)
  if (query.signature) {
    return query.signature;
  }

  return null;
}
