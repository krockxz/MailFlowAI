/**
 * Error handling utilities for CopilotKit AI actions
 *
 * Provides consistent error handling, logging, and user feedback
 * for all AI-triggered actions.
 */

/**
 * Action error types for categorization
 */
export enum ActionErrorType {
  VALIDATION = 'validation',
  NOT_FOUND = 'not_found',
  API_ERROR = 'api_error',
  NETWORK = 'network',
  PERMISSION = 'permission',
  STATE = 'state',
  UNKNOWN = 'unknown',
}

/**
 * Structured error for AI actions
 */
export interface ActionError {
  type: ActionErrorType;
  message: string;
  userMessage: string;
  originalError?: unknown;
  context?: Record<string, unknown>;
}

/**
 * Logger for AI action errors
 */
class ActionLogger {
  private isDevelopment = import.meta.env.DEV;

  /**
   * Log an error with context
   */
  log(actionName: string, error: ActionError): void {
    if (this.isDevelopment) {
      console.group(`[AI Action Error] ${actionName}`);
      console.error('Type:', error.type);
      console.error('Message:', error.message);
      console.error('User Message:', error.userMessage);
      if (error.originalError) {
        console.error('Original Error:', error.originalError);
      }
      if (error.context) {
        console.error('Context:', error.context);
      }
      console.groupEnd();
    }
  }

  /**
   * Log a warning (non-critical issues)
   */
  warn(actionName: string, message: string, context?: Record<string, unknown>): void {
    if (this.isDevelopment) {
      console.warn(`[AI Action Warning] ${actionName}: ${message}`, context || '');
    }
  }

  /**
   * Log info for debugging
   */
  info(actionName: string, message: string, context?: Record<string, unknown>): void {
    if (this.isDevelopment) {
      console.info(`[AI Action Info] ${actionName}: ${message}`, context || '');
    }
  }
}

export const logger = new ActionLogger();

/**
 * Create a standardized action error
 */
export function createActionError(
  type: ActionErrorType,
  userMessage: string,
  originalError?: unknown,
  context?: Record<string, unknown>
): ActionError {
  let message = userMessage;

  if (originalError instanceof Error) {
    message = originalError.message;
  } else if (typeof originalError === 'string') {
    message = originalError;
  }

  return {
    type,
    message,
    userMessage,
    originalError,
    context,
  };
}

/**
 * Validate email address format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate multiple email addresses (comma-separated)
 */
export function isValidEmailList(emails: string): boolean {
  if (!emails) return true; // Empty is valid (optional field)
  return emails.split(',').every(email => isValidEmail(email.trim()));
}

/**
 * Safe date parsing that returns null for invalid dates
 */
export function safeParseDate(dateString: string): Date | null {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return null;
    }
    return date;
  } catch {
    return null;
  }
}


