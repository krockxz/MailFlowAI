import { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Props for the ErrorBoundary component
 */
interface ErrorBoundaryProps {
  /** Children components to be wrapped by the error boundary */
  children: ReactNode;
  /** Custom fallback component to render when an error occurs */
  fallback?: ReactNode;
  /** Custom error message to display (default: generic message) */
  errorMessage?: string;
  /** Component name for better error tracking */
  componentName?: string;
  /** Custom callback when an error is caught */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

/**
 * State for the ErrorBoundary component
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * Default error fallback UI component
 */
function DefaultErrorFallback({
  error,
  componentName,
  onReset,
  onGoHome,
}: {
  error: Error | null;
  componentName?: string;
  onReset: () => void;
  onGoHome: () => void;
}) {
  const isDevelopment = import.meta.env.MODE === 'development';

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 p-4">
      <div className="max-w-lg w-full bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        {/* Header with icon */}
        <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 px-6 py-8 border-b border-neutral-200 dark:border-neutral-800">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-red-100 dark:bg-red-900/50 flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-white text-center">
            Something went wrong
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 text-center mt-2">
            {componentName
              ? `An error occurred in the ${componentName} component.`
              : 'An unexpected error occurred while rendering this page.'}
          </p>
        </div>

        {/* Error details (development only) */}
        {isDevelopment && error && (
          <div className="px-6 py-4 bg-neutral-100 dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800">
            <details className="group">
              <summary className="flex items-center gap-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 cursor-pointer hover:text-neutral-900 dark:hover:text-white transition-colors">
                <Bug className="w-3.5 h-3.5" />
                <span>View error details (development)</span>
              </summary>
              <div className="mt-3 space-y-2">
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50">
                  <p className="text-xs font-mono text-red-700 dark:text-red-400 break-words">
                    {error.name}: {error.message}
                  </p>
                </div>
                {error.stack && (
                  <pre className="text-[10px] font-mono text-neutral-600 dark:text-neutral-500 overflow-auto max-h-32 p-2 rounded bg-neutral-200/50 dark:bg-neutral-900">
                    {error.stack}
                  </pre>
                )}
              </div>
            </details>
          </div>
        )}

        {/* Action buttons */}
        <div className="px-6 py-5 flex items-center gap-3">
          <Button
            onClick={onReset}
            className="flex-1 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
          <Button
            onClick={onGoHome}
            variant="outline"
            className="flex-1 border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <Home className="w-4 h-4 mr-2" />
            Go Home
          </Button>
        </div>

        {/* Help text */}
        <div className="px-6 pb-6">
          <p className="text-xs text-neutral-500 dark:text-neutral-500 text-center">
            If this problem persists, please try refreshing the page or contact support.
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * A specialized inline error fallback for smaller components
 */
function InlineErrorFallback({
  componentName,
  onReset,
}: {
  componentName?: string;
  onReset: () => void;
}) {
  return (
    <div className="flex items-center justify-center p-6 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-xl">
      <div className="text-center">
        <div className="w-10 h-10 mx-auto rounded-lg bg-red-100 dark:bg-red-900/50 flex items-center justify-center mb-3">
          <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
        </div>
        <p className="text-sm font-medium text-neutral-900 dark:text-white mb-1">
          {componentName ? `${componentName} failed to load` : 'Component error'}
        </p>
        <Button
          onClick={onReset}
          variant="ghost"
          size="sm"
          className="mt-2 text-xs h-8 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/30"
        >
          <RefreshCw className="w-3 h-3 mr-1.5" />
          Retry
        </Button>
      </div>
    </div>
  );
}

/**
 * React Error Boundary Component
 *
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of crashing
 * the entire application.
 *
 * @example
 * ```tsx
 * // Wrap the entire app
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 *
 * // Wrap a specific component
 * <ErrorBoundary componentName="CopilotSidebar" fallback={<CustomError />}>
 *   <CopilotSidebar />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(_error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log the error to console
    console.error(
      `[ErrorBoundary${this.props.componentName ? ` (${this.props.componentName})` : ''}]`,
      error,
      errorInfo
    );

    // Update state with error details
    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Log error details for debugging
    const errorLog = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      componentName: this.props.componentName,
      timestamp: new Date().toISOString(),
    };

    // Store error in sessionStorage for debugging after refresh
    try {
      const errorHistory = JSON.parse(sessionStorage.getItem('errorHistory') || '[]');
      errorHistory.push(errorLog);
      // Keep only last 10 errors
      if (errorHistory.length > 10) {
        errorHistory.shift();
      }
      sessionStorage.setItem('errorHistory', JSON.stringify(errorHistory));
    } catch {
      // Ignore sessionStorage errors
    }
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleGoHome = (): void => {
    // Reset state and navigate to home/inbox
    this.handleReset();
    // Use window.location for full refresh to clean state
    window.location.href = '/';
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Otherwise use default error UI
      return (
        <DefaultErrorFallback
          error={this.state.error}
          componentName={this.props.componentName}
          onReset={this.handleReset}
          onGoHome={this.handleGoHome}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * HOC to wrap a component with an error boundary
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options?: Pick<ErrorBoundaryProps, 'componentName' | 'onError' | 'fallback'>
): React.ComponentType<P> {
  const WrappedWithErrorBoundary = (props: P) => (
    <ErrorBoundary
      componentName={options?.componentName}
      onError={options?.onError}
      fallback={options?.fallback}
    >
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );

  WrappedWithErrorBoundary.displayName = `withErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return WrappedWithErrorBoundary;
}

/**
 * A lightweight inline error boundary for smaller components
 * Shows a compact error message instead of a full-page error
 */
export function InlineErrorBoundary({
  children,
  componentName,
  fallback,
  onError,
}: ErrorBoundaryProps) {
  // Inline version uses the class component but with a different fallback
  return (
    <ErrorBoundary
      componentName={componentName}
      onError={onError}
      fallback={
        fallback || (
          <InlineErrorFallback
            componentName={componentName}
            onReset={() => window.location.reload()}
          />
        )
      }
    >
      {children}
    </ErrorBoundary>
  );
}
