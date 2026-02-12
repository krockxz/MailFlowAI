import { useCopilotAction } from '@copilotkit/react-core';
import { useAppStore } from '@/store';
import type { FilterState, ViewType } from '@/types/email';
import type { SearchEmailsParams } from '@/types/copilot';
import { isWithinRange } from '@/lib/utils';
import { logger, createActionError, ActionErrorType, safeParseDate } from './errorHandler';

/**
 * Hook that registers search-related AI actions
 *
 * Provides searchEmails and clearFilters actions for filtering
 * emails by various criteria.
 *
 * Error handling:
 * - Validates date formats
 * - Validates numeric parameters (days)
 * - Handles edge cases (no emails found, empty criteria)
 * - Logs search attempts and results
 * - Returns meaningful feedback on search results
 */
export function useSearchActions() {
  const { setCurrentView, setFilters, clearFilters, emails, setSelectedEmailId } = useAppStore();

  // Validate search parameters
  function validateSearchParams(params: SearchEmailsParams): { valid: boolean; error?: string } {
    // Validate dateFrom format if provided
    if (params.dateFrom) {
      const parsedDate = safeParseDate(params.dateFrom);
      if (!parsedDate) {
        return {
          valid: false,
          error: `Invalid dateFrom format: "${params.dateFrom}". Please use ISO format like "2024-01-15".`
        };
      }
    }

    // Validate dateTo format if provided
    if (params.dateTo) {
      const parsedDate = safeParseDate(params.dateTo);
      if (!parsedDate) {
        return {
          valid: false,
          error: `Invalid dateTo format: "${params.dateTo}". Please use ISO format like "2024-01-15".`
        };
      }
    }

    // Validate date range is logical (dateFrom before dateTo)
    if (params.dateFrom && params.dateTo) {
      const fromDate = safeParseDate(params.dateFrom);
      const toDate = safeParseDate(params.dateTo);
      if (fromDate && toDate && fromDate > toDate) {
        return {
          valid: false,
          error: 'dateFrom must be before or equal to dateTo'
        };
      }
    }

    // Validate days parameter
    if (params.days !== undefined) {
      if (typeof params.days !== 'number' || params.days < 0 || !Number.isFinite(params.days)) {
        return {
          valid: false,
          error: 'days must be a positive number (e.g., 7 for last 7 days)'
        };
      }
      if (params.days > 3650) { // 10 years max
        return {
          valid: false,
          error: 'days parameter is too large. Maximum is 3650 (10 years).'
        };
      }
    }

    return { valid: true };
  }

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
      try {
        logger.info('searchEmails', 'Searching emails', params);

        // Validate parameters
        const validation = validateSearchParams(params);
        if (!validation.valid) {
          const error = createActionError(
            ActionErrorType.VALIDATION,
            validation.error || 'Invalid search parameters',
            { params }
          );
          logger.log('searchEmails', error);
          return error.userMessage;
        }

        // Check if there are emails to search
        const allEmails = [...emails.inbox, ...emails.sent];
        if (allEmails.length === 0) {
          logger.warn('searchEmails', 'No emails available to search');
          return 'No emails are currently loaded. Please wait for emails to sync or refresh the page.';
        }

        // Build filter state
        const newFilters: Partial<FilterState> = {};

        if (params.query) {
          newFilters.query = params.query.trim();
        }
        if (params.sender) {
          newFilters.sender = params.sender.trim();
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
          const parsedDate = safeParseDate(params.dateFrom);
          if (parsedDate) {
            newFilters.dateFrom = parsedDate;
          }
        }
        if (params.dateTo) {
          const toDate = safeParseDate(params.dateTo);
          if (toDate) {
            toDate.setHours(23, 59, 59, 999);
            newFilters.dateTo = toDate;
          }
        }

        // Clear any selected email to show list view
        setSelectedEmailId(null);

        // Apply filters
        setFilters(newFilters);

        // Navigate to inbox to show results
        setCurrentView('inbox' as ViewType);

        // Count matching emails for feedback
        let filtered: typeof emails.inbox;
        try {
          filtered = emails.inbox.filter((email) => {
            try {
              if (newFilters.query) {
                const query = newFilters.query.toLowerCase();
                const subjectMatch = email.subject?.toLowerCase().includes(query) ?? false;
                const bodyMatch = email.body?.toLowerCase().includes(query) ?? false;
                const fromEmailMatch = email.from?.email?.toLowerCase().includes(query) ?? false;
                const fromNameMatch = email.from?.name?.toLowerCase().includes(query) ?? false;
                if (!subjectMatch && !bodyMatch && !fromEmailMatch && !fromNameMatch) {
                  return false;
                }
              }
              if (newFilters.sender && email.from) {
                const senderLower = newFilters.sender.toLowerCase();
                const emailMatch = email.from.email?.toLowerCase().includes(senderLower) ?? false;
                const nameMatch = email.from.name?.toLowerCase().includes(senderLower) ?? false;
                if (!emailMatch && !nameMatch) {
                  return false;
                }
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
            } catch (filterError) {
              logger.warn('searchEmails', `Error filtering email ${email.id}`, { filterError });
              return false;
            }
          });
        } catch (filterError) {
          const error = createActionError(
            ActionErrorType.STATE,
            'Failed to filter emails. Please try clearing filters and searching again.',
            filterError,
            { newFilters }
          );
          logger.log('searchEmails', error);

          // Reset to safe state
          clearFilters();
          setSelectedEmailId(null);

          return error.userMessage;
        }

        const count = filtered.length;

        // Log search result
        logger.info('searchEmails', `Found ${count} matching emails`, {
          totalInbox: emails.inbox.length,
          filteredCount: count
        });

        if (count === 0) {
          // Provide helpful suggestion based on what was searched
          const suggestions: string[] = [];
          if (newFilters.query) suggestions.push('try different keywords');
          if (newFilters.sender) suggestions.push('check the sender name spelling');
          if (newFilters.dateFrom || newFilters.dateTo || params.days) suggestions.push('adjust the date range');
          if (newFilters.isUnread) suggestions.push('include read emails');

          const suggestionText = suggestions.length > 0
            ? ` Suggestions: ${suggestions.join(', ')}.`
            : '';

          return `No emails found matching your criteria.${suggestionText}`;
        }

        return `Found ${count} email${count !== 1 ? 's' : ''} matching your criteria. The inbox has been filtered to show these results.`;
      } catch (error) {
        const actionError = createActionError(
          ActionErrorType.UNKNOWN,
          'An error occurred while searching. Please try again.',
          error,
          { params }
        );
        logger.log('searchEmails', actionError);

        // Reset to safe state
        try {
          clearFilters();
          setSelectedEmailId(null);
        } catch (resetError) {
          logger.warn('searchEmails', 'Failed to reset filters after error', { resetError });
        }

        return actionError.userMessage;
      }
    },
  });

  // Clear filters
  useCopilotAction({
    name: 'clearFilters',
    description: 'Clear all active email filters and show all emails',
    parameters: [],
    handler: async () => {
      try {
        logger.info('clearFilters', 'Clearing all filters');

        clearFilters();
        setSelectedEmailId(null);

        logger.info('clearFilters', 'Filters cleared successfully');
        return 'All filters cleared. Showing all emails in your inbox.';
      } catch (error) {
        const actionError = createActionError(
          ActionErrorType.STATE,
          'Failed to clear filters. Please refresh the page.',
          error
        );
        logger.log('clearFilters', actionError);
        return actionError.userMessage;
      }
    },
  });
}
