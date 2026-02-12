import { useCopilotAction } from '@copilotkit/react-core';
import { useAppStore } from '@/store';
import { logger, createActionError, ActionErrorType, isValidEmail, isValidEmailList } from './errorHandler';

/**
 * Hook that registers compose-related AI actions
 *
 * Uses Zustand store as single source of truth (DRY principle).
 * No local state management needed.
 *
 * Error handling:
 * - Validates email addresses for to, cc, bcc fields
 * - Validates required fields (to, subject)
 * - Provides meaningful error messages for invalid input
 * - Logs all compose attempts and errors
 * - Handles state management safely
 *
 * @returns Object with compose state from store
 */
export function useComposeActions() {
  const { compose, setCompose, resetCompose } = useAppStore();

  // Validate email addresses
  function validateEmails(to: string, cc?: string, bcc?: string): { valid: boolean; error?: string } {
    if (!to || to.trim() === '') {
      return { valid: false, error: 'Recipient email address is required' };
    }

    // Extract and validate "to" email(s)
    const toEmails = to.split(',').map(e => e.trim()).filter(e => e);
    const invalidTo = toEmails.filter(email => !isValidEmail(email));
    if (invalidTo.length > 0) {
      return { valid: false, error: `Invalid recipient email address(es): ${invalidTo.join(', ')}` };
    }

    // Validate CC if provided
    if (cc && cc.trim() !== '' && !isValidEmailList(cc)) {
      return { valid: false, error: 'Invalid CC email address format' };
    }

    // Validate BCC if provided
    if (bcc && bcc.trim() !== '' && !isValidEmailList(bcc)) {
      return { valid: false, error: 'Invalid BCC email address format' };
    }

    return { valid: true };
  }

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
      try {
        logger.info('composeEmail', 'Composing email', { to, subject, hasCc: !!cc, hasBcc: !!bcc });

        // Validate subject
        if (!subject || subject.trim() === '') {
          const error = createActionError(
            ActionErrorType.VALIDATION,
            'Email subject is required'
          );
          logger.log('composeEmail', error);
          return error.userMessage;
        }

        // Validate email addresses
        const emailValidation = validateEmails(to, cc, bcc);
        if (!emailValidation.valid) {
          const error = createActionError(
            ActionErrorType.VALIDATION,
            emailValidation.error || 'Invalid email addresses'
          );
          logger.log('composeEmail', error);
          return error.userMessage;
        }

        // Sanitize inputs
        const sanitizedTo = to.split(',').map(e => e.trim()).filter(e => e).join(', ');
        const sanitizedCc = cc ? cc.split(',').map(e => e.trim()).filter(e => e).join(', ') : '';
        const sanitizedBcc = bcc ? bcc.split(',').map(e => e.trim()).filter(e => e).join(', ') : '';
        const sanitizedSubject = subject.trim();
        const sanitizedBody = typeof body === 'string' ? body.trim() : '';

        // Update compose state
        setCompose({
          ...compose,
          to: sanitizedTo,
          subject: sanitizedSubject,
          body: sanitizedBody,
          cc: sanitizedCc,
          bcc: sanitizedBcc,
          isOpen: true,
          isSending: false,
          isAIComposed: true,
        });

        logger.info('composeEmail', 'Compose form opened successfully', {
          to: sanitizedTo,
          subject: sanitizedSubject
        });

        return `Compose form opened with recipient: ${sanitizedTo}, subject: ${sanitizedSubject}${sanitizedCc ? `, CC: ${sanitizedCc}` : ''}${sanitizedBcc ? `, BCC: ${sanitizedBcc}` : ''}`;
      } catch (error) {
        const actionError = createActionError(
          ActionErrorType.STATE,
          'Failed to open compose form. Please try again.',
          error,
          { to, subject }
        );
        logger.log('composeEmail', actionError);
        return actionError.userMessage;
      }
    },
  });

  // Send an email - triggers confirmation dialog
  useCopilotAction({
    name: 'sendEmail',
    description: 'Trigger send confirmation dialog for the currently composed email. The user will review and confirm before sending.',
    parameters: [], // No parameters - uses store state
    handler: async () => {
      try {
        logger.info('sendEmail', 'Attempting to trigger send confirmation', {
          hasTo: !!compose.to,
          hasSubject: !!compose.subject,
          isOpen: compose.isOpen
        });

        if (!compose.to || compose.to.trim() === '') {
          const error = createActionError(
            ActionErrorType.VALIDATION,
            'No email composed yet. Use composeEmail first to fill in the compose form.'
          );
          logger.log('sendEmail', error);
          return error.userMessage;
        }

        // Validate current compose state has valid email
        const emailValidation = validateEmails(compose.to, compose.cc, compose.bcc);
        if (!emailValidation.valid) {
          const error = createActionError(
            ActionErrorType.VALIDATION,
            `Cannot send: ${emailValidation.error}`
          );
          logger.log('sendEmail', error);
          return error.userMessage;
        }

        // Show sending state
        setCompose({ ...compose, isSending: true });

        logger.info('sendEmail', 'Send confirmation triggered', {
          to: compose.to,
          subject: compose.subject
        });

        // Return - actual send happens via confirmation dialog in App
        return `Ready to send email to ${compose.to}. Awaiting user confirmation.`;
      } catch (error) {
        const actionError = createActionError(
          ActionErrorType.STATE,
          'Failed to prepare email for sending. Please try again.',
          error
        );
        logger.log('sendEmail', actionError);

        // Reset sending state on error
        setCompose({ ...compose, isSending: false });

        return actionError.userMessage;
      }
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
