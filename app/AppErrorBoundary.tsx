'use client';

import { ErrorBoundary } from '@/components/ErrorBoundary';

function handleAppError(error: Error, errorInfo: React.ErrorInfo) {
  console.error('[AppErrorBoundary] Unhandled error:', {
    message: error.message,
    stack: error.stack,
    componentStack: errorInfo.componentStack,
    timestamp: new Date().toISOString(),
  });
}

export function AppErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary componentName="App" onError={handleAppError}>
      {children}
    </ErrorBoundary>
  );
}
