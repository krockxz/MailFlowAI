import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { CopilotKit } from '@copilotkit/react-core'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import App from './App.tsx'

// CopilotKit configuration
// Get your free public API key from https://cloud.copilotkit.ai
const COPILOT_API_KEY = import.meta.env.VITE_COPILOT_API_KEY
const COPILOT_ENDPOINT = import.meta.env.VITE_COPILOT_ENDPOINT

// Google OAuth configuration
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GMAIL_CLIENT_ID

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <CopilotKit publicApiKey={COPILOT_API_KEY} runtimeUrl={COPILOT_ENDPOINT}>
        <App />
      </CopilotKit>
    </GoogleOAuthProvider>
  </StrictMode>,
)
