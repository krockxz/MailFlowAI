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
 * Wrap an action handler with error handling
 *
 * @param actionName - Name of the action for logging
 * @param handler - The actual handler function
 * @param fallbackMessage - Message to return on error
 * @returns Wrapped handler with error handling
 */
export function withErrorHandling<TArgs extends Record<string, unknown>, TResult>(
  actionName: string,
  handler: (args: TArgs) => Promise<TResult> | TResult,
  fallbackMessage: string = `An error occurred while executing ${actionName}`
): (args: TArgs) => Promise<string> {
  return async (args: TArgs): Promise<string> => {
    try {
      logger.info(actionName, 'Executing', args);
      const result = await handler(args);

      // Allow handler to return string directly or convert result
      if (typeof result === 'string') {
        return result;
      }

      // If handler returns object with success/error structure
      if (typeof result === 'object' && result !== null) {
        const resultObj = result as { success?: boolean; message?: string; error?: string };
        if (resultObj.success === false && resultObj.error) {
          throw new Error(resultObj.error);
        }
        return resultObj.message || `${actionName} completed successfully`;
      }

      return `${actionName} completed successfully`;
    } catch (error) {
      const actionError = normalizeError(error, args);
      logger.log(actionName, actionError);
      return `${fallbackMessage}: ${actionError.userMessage}`;
    }
  };
}

/**
 * Normalize various error types into ActionError
 */
function normalizeError(
  error: unknown,
  context?: Record<string, unknown>
): ActionError {
  // API errors (Gmail, etc.)
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
      return createActionError(
        ActionErrorType.NETWORK,
        'Network request failed. Please check your connection.',
        error,
        context
      );
    }

    if (message.includes('unauthorized') || message.includes('401') || message.includes('403')) {
      return createActionError(
        ActionErrorType.PERMISSION,
        'You are not authorized to perform this action. Please check your permissions.',
        error,
        context
      );
    }

    if (message.includes('not found') || message.includes('404')) {
      return createActionError(
        ActionErrorType.NOT_FOUND,
        'The requested resource was not found.',
        error,
        context
      );
    }

    if (message.includes('invalid') || message.includes('validation')) {
      return createActionError(
        ActionErrorType.VALIDATION,
        'Invalid input. Please check your request.',
        error,
        context
      );
    }

    // Default error message
    return createActionError(
      ActionErrorType.UNKNOWN,
      error.message || 'An unknown error occurred',
      error,
      context
    );
  }

  // String errors
  if (typeof error === 'string') {
    return createActionError(
      ActionErrorType.UNKNOWN,
      error,
      error,
      context
    );
  }

  // Unknown error type
  return createActionError(
    ActionErrorType.UNKNOWN,
    'An unexpected error occurred',
    error,
    context
  );
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

/**
 * Rollback utility for state changes
 *
 * Usage:
 * const previousState = useAppStore.getState();
 * try {
 *   // ... state changes ...
 * } catch (error) {
 *   rollbackState(previousState);
 *   // handle error
 * }
 */
export async function withRollback<T>(
  stateFn: () => T,
  actionFn: () => Promise<string>,
  rollbackFn: (previousState: T) => void
): Promise<string> {
  const previousState = stateFn();

  try {
    return await actionFn();
  } catch (error) {
    rollbackFn(previousState);
    throw error;
  }
}
