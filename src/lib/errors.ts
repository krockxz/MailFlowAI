/**
 * Centralized Error Handling System
 *
 * Provides error domain classification, standardized error reporting,
 * and consistent error handling across the application.
 */

/**
 * Error domains - categorizes errors by subsystem/area
 */
export enum ErrorDomain {
  AUTH = 'auth',
  OAUTH = 'oauth',
  TOKEN = 'token',
  GMAIL_API = 'gmail_api',
  GMAIL_NETWORK = 'gmail_network',
  GMAIL_PARSE = 'gmail_parse',
  EMAIL_SEND = 'email_send',
  EMAIL_FETCH = 'email_fetch',
  EMAIL_SEARCH = 'email_search',
  EMAIL_MODIFY = 'email_modify',
  AI_ACTION = 'ai_action',
  AI_VALIDATION = 'ai_validation',
  UI_RENDER = 'ui_render',
  UI_STATE = 'ui_state',
  NETWORK = 'network',
  SSE = 'sse',
  REDIS = 'redis',
  STORAGE_LOCAL = 'storage_local',
  STORAGE_SESSION = 'storage_session',
  UNKNOWN = 'unknown',
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Error recovery strategies
 */
export enum RecoveryStrategy {
  RETRY = 'retry',
  REAUTHENTICATE = 'reauthenticate',
  REFRESH = 'refresh',
  CONTACT_SUPPORT = 'contact_support',
  RETRY_AUTOMATIC = 'retry_automatic',
  FALLBACK = 'fallback',
  IGNORE = 'ignore',
}

/**
 * Structured application error with domain, severity, and recovery guidance
 */
export class AppError extends Error {
  readonly domain: ErrorDomain;
  readonly severity: ErrorSeverity;
  readonly recovery: RecoveryStrategy;
  readonly userMessage: string;
  readonly technicalMessage: string;
  readonly context: Record<string, unknown>;
  readonly originalError?: Error;
  readonly timestamp: Date;
  readonly code?: string;

  constructor(options: {
    domain: ErrorDomain;
    severity: ErrorSeverity;
    recovery: RecoveryStrategy;
    userMessage: string;
    technicalMessage?: string;
    context?: Record<string, unknown>;
    originalError?: Error;
    code?: string;
  }) {
    const technicalMessage = options.technicalMessage || options.userMessage;
    super(technicalMessage);

    this.name = this.constructor.name;
    this.domain = options.domain;
    this.severity = options.severity;
    this.recovery = options.recovery;
    this.userMessage = options.userMessage;
    this.technicalMessage = technicalMessage;
    this.context = options.context || {};
    this.originalError = options.originalError;
    this.timestamp = new Date();
    this.code = options.code;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  isRetryable(): boolean {
    return (
      this.recovery === RecoveryStrategy.RETRY ||
      this.recovery === RecoveryStrategy.RETRY_AUTOMATIC
    );
  }

  requiresUserAction(): boolean {
    return (
      this.recovery === RecoveryStrategy.REAUTHENTICATE ||
      this.recovery === RecoveryStrategy.REFRESH ||
      this.recovery === RecoveryStrategy.RETRY ||
      this.recovery === RecoveryStrategy.CONTACT_SUPPORT
    );
  }

  getTitle(): string {
    const titles: Record<ErrorDomain, string> = {
      [ErrorDomain.AUTH]: 'Authentication Error',
      [ErrorDomain.OAUTH]: 'OAuth Error',
      [ErrorDomain.TOKEN]: 'Token Error',
      [ErrorDomain.GMAIL_API]: 'Gmail API Error',
      [ErrorDomain.GMAIL_NETWORK]: 'Network Error',
      [ErrorDomain.GMAIL_PARSE]: 'Email Parse Error',
      [ErrorDomain.EMAIL_SEND]: 'Send Email Error',
      [ErrorDomain.EMAIL_FETCH]: 'Fetch Email Error',
      [ErrorDomain.EMAIL_SEARCH]: 'Search Error',
      [ErrorDomain.EMAIL_MODIFY]: 'Email Update Error',
      [ErrorDomain.AI_ACTION]: 'AI Action Error',
      [ErrorDomain.AI_VALIDATION]: 'Validation Error',
      [ErrorDomain.UI_RENDER]: 'Component Error',
      [ErrorDomain.UI_STATE]: 'State Error',
      [ErrorDomain.NETWORK]: 'Network Error',
      [ErrorDomain.SSE]: 'Real-time Sync Error',
      [ErrorDomain.REDIS]: 'Storage Error',
      [ErrorDomain.STORAGE_LOCAL]: 'Local Storage Error',
      [ErrorDomain.STORAGE_SESSION]: 'Session Error',
      [ErrorDomain.UNKNOWN]: 'Error',
    };
    return titles[this.domain] || 'Error';
  }
}

// Factory functions for creating domain-specific errors
export function createAuthError(options: {
  userMessage: string;
  technicalMessage?: string;
  context?: Record<string, unknown>;
  originalError?: Error;
}): AppError {
  return new AppError({
    domain: ErrorDomain.AUTH,
    severity: ErrorSeverity.HIGH,
    recovery: RecoveryStrategy.REAUTHENTICATE,
    ...options,
  });
}

export function createTokenError(options: {
  userMessage: string;
  technicalMessage?: string;
  context?: Record<string, unknown>;
  originalError?: Error;
}): AppError {
  return new AppError({
    domain: ErrorDomain.TOKEN,
    severity: ErrorSeverity.HIGH,
    recovery: RecoveryStrategy.REAUTHENTICATE,
    ...options,
  });
}

export function createGmailApiError(options: {
  userMessage: string;
  technicalMessage?: string;
  context?: Record<string, unknown>;
  originalError?: Error;
  code?: string;
}): AppError {
  return new AppError({
    domain: ErrorDomain.GMAIL_API,
    severity: ErrorSeverity.MEDIUM,
    recovery: RecoveryStrategy.RETRY,
    ...options,
  });
}

export function createNetworkError(options: {
  userMessage: string;
  technicalMessage?: string;
  context?: Record<string, unknown>;
  originalError?: Error;
}): AppError {
  return new AppError({
    domain: ErrorDomain.NETWORK,
    severity: ErrorSeverity.MEDIUM,
    recovery: RecoveryStrategy.RETRY_AUTOMATIC,
    ...options,
  });
}

export function createEmailSendError(options: {
  userMessage: string;
  technicalMessage?: string;
  context?: Record<string, unknown>;
  originalError?: Error;
}): AppError {
  return new AppError({
    domain: ErrorDomain.EMAIL_SEND,
    severity: ErrorSeverity.MEDIUM,
    recovery: RecoveryStrategy.RETRY,
    ...options,
  });
}

export function createEmailFetchError(options: {
  userMessage: string;
  technicalMessage?: string;
  context?: Record<string, unknown>;
  originalError?: Error;
}): AppError {
  return new AppError({
    domain: ErrorDomain.EMAIL_FETCH,
    severity: ErrorSeverity.MEDIUM,
    recovery: RecoveryStrategy.RETRY,
    ...options,
  });
}

export function createAiActionError(options: {
  userMessage: string;
  technicalMessage?: string;
  context?: Record<string, unknown>;
  originalError?: Error;
}): AppError {
  return new AppError({
    domain: ErrorDomain.AI_ACTION,
    severity: ErrorSeverity.LOW,
    recovery: RecoveryStrategy.RETRY,
    ...options,
  });
}

export function createValidationError(options: {
  userMessage: string;
  technicalMessage?: string;
  context?: Record<string, unknown>;
  originalError?: Error;
}): AppError {
  return new AppError({
    domain: ErrorDomain.AI_VALIDATION,
    severity: ErrorSeverity.LOW,
    recovery: RecoveryStrategy.IGNORE,
    ...options,
  });
}

export function createUiRenderError(options: {
  userMessage: string;
  technicalMessage?: string;
  context?: Record<string, unknown>;
  originalError?: Error;
}): AppError {
  return new AppError({
    domain: ErrorDomain.UI_RENDER,
    severity: ErrorSeverity.HIGH,
    recovery: RecoveryStrategy.REFRESH,
    ...options,
  });
}

/**
 * Normalize any error into AppError
 */
export function normalizeError(error: unknown, defaultDomain: ErrorDomain = ErrorDomain.UNKNOWN): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Network errors
    if (
      message.includes('network') ||
      message.includes('fetch') ||
      message.includes('timeout') ||
      message.includes('ECONNREFUSED') ||
      message.includes('ENOTFOUND')
    ) {
      return createNetworkError({
        userMessage: 'Network connection failed. Please check your internet connection.',
        technicalMessage: error.message,
        originalError: error,
      });
    }

    // Auth errors
    if (
      message.includes('unauthorized') ||
      message.includes('401') ||
      message.includes('authentication')
    ) {
      return createAuthError({
        userMessage: 'You need to sign in to perform this action.',
        technicalMessage: error.message,
        originalError: error,
      });
    }

    // Validation errors
    if (message.includes('invalid') || message.includes('validation')) {
      return createValidationError({
        userMessage: 'Invalid input. Please check your request and try again.',
        technicalMessage: error.message,
        originalError: error,
      });
    }

    return new AppError({
      domain: defaultDomain,
      severity: ErrorSeverity.MEDIUM,
      recovery: RecoveryStrategy.RETRY,
      userMessage: 'An unexpected error occurred. Please try again.',
      technicalMessage: error.message,
      originalError: error,
    });
  }

  if (typeof error === 'string') {
    return new AppError({
      domain: defaultDomain,
      severity: ErrorSeverity.MEDIUM,
      recovery: RecoveryStrategy.RETRY,
      userMessage: error,
      technicalMessage: error,
    });
  }

  return new AppError({
    domain: ErrorDomain.UNKNOWN,
    severity: ErrorSeverity.MEDIUM,
    recovery: RecoveryStrategy.RETRY,
    userMessage: 'An unexpected error occurred. Please try again.',
    technicalMessage: 'Unknown error type',
    context: { error },
  });
}

/**
 * Log error to console with structured formatting
 */
export function logError(error: AppError | Error): void {
  const isDev = import.meta.env.DEV;

  if (error instanceof AppError) {
    if (isDev) {
      console.group(`[${error.domain.toUpperCase()}] ${error.getTitle()}`);
      console.error('User Message:', error.userMessage);
      console.error('Severity:', error.severity);
      console.error('Recovery:', error.recovery);
      if (Object.keys(error.context).length > 0) {
        console.error('Context:', error.context);
      }
      console.groupEnd();
    } else {
      console.error(`[${error.domain}] ${error.userMessage}`, {
        severity: error.severity,
        recovery: error.recovery,
        code: error.code,
      });
    }
  } else {
    console.error(error);
  }
}

/**
 * Extract recovery action for user display
 */
export function getRecoveryAction(error: AppError): string {
  const actions: Record<RecoveryStrategy, string> = {
    [RecoveryStrategy.RETRY]: 'Please try again.',
    [RecoveryStrategy.REAUTHENTICATE]: 'Please sign in again.',
    [RecoveryStrategy.REFRESH]: 'Please refresh the page.',
    [RecoveryStrategy.CONTACT_SUPPORT]: 'If this problem persists, please contact support.',
    [RecoveryStrategy.RETRY_AUTOMATIC]: 'The system will retry automatically.',
    [RecoveryStrategy.FALLBACK]: 'Using alternative method.',
    [RecoveryStrategy.IGNORE]: 'You can continue using the app.',
  };
  return actions[error.recovery] || 'Please try again.';
}
