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
  const { setCurrentView, setFilters, clearFilters, emails, setSelectedEmailId } = useAppStore();

  // Search emails
  useCopilotAction({
    name: 'searchEmails',
    description: 'Search for emails with various criteria. Updates the main UI to show filtered results.',
    parameters: [
      {
        name: 'query',
        type: 'string',
        description: 'General search query - searches in subject, body, and sender',
        required: false,
      },
      {
        name: 'sender',
        type: 'string',
        description: 'Filter by sender email address or name',
        required: false,
      },
      {
        name: 'dateFrom',
        type: 'string',
        description: 'Filter emails from this date (ISO format like 2024-01-15)',
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
        description: 'Filter for unread only (true) or all emails (false)',
        required: false,
      },
      {
        name: 'days',
        type: 'number',
        description: 'Filter emails from the last N days (e.g., 7 for last week, 30 for last month)',
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
        const fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - params.days);
        fromDate.setHours(0, 0, 0, 0);
        newFilters.dateFrom = fromDate;
      }
      if (params.dateFrom) {
        newFilters.dateFrom = new Date(params.dateFrom);
      }
      if (params.dateTo) {
        const toDate = new Date(params.dateTo);
        toDate.setHours(23, 59, 59, 999);
        newFilters.dateTo = toDate;
      }

      // Clear any selected email to show list view
      setSelectedEmailId(null);

      // Apply filters
      setFilters(newFilters);

      // Navigate to inbox to show results
      setCurrentView('inbox' as ViewType);

      // Count matching emails for feedback
      const filtered = emails.inbox.filter((email) => {
        if (newFilters.query) {
          const query = newFilters.query.toLowerCase();
          const subjectMatch = email.subject.toLowerCase().includes(query);
          const bodyMatch = email.body.toLowerCase().includes(query);
          const fromMatch = email.from.email.toLowerCase().includes(query) ||
                           (email.from.name && email.from.name.toLowerCase().includes(query));
          if (!subjectMatch && !bodyMatch && !fromMatch) {
            return false;
          }
        }
        if (newFilters.sender && !email.from.email.toLowerCase().includes(newFilters.sender.toLowerCase()) &&
            !email.from.name?.toLowerCase().includes(newFilters.sender.toLowerCase())) {
          return false;
        }
        if (newFilters.isUnread && !email.isUnread) {
          return false;
        }
        if (newFilters.dateFrom || newFilters.dateTo) {
          if (!isWithinRange(email.date, newFilters.dateFrom, newFilters.dateTo)) {
            return false;
          }
        }
        return true;
      });

      const count = filtered.length;
      if (count === 0) {
        return `No emails found matching your criteria. Try adjusting your filters.`;
      }

      return `Found ${count} email${count !== 1 ? 's' : ''} matching your criteria. The inbox has been filtered to show these results.`;
    },
  });

  // Clear filters
  useCopilotAction({
    name: 'clearFilters',
    description: 'Clear all active email filters and show all emails',
    parameters: [],
    handler: async () => {
      clearFilters();
      setSelectedEmailId(null);
      return 'All filters cleared. Showing all emails in your inbox.';
    },
  });
}
