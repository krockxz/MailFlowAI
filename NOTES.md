# CopilotKit Chat Implementation Notes

## Current Status

The chat interface uses `useCopilotChatHeadless_c` from `@copilotkit/react-core` with CopilotKit Cloud (`publicApiKey`).

### Working Features
- Basic chat (sending messages, receiving responses)
- Instructions/system prompts
- Loading states
- Message history

### Not Working (Known Limitations)
- **Client-side actions (`useCopilotAction`) do NOT work with CopilotKit Cloud alone**
- Actions require a **self-hosted runtime** that can execute handlers
- CopilotKit Cloud only supports text-based chat

### To Enable Actions
You have two options:

1. **Use CopilotKit's pre-built UI components** (`<CopilotSidebar>`, `<CopilotChat>`) which include built-in action support
2. **Deploy a custom runtime** (like Express server) that bridges CopilotKit Cloud to your client-side actions

### For Vercel Deployment
- Vercel Edge Functions can host a custom runtime
- Or use CopilotKit's Next.js/Remix adapters for serverless deployment
- See: https://docs.copilotkit.ai for runtime setup guides

## Environment
- `VITE_COPILOT_API_KEY` - Set to your CopilotKit Cloud public API key
- Currently configured correctly in `main.tsx`

## Files
- `src/components/ui/vercel-chat.tsx` - Custom chat UI (headless hook)
- `src/components/CopilotSidebar.tsx` - Sidebar wrapper
- `src/hooks/copilot/*.ts` - Client-side action registrations (not functional with Cloud-only)

## Recommendation
For immediate chat functionality, the current setup with `publicApiKey` is sufficient.
To enable AI actions that control your app (compose, search, navigate), implement a runtime endpoint.
