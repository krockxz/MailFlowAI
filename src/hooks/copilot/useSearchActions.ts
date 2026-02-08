import { useCopilotAction } from '@copilotkit/react-core';
import { useAppStore } from '@/store';
import type { FilterState, ViewType } from '@/types/email';
import type { SearchEmailsParams } from '@/types/copilot';
import { isWithinRange } from '@/lib/utils';

/**
 * Hook that registers search-related AI actions
 *
 * Provides searchEmails and clearFilters actions for filtering
 * emails by various criteria.
 */
export function useSearchActions() {
  const { setCurrentView, setFilters, clearFilters, emails } = useAppStore();

  // Search emails
  useCopilotAction({
    name: 'searchEmails',
    description: 'Search for emails with various criteria',
    parameters: [
      {
        name: 'query',
        type: 'string',
        description: 'General search query',
        required: false,
      },
      {
        name: 'sender',
        type: 'string',
        description: 'Filter by sender email or name',
        required: false,
      },
      {
        name: 'dateFrom',
        type: 'string',
        description: 'Filter emails from this date (ISO format)',
        required: false,
      },
      {
        name: 'dateTo',
        type: 'string',
        description: 'Filter emails until this date (ISO format)',
        required: false,
      },
      {
        name: 'isUnread',
        type: 'boolean',
        description: 'Filter for unread only',
        required: false,
      },
      {
        name: 'days',
        type: 'number',
        description: 'Filter emails from last N days',
        required: false,
      },
    ],
    handler: async (params: SearchEmailsParams) => {
      // Build filter state
      const newFilters: Partial<FilterState> = {};

      if (params.query) {
        newFilters.query = params.query;
      }
      if (params.sender) {
        newFilters.sender = params.sender;
      }
      if (params.isUnread !== undefined) {
        newFilters.isUnread = params.isUnread;
      }
      if (params.days) {
        newFilters.dateFrom = new Date(Date.now() - params.days * 24 * 60 * 60 * 1000);
      }
      if (params.dateFrom) {
        newFilters.dateFrom = new Date(params.dateFrom);
      }
      if (params.dateTo) {
        newFilters.dateTo = new Date(params.dateTo);
      }

      // Apply filters
      setFilters(newFilters);

      // Navigate to inbox to show results
      setCurrentView('inbox' as ViewType);

      // Count matching emails
      const filtered = emails.inbox.filter((email) => {
        if (newFilters.query && !email.subject.toLowerCase().includes(newFilters.query.toLowerCase()) &&
            !email.body.toLowerCase().includes(newFilters.query.toLowerCase())) {
          return false;
        }
        if (newFilters.sender && !email.from.email.toLowerCase().includes(newFilters.sender.toLowerCase()) &&
            !email.from.name?.toLowerCase().includes(newFilters.sender.toLowerCase())) {
          return false;
        }
        if (newFilters.isUnread && !email.isUnread) {
          return false;
        }
        if (newFilters.dateFrom && !isWithinRange(email.date, newFilters.dateFrom, newFilters.dateTo)) {
          return false;
        }
        return true;
      });

      return `Found ${filtered.length} email${filtered.length !== 1 ? 's' : ''} matching your criteria`;
    },
  });

  // Clear filters
  useCopilotAction({
    name: 'clearFilters',
    description: 'Clear all active email filters',
    parameters: [],
    handler: async () => {
      clearFilters();
      return 'Filters cleared';
    },
  });
}
