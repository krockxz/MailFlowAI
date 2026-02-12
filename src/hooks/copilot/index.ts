import { useCopilotAction } from '@copilotkit/react-core';
import { useAppStore } from '@/store';
import type { Email } from '@/types/email';
import { useComposeActions } from './useComposeActions';
import { useNavigationActions } from './useNavigationActions';
import { useSearchActions } from './useSearchActions';
import { useEmailActions } from './useEmailActions';
import { logger, createActionError, ActionErrorType } from './errorHandler';

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
 *
 * Error handling:
 * - Validates email ID existence
 * - Validates body parameter
 * - Handles missing emails gracefully
 * - Provides meaningful error messages
 * - Logs all operations
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
      try {
        logger.info('replyToEmail', 'Replying to email', {
          providedEmailId: params.emailId,
          selectedEmailId,
          hasBody: !!params.body
        });

        // Validate body parameter
        if (!params.body || typeof params.body !== 'string' || params.body.trim() === '') {
          const error = createActionError(
            ActionErrorType.VALIDATION,
            'Reply message content is required. Please provide the body of your reply.'
          );
          logger.log('replyToEmail', error);
          return error.userMessage;
        }

        const emailId = params.emailId || selectedEmailId;

        if (!emailId) {
          const error = createActionError(
            ActionErrorType.VALIDATION,
            'No email is currently open. Please open an email first by clicking on it or asking me to find and open a specific email.'
          );
          logger.log('replyToEmail', error);
          return error.userMessage;
        }

        // Check if emails are loaded
        const allEmails = [...emails.inbox, ...emails.sent];
        if (allEmails.length === 0) {
          logger.warn('replyToEmail', 'No emails loaded');
          return 'No emails are currently loaded. Please wait for emails to sync or refresh the page.';
        }

        // Find the email
        const email = allEmails.find((e: Email) => e.id === emailId);

        if (!email) {
          const error = createActionError(
            ActionErrorType.NOT_FOUND,
            `Could not find email with ID: ${emailId}. It may have been deleted or not loaded yet.`
          );
          logger.log('replyToEmail', error);
          return error.userMessage;
        }

        // Validate sender email exists
        if (!email.from || !email.from.email) {
          const error = createActionError(
            ActionErrorType.STATE,
            'Cannot reply to this email: sender information is missing.'
          );
          logger.log('replyToEmail', error);
          return error.userMessage;
        }

        const senderName = email.from.name || email.from.email;

        try {
          // Open compose with reply details using store
          setCompose({
            ...compose,
            to: email.from.email,
            subject: email.subject.startsWith('Re:')
              ? email.subject
              : `Re: ${email.subject}`,
            body: params.body.trim(),
            isOpen: true,
            isAIComposed: true,
          });
        } catch (stateError) {
          const error = createActionError(
            ActionErrorType.STATE,
            'Failed to open reply form. Please try again.',
            stateError,
            { emailId }
          );
          logger.log('replyToEmail', error);
          return error.userMessage;
        }

        logger.info('replyToEmail', 'Reply form opened successfully', {
          to: senderName,
          subject: email.subject
        });

        return `Reply form opened to ${senderName} with subject "${email.subject}". Your reply is ready to send.`;
      } catch (error) {
        const actionError = createActionError(
          ActionErrorType.UNKNOWN,
          'An error occurred while preparing your reply. Please try again.',
          error,
          { params }
        );
        logger.log('replyToEmail', actionError);
        return actionError.userMessage;
      }
    },
  });
}

/**
 * Main aggregator hook
 *
 * Calls all action hooks to ensure CopilotKit actions are registered.
 * This is the main hook that should be called from App.tsx.
 *
 * Error handling:
 * - All individual hooks have their own error handling
 * - This hook ensures all actions are registered correctly
 */
export function useCopilotEmailActions() {
  try {
    // Call domain-specific hooks
    useNavigationActions();
    useSearchActions();
    useAdditionalActions();
    useEmailActions();

    // Export compose state from useComposeActions
    const { compose } = useComposeActions();

    return { compose };
  } catch (error) {
    logger.log('useCopilotEmailActions', {
      type: ActionErrorType.STATE,
      message: 'Failed to initialize CopilotKit actions',
      userMessage: 'AI actions could not be initialized. Please refresh the page.',
      originalError: error,
      context: {}
    } as any);

    // Return minimal state to prevent app crash
    return { compose: {
      isOpen: false,
      to: '',
      subject: '',
      body: '',
      cc: '',
      bcc: '',
      isSending: false,
      isAIComposed: false,
    }};
  }
}

/**
 * Backward compatible alias
 */
export const useCopilotActions = useCopilotEmailActions;
