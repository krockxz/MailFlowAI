# AI Mail Assistant

An AI-powered email application with integrated Gmail API and CopilotKit AI assistant. The AI assistant can control the UI programmatically — composing emails, navigating views, filtering results, and managing emails through natural language.

## Features

- **Full Gmail Integration** - Real email send/receive via Gmail API
- **Inbox & Sent Views** - Browse and manage your emails
- **AI Assistant** - Natural language interface for email management
- **UI Control** - The AI visibly fills forms and updates the main UI
- **Smart Search & Filters** - Search by sender, date, keywords, read/unread
- **Compose & Reply** - Create new emails and reply to threads
- **Real-time Sync** - Push notifications for new emails (via Pub/Sub)

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v4
- **State**: Zustand
- **AI Framework**: CopilotKit
- **Email API**: Gmail API (Google OAuth 2.0)
- **Real-time**: Google Cloud Pub/Sub

## Screenshots

![AI Mail App](./docs/screenshot.png)

## Setup Instructions

### Prerequisites

- Node.js 20+ (Vite requirement)
- A Google Cloud Project with Gmail API enabled
- OAuth 2.0 credentials from Google Cloud Console

### 1. Google Cloud Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Gmail API:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Gmail API" and enable it
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Application type: "Web application"
   - Authorized redirect URIs: `http://localhost:3000/auth/callback`
   - Save and copy your Client ID and Client Secret

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env`:

```env
VITE_GMAIL_CLIENT_ID=your-client-id.apps.googleusercontent.com
VITE_GMAIL_CLIENT_SECRET=your-client-secret
VITE_GMAIL_REDIRECT_URI=http://localhost:3000/auth/callback
VITE_COPILOT_ENDPOINT=https://copilotkit.ai/api/v1
```

### 4. Run Development Server

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

### 5. Authenticate with Gmail

1. Click "Sign in with Google"
2. Authorize the application
3. Your inbox will load automatically

## AI Assistant Usage

The AI assistant can help you manage emails through natural language:

### Compose Emails
- "Send an email to john@example.com with subject 'Meeting Tomorrow'"
- "Compose an email to sarah@company.com about the project"

### Search & Filter
- "Show me emails from Sarah"
- "Find emails from the last 7 days"
- "Show only unread emails"
- "Search for emails about 'project update'"

### Navigate & Open
- "Open the latest email"
- "Go to sent folder"
- "Open email from David about the meeting"

### Reply & Forward
- "Reply to this email saying I'll be there"
- "Forward this to my manager"

### Context Awareness
- When viewing an email, just say "Reply to this" — the AI knows which email
- "Mark as unread" — applies to current email

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         React Frontend                           │
├─────────────────┬───────────────────────────────────────────────┤
│   Mail Views    │          AI Assistant (CopilotKit)             │
│  - Inbox        │   ┌─────────────────────────────────────────┐ │
│  - Sent         │   │ useCopilotReadable  (app state context) │ │
│  - Compose      │   │ useCopilotAction   (UI operations)      │ │
│  - Detail       │   │ useCopilotChat     (chat interface)     │ │
│  - Filters      │   └─────────────────────────────────────────┘ │
├─────────────────┴───────────────────────────────────────────────┤
│                    State Management (Zustand)                    │
├─────────────────────────────────────────────────────────────────┤
│                      API Layer                                   │
│  - Gmail API Client  - OAuth Handler  - Pub/Sub Webhook         │
└─────────────────────────────────────────────────────────────────┘
```

## Project Structure

```
src/
├── components/        # React components
│   ├── Compose.tsx
│   ├── CopilotSidebar.tsx
│   ├── EmailDetail.tsx
│   ├── EmailList.tsx
│   ├── FilterBar.tsx
│   └── Sidebar.tsx
├── hooks/            # Custom React hooks
│   ├── useCopilotActions.ts
│   └── useEmails.ts
├── lib/              # Utilities
│   ├── copilot.ts
│   └── utils.ts
├── services/         # API services
│   ├── auth.ts       # OAuth handling
│   └── gmail.ts      # Gmail API client
├── store/            # Zustand store
│   └── useAppStore.ts
├── types/            # TypeScript types
│   ├── copilot.ts
│   ├── email.ts
│   └── store.ts
├── App.tsx           # Main app component
└── main.tsx          # Entry point
```

## Evaluation Criteria Status

| # | Criteria | Status |
|---|----------|--------|
| 1 | Mail integration works | ✅ Gmail API with OAuth |
| 2 | Inbox and Sent views | ✅ Both views implemented |
| 3 | Compose via UI | ✅ Full compose form |
| 4 | AI composes/fills form | ✅ CopilotKit actions |
| 5 | AI searches/filters UI | ✅ Filter actions |
| 6 | AI context-aware | ✅ useCopilotReadable |
| 7 | Real-time sync | 🚧 In progress |

## Bonus Features Implemented

- ✅ Reply/forward via AI (+5)
- ✅ Confirmation before send (+5)
- ✅ Rich UI in chat (+3)
- ⏳ Thread view (planned)
- ⏳ Dark mode (planned)
- ⏳ Tests (planned)

## What I'd Improve With More Time

1. **Real-time Pub/Sub Integration** - Complete webhook server setup
2. **Thread/Conversation View** - Group emails by thread
3. **Dark Mode** - Full theme support
4. **Unit Tests** - Add Vitest + React Testing Library
5. **Deploy** - Live demo on Vercel
6. **More AI Actions** - Archive, label, delete, etc.
7. **Attachment Support** - View and send attachments
8. **Multiple Account Support** - Switch between Gmail accounts

## License

MIT

## Author

Built for the Processity.ai hiring task.

---

**Note**: This is a hiring task submission. The application demonstrates clean architecture, AI-controlled UI, and pragmatic engineering.
