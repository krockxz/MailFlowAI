/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GMAIL_CLIENT_ID: string
  readonly VITE_GMAIL_CLIENT_SECRET: string
  readonly VITE_GMAIL_REDIRECT_URI: string
  readonly VITE_COPILOT_ENDPOINT: string
  readonly VITE_PUBSUB_TOPIC?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
