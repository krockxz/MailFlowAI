import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { CopilotKit } from '@copilotkit/react-core'
import './index.css'
import App from './App.tsx'

// CopilotKit endpoint - for development, we'll use their hosted endpoint
// In production, you would run your own backend
const COPILOT_ENDPOINT = import.meta.env.VITE_COPILOT_ENDPOINT || 'https://copilotkit.ai/api/v1'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CopilotKit runtimeUrl={COPILOT_ENDPOINT}>
      <App />
    </CopilotKit>
  </StrictMode>,
)
