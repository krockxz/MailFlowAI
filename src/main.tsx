import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { CopilotKit } from '@copilotkit/react-core'
import './index.css'
import App from './App.tsx'

// CopilotKit configuration
// Get your free public API key from https://cloud.copilotkit.ai
const COPILOT_API_KEY = import.meta.env.VITE_COPILOT_API_KEY
const COPILOT_ENDPOINT = import.meta.env.VITE_COPILOT_ENDPOINT

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CopilotKit publicApiKey={COPILOT_API_KEY} runtimeUrl={COPILOT_ENDPOINT}>
      <App />
    </CopilotKit>
  </StrictMode>,
)
