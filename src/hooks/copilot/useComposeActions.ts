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
  cc?: string;
  isOpen: boolean;
  isSending?: boolean;
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
    cc: '',
    isOpen: false,
    isSending: false,
  });

  // Compose an email
  useCopilotAction({
    name: 'composeEmail',
    description: 'Open the compose form and fill in the email details. The form will visibly populate with the provided information.',
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
    ],
    handler: async ({ to, subject, body = '', cc = '' }) => {
      setComposeData({
        to,
        subject,
        body,
        cc,
        isOpen: true,
        isSending: false,
      });
      return `Compose form opened with recipient: ${to}, subject: ${subject}${cc ? `, CC: ${cc}` : ''}`;
    },
  });

  // Send an email (simple version without complex confirmation UI)
  useCopilotAction({
    name: 'sendEmail',
    description: 'Send the currently composed email after user confirms. The compose form should be visible with the content before sending.',
    parameters: [
      {
        name: 'confirm',
        type: 'boolean',
        description: 'User confirmation to send - only send if this is true',
        required: true,
      },
    ],
    handler: async ({ confirm }) => {
      if (!confirm) {
        return 'Email send cancelled';
      }

      if (!composeData.to) {
        return 'No email composed yet. Use composeEmail first to fill in the compose form.';
      }

      try {
        // Show sending state in the UI
        setComposeData(prev => ({ ...prev, isSending: true }));

        await sendEmail({
          to: [composeData.to],
          subject: composeData.subject,
          body: composeData.body,
          cc: composeData.cc ? [composeData.cc] : undefined,
        });

        // Clear compose data after successful send
        setComposeData({ to: '', subject: '', body: '', cc: '', isOpen: false, isSending: false });
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
