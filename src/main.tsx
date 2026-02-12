import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { CopilotKit } from '@copilotkit/react-core'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import './index.css'
import App from './App.tsx'

// CopilotKit configuration
// Get your free public API key from https://cloud.copilotkit.ai
const COPILOT_API_KEY = import.meta.env.VITE_COPILOT_API_KEY
const COPILOT_ENDPOINT = import.meta.env.VITE_COPILOT_ENDPOINT

// Google OAuth configuration
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GMAIL_CLIENT_ID

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
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <CopilotKit publicApiKey={COPILOT_API_KEY} {...(COPILOT_ENDPOINT && { runtimeUrl: COPILOT_ENDPOINT })}>
          <App />
        </CopilotKit>
      </GoogleOAuthProvider>
    </ErrorBoundary>
  </StrictMode>,
)
