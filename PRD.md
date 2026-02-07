# Product Requirements Document (PRD)
## AI-Powered Mail Web Application

### Project Overview
Build a mail web application with an integrated AI assistant that can control the UI programmatically — composing emails, navigating between views, displaying filtered results, and interacting with the interface on the user's behalf.

---

## 1. Core Features

### 1.1 Mail Client
| Feature | Description | Priority |
|---------|-------------|----------|
| **Inbox View** | List received emails (sender, subject, preview, date) | High |
| **Sent View** | List sent emails | High |
| **Compose View** | Write emails (To, Subject, Body) | High |
| **Email Detail** | Read full email content | High |

### 1.2 Real-Time Mail Sync
| Feature | Description | Priority |
|---------|-------------|----------|
| **Push Notifications** | New emails appear without refresh using Gmail Pub/Sub | Medium |

### 1.3 AI Assistant (Critical - Primary Evaluation Area)
| Feature | Description | Priority |
|---------|-------------|----------|
| **Compose & Send** | "Send email to X" visibly fills form and sends | Critical |
| **Search & Display** | "Show emails from last 10 days" updates main UI | Critical |
| **Navigate & Open** | "Open latest email from David" opens detail view | High |
| **Context Awareness** | "Reply to this" knows open email | High |
| **Filters via Assistant** | "Show unread from this week" filters inbox | Critical |

### 1.4 Filters
| Feature | Description | Priority |
|---------|-------------|----------|
| **Date Range** | Filter emails by date | Medium |
| **Sender** | Filter by sender | Medium |
| **Keyword** | Search email content | Medium |
| **Read/Unread** | Toggle read/unread status | Medium |
| **UI Controls** | Dropdowns, date pickers | Medium |

---

## 2. Technical Architecture

### 2.1 Tech Stack
| Component | Technology | Rationale |
|-----------|------------|-----------|
| **Frontend Framework** | React + Vite | Fast dev, modern tooling |
| **Language** | TypeScript | Type safety |
| **Styling** | Tailwind CSS v4 | Rapid UI development |
| **AI Framework** | CopilotKit | Built for AI-controlled UI |
| **Mail Provider** | Gmail API | Rich API, push notifications |
| **Authentication** | Google OAuth 2.0 | Standard Gmail auth |
| **Real-time Sync** | Gmail Pub/Sub + Webhook | Push notifications |

### 2.2 Architecture Diagram
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
│                    State Management (Zustand/Jotai)              │
├─────────────────────────────────────────────────────────────────┤
│                      API Layer                                   │
│  - Gmail API Client  - OAuth Handler  - Pub/Sub Webhook         │
└─────────────────────────────────────────────────────────────────┘
         │                           │
         ▼                           ▼
┌─────────────────┐         ┌─────────────────┐
│   Gmail API     │         │  Pub/Sub        │
│  (REST/GraphQL) │         │  (Push)         │
└─────────────────┘         └─────────────────┘
```

---

## 3. CopilotKit Integration Design

### 3.1 Actions the AI Can Execute
```typescript
// Compose & Send Actions
composeEmail({ to, subject, body })
sendEmail()

// Navigation Actions
navigateToView(view: 'inbox' | 'sent' | 'compose')
openEmail(emailId)
replyToEmail(emailId, body)

// Search & Filter Actions
searchEmails(query)
filterEmails({ dateRange, sender, keyword, isUnread })

// State Actions
markAsRead(emailId)
markAsUnread(emailId)
```

### 3.2 Context Provided to AI
```typescript
// Current View Context
currentView: 'inbox' | 'sent' | 'compose' | 'detail'
currentFilter: FilterState
selectedEmail: Email | null

// Email Data
inboxEmails: Email[]
sentEmails: Email[]
totalUnread: number

// User State
userEmail: string
```

---

## 4. User Flows

### 4.1 Natural Language → UI Control Flow
```
User: "Send an email to john@example.com about the meeting"
  ↓
AI parses intent + parameters
  ↓
useCopilotAction: composeEmail()
  ↓
UI updates: Navigate to Compose → Form visibly fills
  ↓
User confirms → sendEmail()
```

### 4.2 Search Flow
```
User: "Show me emails from Sarah about the project"
  ↓
AI: parseEmails() → filterEmails({ sender: "Sarah", keyword: "project" })
  ↓
Main UI updates to show filtered results
  ↓
Chat shows: "Found 3 emails from Sarah about the project"
```

---

## 5. Evaluation Criteria Mapping

| # | Criteria | Weight | Implementation |
|---|----------|--------|----------------|
| 1 | Mail integration works | 20% | Gmail API with OAuth |
| 2 | Inbox and Sent views | 15% | React components with real data |
| 3 | Compose via UI | 10% | Compose form with send |
| 4 | AI composes/fills form | 20% | CopilotKit actions |
| 5 | AI searches/filters UI | 15% | useCopilotAction for filters |
| 6 | AI context-aware | 10% | useCopilotReadable for state |
| 7 | Real-time sync | 10% | Pub/Sub webhook |

### Bonus Features
| Feature | Points | Implementation |
|---------|--------|----------------|
| Reply/forward via AI | +5 | replyToEmail action |
| Confirmation before send | +5 | renderAndWaitForResponse |
| Rich UI in chat | +3 | Custom message components |
| Thread view | +3 | Gmail thread API |
| Dark mode | +2 | Tailwind dark: classes |
| Tests | +3 | Vitest + React Testing Library |
| Live demo | +2 | Vercel/Netlify deploy |

---

## 6. Development Phases

### Phase 1: Foundation (Project Setup)
- [ ] Initialize Vite + React + TypeScript
- [ ] Configure Tailwind CSS v4
- [ ] Set up project structure
- [ ] Configure ESLint, Prettier

### Phase 2: Gmail API Integration
- [ ] Set up Google Cloud Console project
- [ ] Configure OAuth 2.0 credentials
- [ ] Implement OAuth flow
- [ ] Create Gmail API client
- [ ] Fetch inbox emails
- [ ] Fetch sent emails
- [ ] Implement send email

### Phase 3: Core Mail UI
- [ ] Build email list component
- [ ] Build email detail view
- [ ] Build compose form
- [ ] Build navigation (Inbox/Sent/Compose)
- [ ] Implement filters UI

### Phase 4: CopilotKit Integration
- [ ] Install and configure CopilotKit
- [ ] Set up CopilotProvider
- [ ] Implement useCopilotReadable for context
- [ ] Implement useCopilotAction for UI control
- [ ] Build chat sidebar component

### Phase 5: AI Actions Implementation
- [ ] Compose email action
- [ ] Send email action
- [ ] Search/filter action
- [ ] Navigation action
- [ ] Reply action
- [ ] Context awareness

### Phase 6: Real-Time Sync
- [ ] Set up Cloud Pub/Sub
- [ ] Create webhook endpoint
- [ ] Implement watch mechanism
- [ ] Handle push notifications
- [ ] Update UI in real-time

### Phase 7: Polish & Bonus Features
- [ ] Dark mode
- [ ] Confirmation before send
- [ ] Thread view
- [ ] Rich chat UI
- [ ] Tests
- [ ] Deploy

---

## 7. API Endpoints Needed

### Gmail API
- `GET /gmail/v1/users/me/messages` - List messages
- `GET /gmail/v1/users/me/messages/{id}` - Get message
- `POST /gmail/v1/users/me/messages/send` - Send message
- `POST /gmail/v1/users/me/messages/{id}/modify` - Modify labels
- `POST /gmail/v1/users/me/watch` - Set up push notification
- `GET /oauth2/v4/token` - Refresh token

### Internal Backend (if needed)
- `GET /api/auth/google` - Initiate OAuth
- `GET /api/auth/callback` - OAuth callback
- `POST /api/webhook/gmail` - Pub/Sub webhook

---

## 8. Data Models

```typescript
interface Email {
  id: string;
  threadId: string;
  snippet: string;
  subject: string;
  from: EmailAddress;
  to: EmailAddress[];
  date: Date;
  body: string;
  isUnread: boolean;
  labels: string[];
}

interface EmailAddress {
  name: string;
  email: string;
}

interface FilterState {
  query?: string;
  sender?: string;
  dateFrom?: Date;
  dateTo?: Date;
  isUnread?: boolean;
}

interface AppState {
  currentView: View;
  emails: {
    inbox: Email[];
    sent: Email[];
  };
  filters: FilterState;
  selectedEmail: Email | null;
  user: UserProfile | null;
}
```

---

## 9. Success Metrics

1. ✅ Can receive real emails in inbox
2. ✅ Can send real emails via UI
3. ✅ AI can compose and fill form visibly
4. ✅ AI can search and filter emails
5. ✅ AI can navigate between views
6. ✅ AI is context-aware (knows open email)
7. ✅ New emails appear without refresh

---

## 10. Open Questions & Decisions

| Question | Options | Decision |
|----------|---------|----------|
| Backend framework? | Next.js / Vite / Remix | Vite (faster, simpler) |
| State management? | Zustand / Jotai / Redux | Zustand (simple) |
| OAuth flow? | NextAuth / Custom | Custom (more control) |
| Real-time server? | Needed / Not needed | Evaluate in Phase 6 |
| Deployment? | Vercel / Netlify / Custom | Vercel (easy) |

---

## 11. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Gmail API quota | Medium | Implement caching, pagination |
| OAuth complexity | Medium | Follow Google docs strictly |
| Pub/Sub setup | High | Have fallback to polling |
| CopilotKit learning | Low | Good docs, examples available |
| Time constraint (5 days) | High | Focus on core features first |

---

## 12. Sources

- [Gmail API Sending Guide](https://developers.google.com/workspace/gmail/api/guides/sending)
- [Gmail Push Notifications](https://developers.google.com/workspace/gmail/api/guides/push)
- [Building Real-Time Gmail with Pub/Sub](https://smythos.com/developers/agent-integrations/building-a-real-time-gmail-processing-pipeline-with-pub-sub-webhooks/)
- [CopilotKit GitHub](https://github.com/CopilotKit/CopilotKit)
- [Generative UI Guide 2026](https://www.copilotkit.ai/blog/the-developer-s-guide-to-generative-ui-in-2026)
- [Google OAuth 2.0 for Next.js](https://nextnative.dev/blog/google-oauth-2-0)
- [Tailwind CSS Vite Plugin](https://tailwindcss.com/docs)
