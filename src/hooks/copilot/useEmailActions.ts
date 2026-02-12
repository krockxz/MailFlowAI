import { useCopilotAction } from '@copilotkit/react-core';
import { useAppStore } from '@/store';
import { useEmails } from '../useEmails';
import type { OpenEmailParams } from '@/types/copilot';
import type { Email } from '@/types/email';
import { logger, createActionError, ActionErrorType } from './errorHandler';

/**
 * Hook that registers email operation AI actions
 *
 * Provides openEmail, replyToEmail, and markEmailStatus actions
 * for interacting with individual emails.
 *
 * Error handling:
 * - Validates email IDs before operations
 * - Handles missing emails gracefully
 * - Wraps async operations with try-catch
 * - Provides meaningful error messages
 * - Logs all operations for debugging
 * - Handles API errors from Gmail service
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

  /**
   * Find an email by various criteria
   */
  function findEmail(params: OpenEmailParams): Email | null {
    const allEmails = [...emails.inbox, ...emails.sent];

    // Check if emails are loaded
    if (allEmails.length === 0) {
      logger.warn('openEmail', 'No emails loaded');
      return null;
    }

    let emailToOpen: Email | null = null;

    if (params.emailId) {
      emailToOpen = allEmails.find((e: Email) => e.id === params.emailId) || null;
      if (!emailToOpen) {
        logger.warn('openEmail', `Email not found by ID: ${params.emailId}`);
      }
    } else if (params.sender) {
      const senderLower = params.sender.toLowerCase();
      const senderEmails = emails.inbox.filter(
        (e: Email) => {
          const emailMatch = e.from?.email?.toLowerCase().includes(senderLower) ?? false;
          const nameMatch = e.from?.name?.toLowerCase().includes(senderLower) ?? false;
          return emailMatch || nameMatch;
        }
      );
      emailToOpen = senderEmails[0] || null;
      if (!emailToOpen) {
        logger.warn('openEmail', `No email found from sender: ${params.sender}`);
      }
    } else if (params.subject) {
      const subjectLower = params.subject.toLowerCase();
      const subjectEmails = emails.inbox.filter(
        (e: Email) => e.subject?.toLowerCase().includes(subjectLower) ?? false
      );
      emailToOpen = subjectEmails[0] || null;
      if (!emailToOpen) {
        logger.warn('openEmail', `No email found with subject: ${params.subject}`);
      }
    } else if (params.latest) {
      emailToOpen = emails.inbox[0] || null;
      if (!emailToOpen) {
        logger.warn('openEmail', 'No emails in inbox');
      }
    }

    return emailToOpen;
  }

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
      try {
        logger.info('openEmail', 'Opening email', params);

        // Validate that at least one search parameter is provided
        if (!params.emailId && !params.sender && !params.subject && !params.latest) {
          const error = createActionError(
            ActionErrorType.VALIDATION,
            'Please specify an email to open using emailId, sender, subject, or latest'
          );
          logger.log('openEmail', error);
          return error.userMessage;
        }

        // Find the email
        const emailToOpen = findEmail(params);

        if (!emailToOpen) {
          // Provide helpful error message based on what was searched
          let errorMessage = 'Could not find an email';
          if (params.emailId) {
            errorMessage = `Could not find an email with ID "${params.emailId}"`;
          } else if (params.sender) {
            errorMessage = `Could not find an email from "${params.sender}"`;
          } else if (params.subject) {
            errorMessage = `Could not find an email with subject containing "${params.subject}"`;
          } else if (params.latest) {
            const allEmails = [...emails.inbox, ...emails.sent];
            if (allEmails.length === 0) {
              errorMessage = 'No emails are currently loaded. Please wait for emails to sync.';
            } else {
              errorMessage = 'No emails found in your inbox';
            }
          }

          const error = createActionError(
            ActionErrorType.NOT_FOUND,
            errorMessage,
            { params }
          );
          logger.log('openEmail', error);
          return errorMessage;
        }

        // Set the selected email
        try {
          setSelectedEmailId(emailToOpen.id);
        } catch (stateError) {
          const error = createActionError(
            ActionErrorType.STATE,
            'Failed to open email. Please try again.',
            stateError,
            { emailId: emailToOpen.id }
          );
          logger.log('openEmail', error);
          return error.userMessage;
        }

        logger.info('openEmail', `Opened email: ${emailToOpen.subject}`, {
          emailId: emailToOpen.id,
          subject: emailToOpen.subject
        });

        return `Opened email: ${emailToOpen.subject}`;
      } catch (error) {
        const actionError = createActionError(
          ActionErrorType.UNKNOWN,
          'An error occurred while opening the email. Please try again.',
          error,
          { params }
        );
        logger.log('openEmail', actionError);
        return actionError.userMessage;
      }
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
      try {
        logger.info('markEmailStatus', `Marking email as ${isRead ? 'read' : 'unread'}`, {
          providedEmailId: emailId,
          selectedEmailId,
          isRead
        });

        const targetId = emailId || selectedEmailId;

        if (!targetId) {
          const error = createActionError(
            ActionErrorType.VALIDATION,
            'No email selected. Please open an email first or provide an email ID.'
          );
          logger.log('markEmailStatus', error);
          return error.userMessage;
        }

        // Validate isRead parameter
        if (typeof isRead !== 'boolean') {
          const error = createActionError(
            ActionErrorType.VALIDATION,
            'isRead parameter must be a boolean (true or false)'
          );
          logger.log('markEmailStatus', error);
          return error.userMessage;
        }

        // Check if email exists
        const allEmails = [...emails.inbox, ...emails.sent];
        const emailExists = allEmails.some((e: Email) => e.id === targetId);
        if (!emailExists) {
          const error = createActionError(
            ActionErrorType.NOT_FOUND,
            `Email with ID "${targetId}" not found`
          );
          logger.log('markEmailStatus', error);
          return error.userMessage;
        }

        // Perform the mark as read operation
        await markAsRead(targetId, !isRead);

        logger.info('markEmailStatus', `Successfully marked email as ${isRead ? 'read' : 'unread'}`, {
          emailId: targetId,
          isRead
        });

        return `Email marked as ${isRead ? 'read' : 'unread'}`;
      } catch (error) {
        // Classify the error type
        let errorType = ActionErrorType.UNKNOWN;
        let userMessage = 'Failed to mark email. Please try again.';

        if (error instanceof Error) {
          const message = error.message.toLowerCase();

          if (message.includes('network') || message.includes('fetch')) {
            errorType = ActionErrorType.NETWORK;
            userMessage = 'Network error: Could not connect to Gmail. Please check your connection.';
          } else if (message.includes('unauthorized') || message.includes('401') || message.includes('403')) {
            errorType = ActionErrorType.PERMISSION;
            userMessage = 'Permission denied: You may need to re-authenticate with Gmail.';
          } else if (message.includes('not found') || message.includes('404')) {
            errorType = ActionErrorType.NOT_FOUND;
            userMessage = 'Email not found or may have been deleted.';
          }
        }

        const actionError = createActionError(
          errorType,
          userMessage,
          error,
          { emailId, isRead }
        );
        logger.log('markEmailStatus', actionError);
        return actionError.userMessage;
      }
    },
  });

  // Note: replyToEmail is implemented in the aggregator (index.ts)
  // to share composeData state with composeEmail and sendEmail actions
}
