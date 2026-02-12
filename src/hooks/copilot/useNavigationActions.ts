import { useCopilotAction } from '@copilotkit/react-core';
import { useAppStore } from '@/store';
import type { ViewType } from '@/types/email';
import { logger, createActionError, ActionErrorType } from './errorHandler';

/**
 * Hook that registers navigation-related AI actions
 *
 * Provides the navigateToView action for switching between
 * inbox, sent, and compose views.
 *
 * Error handling:
 * - Validates view type before navigation
 * - Logs navigation attempts
 * - Returns meaningful error messages for invalid views
 */
export function useNavigationActions() {
  const { setCurrentView } = useAppStore();

  // Valid view types for validation
  const validViews: ViewType[] = ['inbox', 'sent', 'compose', 'detail'];

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
      try {
        logger.info('navigateToView', `Attempting to navigate to: ${view}`);

        // Validate view type
        if (!view || typeof view !== 'string') {
          const error = createActionError(
            ActionErrorType.VALIDATION,
            'View parameter is required and must be a string',
            { view }
          );
          logger.log('navigateToView', error);
          return error.userMessage;
        }

        const normalizedView = view.toLowerCase().trim() as ViewType;

        // Check if view is valid
        if (!validViews.includes(normalizedView)) {
          const error = createActionError(
            ActionErrorType.VALIDATION,
            `Invalid view "${view}". Valid views are: ${validViews.join(', ')}`,
            { view, validViews }
          );
          logger.log('navigateToView', error);
          return error.userMessage;
        }

        // Perform navigation
        setCurrentView(normalizedView);

        logger.info('navigateToView', `Successfully navigated to: ${normalizedView}`);
        return `Navigated to ${normalizedView}`;
      } catch (error) {
        const actionError = createActionError(
          ActionErrorType.STATE,
          'Failed to navigate. Please try again.',
          error,
          { view }
        );
        logger.log('navigateToView', actionError);
        return actionError.userMessage;
      }
    },
  });
}
