/**
 * Application constants
 * Centralized magic numbers for better maintainability
 */

/**
 * Number of emails to fetch per page when listing messages
 */
export const PAGE_SIZE = 30;

/**
 * Maximum allowed length for email body (Gmail limit)
 */
export const MAX_BODY_LENGTH = 50000;

/**
 * Polling interval in milliseconds for real-time email sync (30 seconds)
 */
export const POLLING_INTERVAL = 30000;

/**
 * Token expiry threshold in minutes before considering token expired
 * Google tokens expire in 1 hour, we use 55 minutes as safety margin
 */
export const TOKEN_EXPIRY_MINUTES = 55;

/**
 * Maximum number of search results to return
 */
export const MAX_SEARCH_RESULTS = 50;

/**
 * Debounce delay in milliseconds for filter updates (300ms)
 */
export const DEBOUNCE_DELAY = 300;
