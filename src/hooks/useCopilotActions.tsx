import { useState } from 'react';
import { useCopilotAction, useCopilotReadable } from '@copilotkit/react-core';
import { useAppStore } from '@/store';
import { useEmails } from './useEmails';
import type {
  OpenEmailParams,
  ReplyEmailParams,
  SearchEmailsParams,
} from '@/types/copilot';
import { isWithinRange } from '@/lib/utils';
import type { Email, FilterState, ViewType } from '@/types/email';
import type { AppStore } from '@/types/store';

/**
 * Hook that provides AI-readable context about the application state
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
    available: !!selectedEmailId ? 'enabled' : 'disabled',
  });
}

/**
 * Hook that registers AI-callable actions
 */
export function useCopilotEmailActions() {
  const {
    setCurrentView,
    setSelectedEmailId,
    setFilters,
    clearFilters,
    emails,
  } = useAppStore();

  const { sendEmail, markAsRead } = useEmails();
  const selectedEmailId = useAppStore((state: AppStore) => state.selectedEmailId);

  // Store compose state for AI to set
  const [composeData, setComposeData] = useState<{
    to: string;
    subject: string;
    body: string;
    isOpen: boolean;
  }>({
    to: '',
    subject: '',
    body: '',
    isOpen: false,
  });

  // Navigate to a view
  useCopilotAction({
    name: 'navigateToView',
    description: 'Navigate to a specific view in the mail app',
    parameters: [
      {
        name: 'view',
        type: 'string',
        description: 'The view to navigate to',
        enum: ['inbox', 'sent', 'compose'],
        required: true,
      },
    ],
    handler: async ({ view }) => {
      setCurrentView(view as ViewType);
      return `Navigated to ${view}`;
    },
  });

  // Compose an email
  useCopilotAction({
    name: 'composeEmail',
    description: 'Open the compose form and fill in the email details',
    parameters: [
      {
        name: 'to',
        type: 'string',
        description: 'Recipient email address',
        required: true,
      },
      {
        name: 'subject',
        type: 'string',
        description: 'Email subject',
        required: true,
      },
      {
        name: 'body',
        type: 'string',
        description: 'Email body content',
        required: false,
      },
      {
        name: 'cc',
        type: 'string',
        description: 'CC recipients (comma-separated)',
        required: false,
      },
    ],
    handler: async ({ to, subject, body = '' }) => {
      setComposeData({
        to,
        subject,
        body,
        isOpen: true,
      });
      return `Compose form opened with recipient: ${to}, subject: ${subject}`;
    },
  });

  // Send an email (simple version without complex confirmation UI)
  useCopilotAction({
    name: 'sendEmail',
    description: 'Send the currently composed email after user confirms',
    parameters: [
      {
        name: 'confirm',
        type: 'boolean',
        description: 'User confirmation to send',
        required: true,
      },
    ],
    handler: async ({ confirm }) => {
      if (!confirm) {
        return 'Email send cancelled';
      }

      if (!composeData.to) {
        return 'No email composed yet. Use composeEmail first.';
      }

      try {
        await sendEmail({
          to: [composeData.to],
          subject: composeData.subject,
          body: composeData.body,
        });
        setComposeData({ to: '', subject: '', body: '', isOpen: false });
        return 'Email sent successfully!';
      } catch (error) {
        return `Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    },
  });

  // Search emails
  useCopilotAction({
    name: 'searchEmails',
    description: 'Search for emails with various criteria',
    parameters: [
      {
        name: 'query',
        type: 'string',
        description: 'General search query',
        required: false,
      },
      {
        name: 'sender',
        type: 'string',
        description: 'Filter by sender email or name',
        required: false,
      },
      {
        name: 'dateFrom',
        type: 'string',
        description: 'Filter emails from this date (ISO format)',
        required: false,
      },
      {
        name: 'dateTo',
        type: 'string',
        description: 'Filter emails until this date (ISO format)',
        required: false,
      },
      {
        name: 'isUnread',
        type: 'boolean',
        description: 'Filter for unread only',
        required: false,
      },
      {
        name: 'days',
        type: 'number',
        description: 'Filter emails from last N days',
        required: false,
      },
    ],
    handler: async (params: SearchEmailsParams) => {
      // Build filter state
      const newFilters: import('@/types/email').FilterState = {} as import('@/types/email').FilterState;

      if (params.query) {
        newFilters.query = params.query;
      }
      if (params.sender) {
        newFilters.sender = params.sender;
      }
      if (params.isUnread !== undefined) {
        newFilters.isUnread = params.isUnread;
      }
      if (params.days) {
        newFilters.dateFrom = new Date(Date.now() - params.days * 24 * 60 * 60 * 1000);
      }
      if (params.dateFrom) {
        newFilters.dateFrom = new Date(params.dateFrom);
      }
      if (params.dateTo) {
        newFilters.dateTo = new Date(params.dateTo);
      }

      // Apply filters
      setFilters(newFilters);

      // Navigate to inbox to show results
      setCurrentView('inbox' as ViewType);

      // Count matching emails
      const filtered = emails.inbox.filter((email: Email) => {
        if (newFilters.query && !email.subject.toLowerCase().includes(newFilters.query.toLowerCase()) &&
            !email.body.toLowerCase().includes(newFilters.query.toLowerCase())) {
          return false;
        }
        if (newFilters.sender && !email.from.email.toLowerCase().includes(newFilters.sender.toLowerCase()) &&
            !email.from.name?.toLowerCase().includes(newFilters.sender.toLowerCase())) {
          return false;
        }
        if (newFilters.isUnread && !email.isUnread) {
          return false;
        }
        if (newFilters.dateFrom && !isWithinRange(email.date, newFilters.dateFrom, newFilters.dateTo)) {
          return false;
        }
        return true;
      });

      return `Found ${filtered.length} email${filtered.length !== 1 ? 's' : ''} matching your criteria`;
    },
  });

  // Clear filters
  useCopilotAction({
    name: 'clearFilters',
    description: 'Clear all active email filters',
    parameters: [],
    handler: async () => {
      clearFilters();
      return 'Filters cleared';
    },
  });

  // Open a specific email
  useCopilotAction({
    name: 'openEmail',
    description: 'Open a specific email in detail view',
    parameters: [
      {
        name: 'emailId',
        type: 'string',
        description: 'The ID of the email to open',
        required: false,
      },
      {
        name: 'sender',
        type: 'string',
        description: 'Open the latest email from this sender',
        required: false,
      },
      {
        name: 'subject',
        type: 'string',
        description: 'Open an email with this subject keyword',
        required: false,
      },
      {
        name: 'latest',
        type: 'boolean',
        description: 'Open the latest email',
        required: false,
      },
    ],
    handler: async (params: OpenEmailParams) => {
      let emailToOpen: Email | null = null;

      if (params.emailId) {
        emailToOpen = [...emails.inbox, ...emails.sent].find((e: Email) => e.id === params.emailId) || null;
      } else if (params.sender) {
        const senderEmails = emails.inbox.filter(
          (e: Email) => e.from.email.toLowerCase().includes(params.sender!.toLowerCase()) ||
                 e.from.name?.toLowerCase().includes(params.sender!.toLowerCase())
        );
        emailToOpen = senderEmails[0] || null;
      } else if (params.subject) {
        const subjectEmails = emails.inbox.filter(
          (e: Email) => e.subject.toLowerCase().includes(params.subject!.toLowerCase())
        );
        emailToOpen = subjectEmails[0] || null;
      } else if (params.latest) {
        emailToOpen = emails.inbox[0] || null;
      }

      if (!emailToOpen) {
        return 'Could not find an email matching your criteria';
      }

      setSelectedEmailId(emailToOpen.id);
      return `Opened email: ${emailToOpen.subject}`;
    },
  });

  // Reply to an email
  useCopilotAction({
    name: 'replyToEmail',
    description: 'Reply to an email (uses currently open email if no ID provided)',
    parameters: [
      {
        name: 'emailId',
        type: 'string',
        description: 'The email ID to reply to (optional, uses current email if not provided)',
        required: false,
      },
      {
        name: 'body',
        type: 'string',
        description: 'The reply message body',
        required: true,
      },
    ],
    handler: async (params: ReplyEmailParams) => {
      const emailId = params.emailId || selectedEmailId;

      if (!emailId) {
        return 'No email selected to reply to. Please open an email first.';
      }

      const email = [...emails.inbox, ...emails.sent].find((e: Email) => e.id === emailId);

      if (!email) {
        return `Could not find email with ID: ${emailId}`;
      }

      // Open compose with reply details
      setComposeData({
        to: email.from.email,
        subject: email.subject.startsWith('Re:') ? email.subject : `Re: ${email.subject}`,
        body: params.body,
        isOpen: true,
      });

      return `Composed reply to ${email.from.name || email.from.email}`;
    },
  });

  // Mark as read/unread
  useCopilotAction({
    name: 'markEmailStatus',
    description: 'Mark an email as read or unread',
    parameters: [
      {
        name: 'emailId',
        type: 'string',
        description: 'The email ID (uses current email if not provided)',
        required: false,
      },
      {
        name: 'isRead',
        type: 'boolean',
        description: 'True to mark as read, false to mark as unread',
        required: true,
      },
    ],
    handler: async ({ emailId, isRead }) => {
      const targetId = emailId || selectedEmailId;

      if (!targetId) {
        return 'No email selected';
      }

      try {
        await markAsRead(targetId, !isRead);
        return `Email marked as ${isRead ? 'read' : 'unread'}`;
      } catch (error) {
        return `Failed to mark email: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    },
  });

  return { composeData, setComposeData };
}
