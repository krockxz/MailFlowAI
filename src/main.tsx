import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { CopilotKit } from '@copilotkit/react-core'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { AuthCallback } from '@/components/AuthCallback'
import './index.css'
import App from './App.tsx'

// CopilotKit configuration
// Get your free public API key from https://cloud.copilotkit.ai
const COPILOT_API_KEY = import.meta.env.VITE_COPILOT_API_KEY
const COPILOT_ENDPOINT = import.meta.env.VITE_COPILOT_ENDPOINT

// Warn if CopilotKit is not configured
if (!COPILOT_API_KEY) {
  console.warn(
    'CopilotKit API key not found. AI assistant features will be disabled. ' +
    'Add VITE_COPILOT_API_KEY to your .env file to enable AI features. ' +
    'Get your free key at https://cloud.copilotkit.ai'
  )
}

/**
 * Error handler for app-level errors
 */
function handleAppError(error: Error, errorInfo: React.ErrorInfo) {
  // Log to console with structured format
  console.error('[AppErrorBoundary] Unhandled error:', {
    message: error.message,
    stack: error.stack,
    componentStack: errorInfo.componentStack,
    timestamp: new Date().toISOString(),
  });

  // In production, you could send this to an error tracking service
  // e.g., Sentry, LogRocket, etc.
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary
      componentName="App"
      onError={handleAppError}
    >
      <BrowserRouter>
        <CopilotKit publicApiKey={COPILOT_API_KEY} {...(COPILOT_ENDPOINT && { runtimeUrl: COPILOT_ENDPOINT })}>
          <Routes>
            {/* OAuth callback route */}
            <Route path="/auth/callback" element={<AuthCallback />} />
            {/* Main app route - acts as catchall */}
            <Route path="*" element={<App />} />
          </Routes>
        </CopilotKit>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)
