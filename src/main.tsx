import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { CopilotKit } from '@copilotkit/react-core'
import { GoogleOAuthProvider } from '@react-oauth/google'
import '@copilotkit/react-ui/styles.css'
import './index.css'
import App from './App.tsx'

// CopilotKit configuration
// Get your free public API key from https://cloud.copilotkit.ai
const COPILOT_API_KEY = import.meta.env.VITE_COPILOT_API_KEY
const COPILOT_ENDPOINT = import.meta.env.VITE_COPILOT_ENDPOINT

// Google OAuth configuration
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GMAIL_CLIENT_ID

console.log('[main.tsx] Environment check:', {
  'VITE_GMAIL_CLIENT_ID': GOOGLE_CLIENT_ID ? 'SET' : 'UNSET',
  'VITE_GMAIL_CLIENT_ID length': GOOGLE_CLIENT_ID?.length,
});

// Warn if CopilotKit is not configured
if (!COPILOT_API_KEY) {
  console.warn(
    'CopilotKit API key not found. AI assistant features will be disabled. ' +
    'Add VITE_COPILOT_API_KEY to your .env file to enable AI features. ' +
    'Get your free key at https://cloud.copilotkit.ai'
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <CopilotKit publicApiKey={COPILOT_API_KEY} runtimeUrl={COPILOT_ENDPOINT}>
        <App />
      </CopilotKit>
    </GoogleOAuthProvider>
  </StrictMode>,
)
