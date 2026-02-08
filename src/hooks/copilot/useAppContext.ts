import { useCopilotReadable } from '@copilotkit/react-core';
import { useAppStore } from '@/store';
import type { Email } from '@/types/email';

/**
 * Hook that provides AI-readable context about the application state
 *
 * Registers 4 context providers:
 * 1. Current application view (view, selectedEmailId, filterState, userEmail)
 * 2. Inbox emails summary (first 20 emails, available when view === 'inbox')
 * 3. Sent emails summary (first 20 emails, available when view === 'sent')
 * 4. Currently selected email details (available when selectedEmailId is set)
 */
export function useAppContext() {
  const {
    currentView,
    selectedEmailId,
    emails,
    filters,
    user,
  } = useAppStore();

  // Provide current view context
  useCopilotReadable({
    description: 'Current application view',
    value: JSON.stringify({
      view: currentView,
      selectedEmailId,
      filterState: filters,
      userEmail: user?.emailAddress,
    }),
  });

  // Provide inbox summary
  useCopilotReadable({
    description: 'Inbox emails summary (first 20 emails)',
    value: JSON.stringify(
      emails.inbox.slice(0, 20).map((e: Email) => ({
        id: e.id,
        subject: e.subject,
        from: e.from,
        date: e.date.toISOString(),
        isUnread: e.isUnread,
        snippet: e.snippet?.slice(0, 100),
      }))
    ),
    available: currentView === 'inbox' ? 'enabled' : 'disabled',
  });

  // Provide sent emails summary
  useCopilotReadable({
    description: 'Sent emails summary (first 20 emails)',
    value: JSON.stringify(
      emails.sent.slice(0, 20).map((e: Email) => ({
        id: e.id,
        subject: e.subject,
        to: e.to,
        date: e.date.toISOString(),
        snippet: e.snippet?.slice(0, 100),
      }))
    ),
    available: currentView === 'sent' ? 'enabled' : 'disabled',
  });

  // Provide selected email details
  useCopilotReadable({
    description: 'Currently selected/open email details',
    value: JSON.stringify(
      [...emails.inbox, ...emails.sent].find((e: Email) => e.id === selectedEmailId) || null
    ),
    available: selectedEmailId ? 'enabled' : 'disabled',
  });
}
