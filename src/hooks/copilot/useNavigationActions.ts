import { useCopilotAction } from '@copilotkit/react-core';
import { useAppStore } from '@/store';
import type { ViewType } from '@/types/email';

/**
 * Hook that registers navigation-related AI actions
 *
 * Provides the navigateToView action for switching between
 * inbox, sent, and compose views.
 */
export function useNavigationActions() {
  const { setCurrentView } = useAppStore();

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
      setCurrentView(view as ViewType);
      return `Navigated to ${view}`;
    },
  });
}
