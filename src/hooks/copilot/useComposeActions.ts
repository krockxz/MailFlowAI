import { useState } from 'react';
import { useCopilotAction } from '@copilotkit/react-core';
import { useEmails } from '../useEmails';

/**
 * Compose data managed by this hook
 */
export interface ComposeData {
  to: string;
  subject: string;
  body: string;
  isOpen: boolean;
}

/**
 * Hook that registers compose-related AI actions
 *
 * Provides composeEmail and sendEmail actions.
 * Manages composeData state for use by App component.
 *
 * @returns Object with composeData and setComposeData for App component
 */
export function useComposeActions() {
  const { sendEmail } = useEmails();

  // Store compose state for AI to set
  const [composeData, setComposeData] = useState<ComposeData>({
    to: '',
    subject: '',
    body: '',
    isOpen: false,
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

  return { composeData, setComposeData };
}
