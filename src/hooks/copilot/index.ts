import { useCopilotAction } from '@copilotkit/react-core';
import { useAppStore } from '@/store';
import type { Email } from '@/types/email';
import { useComposeActions } from './useComposeActions';
import { useNavigationActions } from './useNavigationActions';
import { useSearchActions } from './useSearchActions';
import { useEmailActions } from './useEmailActions';

// Re-export individual hooks
export { useAppContext } from './useAppContext';
export { useNavigationActions } from './useNavigationActions';
export { useComposeActions, type ComposeData } from './useComposeActions';
export { useSearchActions } from './useSearchActions';
export { useEmailActions } from './useEmailActions';

/**
 * Hook that registers additional AI actions that need compose state access
 *
 * This hook registers actions that are NOT in the domain-specific
 * hooks but need access to the shared compose state.
 *
 * Follows DRY: doesn't duplicate composeEmail, only adds replyToEmail
 */
function useAdditionalActions() {
  const { compose, setCompose } = useAppStore();
  const { emails, selectedEmailId } = useAppStore();

  // Reply to an email
  useCopilotAction({
    name: 'replyToEmail',
    description: 'Reply to an email. Uses the currently open email if no ID is provided. The reply form will open with recipient and subject pre-filled.',
    parameters: [
      {
        name: 'emailId',
        type: 'string',
        description: 'The email ID to reply to (optional - uses currently open email)',
        required: false,
      },
      {
        name: 'body',
        type: 'string',
        description: 'The reply message content',
        required: true,
      },
    ],
    handler: async (params) => {
      const emailId = params.emailId || selectedEmailId;

      if (!emailId) {
        return 'No email is currently open. Please open an email first by clicking on it or asking me to find and open a specific email.';
      }

      const email = [...emails.inbox, ...emails.sent].find((e: Email) => e.id === emailId);

      if (!email) {
        return `Could not find email with ID: ${emailId}`;
      }

      const senderName = email.from.name || email.from.email;

      // Open compose with reply details using store
      setCompose({
        ...compose,
        to: email.from.email,
        subject: email.subject.startsWith('Re:')
          ? email.subject
          : `Re: ${email.subject}`,
        body: params.body,
        isOpen: true,
        isAIComposed: true,
      });

      return `Reply form opened to ${senderName} with subject "${email.subject}". Your reply is ready to send.`;
    },
  });
}

/**
 * Main aggregator hook
 *
 * Calls all action hooks to ensure CopilotKit actions are registered.
 * This is the main hook that should be called from App.tsx.
 */
export function useCopilotEmailActions() {
  // Call domain-specific hooks
  useNavigationActions();
  useSearchActions();
  useAdditionalActions();
  useEmailActions();

  // Export compose state from useComposeActions
  const { compose } = useComposeActions();

  return { compose };
}

/**
 * Backward compatible alias
 */
export const useCopilotActions = useCopilotEmailActions;
