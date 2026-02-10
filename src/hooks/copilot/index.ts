/**
 * Copilot Actions - Aggregator module
 *
 * This module re-exports all domain-specific Copilot action hooks
 * and provides an aggregator hook for backward compatibility.
 *
 * The aggregator hook ensures all CopilotKit actions are registered
 * when called from App.tsx.
 *
 * @module hooks/copilot
 */

// Re-export individual hooks
export { useAppContext } from './useAppContext';
export { useNavigationActions } from './useNavigationActions';
export { useComposeActions, type ComposeData } from './useComposeActions';
export { useSearchActions } from './useSearchActions';
export { useEmailActions } from './useEmailActions';

import { useState } from 'react';
import { useCopilotAction } from '@copilotkit/react-core';
import { useAppStore } from '@/store';
import { useEmails } from '../useEmails';
import type { ReplyEmailParams } from '@/types/copilot';
import type { Email } from '@/types/email';
import type { ComposeData } from './useComposeActions';
import { useNavigationActions } from './useNavigationActions';
import { useSearchActions } from './useSearchActions';

/**
 * Combined Compose Actions hook with reply support
 *
 * Extends useComposeActions with replyToEmail action that needs
 * access to compose state.
 */
function useComposeActionsWithReply() {
  const { sendEmail } = useEmails();

  const [composeData, setComposeData] = useState<ComposeData & { isSending?: boolean }>({
    to: '',
    subject: '',
    body: '',
    isOpen: false,
    isSending: false,
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
        isSending: false,
      });
      return `Compose form opened with recipient: ${to}, subject: ${subject}`;
    },
  });

  // Send an email
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
        // Show sending state in the UI
        setComposeData(prev => ({ ...prev, isSending: true }));

        await sendEmail({
          to: [composeData.to],
          subject: composeData.subject,
          body: composeData.body,
        });

        // Clear compose data after successful send
        setComposeData({ to: '', subject: '', body: '', isOpen: false, isSending: false });
        return 'Email sent successfully!';
      } catch (error) {
        // Clear sending state on error
        setComposeData(prev => ({ ...prev, isSending: false }));
        return `Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    },
  });

  return { composeData, setComposeData };
}

/**
 * Hook that registers all AI-callable actions
 *
 * This is the main aggregator hook that calls all domain-specific
 * action hooks. It maintains backward compatibility with the original
 * useCopilotEmailActions hook.
 *
 * @returns Object with composeData and setComposeData for App component
 */
export function useCopilotEmailActions() {
  const { setSelectedEmailId, emails } = useAppStore();
  const { markAsRead } = useEmails();

  // Get selected email ID via direct selector
  const selectedEmailId = useAppStore((state) => state.selectedEmailId);

  // Import and call domain-specific action hooks
  useNavigationActions();
  useSearchActions();

  // Get compose state from the extended compose actions
  const { composeData, setComposeData } = useComposeActionsWithReply();

  // Open a specific email
  useCopilotAction({
    name: 'openEmail',
    description: 'Open and display a specific email in the detail view. You can find by sender name/email, subject keywords, or open the latest email.',
    parameters: [
      {
        name: 'emailId',
        type: 'string',
        description: 'The exact ID of the email to open',
        required: false,
      },
      {
        name: 'sender',
        type: 'string',
        description: 'Open the most recent email from this sender (name or email address)',
        required: false,
      },
      {
        name: 'subject',
        type: 'string',
        description: 'Open the most recent email containing this keyword in the subject',
        required: false,
      },
      {
        name: 'latest',
        type: 'boolean',
        description: 'Open the most recent email in the inbox',
        required: false,
      },
    ],
    handler: async (params) => {
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
    description: 'Reply to an email. Uses the currently open email if no ID is provided. The reply form will open with the recipient and subject pre-filled.',
    parameters: [
      {
        name: 'emailId',
        type: 'string',
        description: 'The email ID to reply to (optional - uses the currently open email)',
        required: false,
      },
      {
        name: 'body',
        type: 'string',
        description: 'The reply message content',
        required: true,
      },
    ],
    handler: async (params: ReplyEmailParams) => {
      const emailId = params.emailId || selectedEmailId;

      if (!emailId) {
        return 'No email is currently open. Please open an email first by clicking on it or asking me to find and open a specific email.';
      }

      const email = [...emails.inbox, ...emails.sent].find((e: Email) => e.id === emailId);

      if (!email) {
        return `Could not find email with ID: ${emailId}`;
      }

      const senderName = email.from.name || email.from.email;

      // Open compose with reply details
      setComposeData({
        to: email.from.email,
        subject: email.subject.startsWith('Re:') ? email.subject : `Re: ${email.subject}`,
        body: params.body,
        isOpen: true,
      });

      return `Reply form opened to ${senderName} with subject "${email.subject}". Your reply is ready to send.`;
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

/**
 * Backward compatible alias
 */
export const useCopilotActions = useCopilotEmailActions;
