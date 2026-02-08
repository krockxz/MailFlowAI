import { useCopilotAction } from '@copilotkit/react-core';
import { useAppStore } from '@/store';
import { useEmails } from '../useEmails';
import type { OpenEmailParams } from '@/types/copilot';
import type { Email } from '@/types/email';

/**
 * Hook that registers email operation AI actions
 *
 * Provides openEmail, replyToEmail, and markEmailStatus actions
 * for interacting with individual emails.
 *
 * Note: This hook is not directly used in the aggregator.
 * The aggregator (index.ts) implements these actions inline
 * to share compose state with composeEmail/sendEmail actions.
 */
export function useEmailActions() {
  const { setSelectedEmailId, emails } = useAppStore();
  const { markAsRead } = useEmails();

  // Get selected email ID via direct selector
  const selectedEmailId = useAppStore((state) => state.selectedEmailId);

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

  // Note: replyToEmail is implemented in the aggregator (index.ts)
  // to share composeData state with composeEmail and sendEmail actions
}
