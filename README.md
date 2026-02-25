# MailFlowAI

[![Vercel Deployment](https://img.shields.io/badge/Deployed-Vercel-black?style=for-the-badge&logo=vercel)](https://mail-flow-ai.vercel.app)
[![React 19](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)](https://react.dev)
[![Tailwind v4](https://img.shields.io/badge/Tailwind-v4-38bdf8?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com)

**MailFlowAI** is a premium, AI-powered email assistant designed for high-performance productivity. Built with React 19 and Tailwind CSS v4, it offers a seamless, agentic experience for managing your Gmail inbox through natural language.

![App Preview](screenshots/app-preview.png)

---

## ✨ Key Features

- **🤖 AI-Agentic Workflow**: Integrated CopilotKit assistant that understands your inbox context and can compose, search, and manage emails via natural language prompts.
- **⚡ Supercharged Interface**: Ultra-responsive layout with glassmorphic aesthetics, smooth transitions, and a premium dark-mode-first design.
- **🛡️ Secure Google OAuth 2.0**: Direct, client-side authentication with Google, keeping your data secure and private.
- **🔄 Real-time Intelligence**: Periodic background sync with visual feedback, ensuring your inbox is always up to date.
- **🔍 Smart Filtering**: Instant subject, sender, and content filtering with persistent pagination.

---

## 🏗️ Visual Architecture

```mermaid
graph TD
    User((User)) -->|Natural Language| AI[MailFlowAI Assistant]
    User -->|Interacts| UI[React 19 Frontend]

    subgraph "Core Engine"
        UI -->|State| Store[Zustand Persistent Store]
        UI -->|Aesthetics| TW[Tailwind CSS v4]
        AI -->|Context Injection| Store
        AI -->|Action Execution| Store
    end

    subgraph "Integration Layer"
        Store -->|Gmail API| API[Google Workspace Service]
        Store -->|Identity| Auth[Google OAuth 2.0]
    end

    API <-->|Secured REST| Gmail[Google Servers]
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js 20+**
- **Google Cloud Project** with Gmail API enabled
- **OAuth 2.0 Client ID** (Web Application type)

### 1. Setup Environment

Clone the repository and install dependencies:

```bash
npm install
cp .env.example .env
```

Configure your `.env` with the following variables:

```env
# Google OAuth Configuration
VITE_GMAIL_CLIENT_ID=your-client-id.apps.googleusercontent.com
VITE_GMAIL_CLIENT_SECRET=your-client-secret
VITE_GMAIL_REDIRECT_URI=http://localhost:3000/auth/callback

# CopilotKit AI Configuration
VITE_COPILOT_API_KEY=your-api-key
```

### 2. Run Locally

```bash
npm run dev
```

Visit `http://localhost:3000` to start your session.

---

## 🛠️ Technical Decisions

| Category | Decision | Rationale |
| :--- | :--- | :--- |
| **State** | **Zustand** | Minimal boilerplate, high performance, and built-in persistence for offline recovery. |
| **AI** | **CopilotKit** | Native React integration for readable context and action-driven UI control. |
| **Styling** | **Tailwind v4** | CSS-first configuration and lightning-fast build times. |
| **Auth** | **OAuth 2.0** | Industry-standard security with scoped access to Gmail data. |

---

## 🔮 Roadmap

- [ ] **Multi-account Routing**: Seamless switching between multiple Google accounts.
- [ ] **Threaded Conversations**: Advanced grouping of email chains.
- [ ] **Native Attachments**: Drag-and-drop file management through the AI assistant.
- [ ] **Draft Persistence**: Cloud-synced draft management.
- [ ] **E2E Stability**: Comprehensive Playwright test suite for critical flows.

---

*Built with ❤️ by the MailFlowAI Team.*
