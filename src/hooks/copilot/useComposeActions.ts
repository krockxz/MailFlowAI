import { useCopilotAction } from '@copilotkit/react-core';
import { useAppStore } from '@/store';

/**
 * Hook that registers compose-related AI actions
 *
 * Uses Zustand store as single source of truth (DRY principle).
 * No local state management needed.
 *
 * @returns Object with compose state from store
 */
export function useComposeActions() {
  const { compose, setCompose, resetCompose } = useAppStore();

  // Compose an email
  useCopilotAction({
    name: 'composeEmail',
    description: 'Open compose form and fill in email details. The form will visibly populate with the provided information.',
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
        description: 'CC recipients (comma-separated email addresses)',
        required: false,
      },
      {
        name: 'bcc',
        type: 'string',
        description: 'BCC recipients (comma-separated email addresses)',
        required: false,
      },
    ],
    handler: async ({ to, subject, body = '', cc = '', bcc = '' }) => {
      setCompose({
        ...compose,
        to,
        subject,
        body,
        cc,
        bcc,
        isOpen: true,
        isSending: false,
        isAIComposed: true,
      });
      return `Compose form opened with recipient: ${to}, subject: ${subject}${cc ? `, CC: ${cc}` : ''}${bcc ? `, BCC: ${bcc}` : ''}`;
    },
  });

  // Send an email - triggers confirmation dialog
  useCopilotAction({
    name: 'sendEmail',
    description: 'Trigger send confirmation dialog for the currently composed email. The user will review and confirm before sending.',
    parameters: [], // No parameters - uses store state
    handler: async () => {
      if (!compose.to) {
        return 'No email composed yet. Use composeEmail first to fill in the compose form.';
      }
      // Show sending state
      setCompose({ ...compose, isSending: true });
      // Return - actual send happens via confirmation dialog in App
      return `Ready to send email to ${compose.to}. Awaiting user confirmation.`;
    },
  });

  // Expose compose state for components
  return { compose, setCompose, resetCompose };
}

/**
 * Compose data interface (exported for type usage)
 */
export interface ComposeData {
  to: string;
  subject: string;
  body: string;
  cc?: string;
  bcc?: string;
  isOpen: boolean;
  isSending?: boolean;
  isAIComposed?: boolean;
}
