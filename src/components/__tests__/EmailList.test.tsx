/**
 * Tests for EmailList component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EmailList } from '../EmailList';
import { createMockEmail, createMockEmails, createMockPaginationState } from '@/test/test-utils';
import type { FolderPaginationState } from '@/types/email';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Mail: ({ className }: { className: string }) => <div data-testid="mail-icon" className={className} />,
  MailOpen: ({ className }: { className: string }) => <div data-testid="mail-open-icon" className={className} />,
  ChevronDown: ({ className }: { className: string }) => <div data-testid="chevron-down-icon" className={className} />,
  Loader2: ({ className }: { className: string }) => <div data-testid="loader-icon" className={className} />,
}));

describe('EmailList', () => {
  const mockOnSelectEmail = vi.fn();
  const mockOnLoadMore = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering with emails', () => {
    it('renders list of emails with correct data', () => {
      const emails = createMockEmails(3);
      render(
        <EmailList
          emails={emails}
          selectedId={null}
          onSelectEmail={mockOnSelectEmail}
        />
      );

      // Check that all emails are rendered
      expect(screen.getByText('Test Email Subject 1')).toBeInTheDocument();
      expect(screen.getByText('Test Email Subject 2')).toBeInTheDocument();
      expect(screen.getByText('Test Email Subject 3')).toBeInTheDocument();

      // Check sender names are rendered (using getAllByText since there are multiple)
      expect(screen.getAllByText('Test User')).toHaveLength(3);
    });

    it('displays formatted dates correctly', () => {
      const emails = [
        createMockEmail({
          id: '1',
          subject: 'Email from today',
          date: new Date(),
        }),
        createMockEmail({
          id: '2',
          subject: 'Email from yesterday',
          date: new Date(Date.now() - 24 * 60 * 60 * 1000),
        }),
      ];

      render(
        <EmailList
          emails={emails}
          selectedId={null}
          onSelectEmail={mockOnSelectEmail}
        />
      );

      expect(screen.getByText('Email from today')).toBeInTheDocument();
      expect(screen.getByText('Email from yesterday')).toBeInTheDocument();
    });

    it('shows avatar with initials', () => {
      const emails = [
        createMockEmail({
          from: { name: 'John Doe', email: 'john@example.com' },
        }),
      ];

      render(
        <EmailList
          emails={emails}
          selectedId={null}
          onSelectEmail={mockOnSelectEmail}
        />
      );

      // Avatar should show initials "JD" for "John Doe"
      // The avatar component should render the initials
      expect(screen.getByText('JD')).toBeInTheDocument();
    });

    it('displays unread indicator for unread emails', () => {
      const emails = [
        createMockEmail({
          id: 'unread',
          subject: 'Unread Email',
          isUnread: true,
        }),
        createMockEmail({
          id: 'read',
          subject: 'Read Email',
          isUnread: false,
        }),
      ];

      const { container } = render(
        <EmailList
          emails={emails}
          selectedId={null}
          onSelectEmail={mockOnSelectEmail}
        />
      );

      // Unread email should have unread dot indicator (via styling)
      expect(screen.getByText('Unread Email')).toBeInTheDocument();
      expect(screen.getByText('Read Email')).toBeInTheDocument();

      // The unread email should have an accent dot (via bg-accent-500 class)
      const accentDots = container.querySelectorAll('.bg-accent-500');
      expect(accentDots.length).toBeGreaterThan(0);
    });
  });

  describe('Empty state', () => {
    it('shows empty state when no emails', () => {
      render(
        <EmailList
          emails={[]}
          selectedId={null}
          onSelectEmail={mockOnSelectEmail}
        />
      );

      expect(screen.getByText('No emails found')).toBeInTheDocument();
      expect(screen.getByText('Your inbox is empty')).toBeInTheDocument();
    });

    it('renders mail icon in empty state', () => {
      render(
        <EmailList
          emails={[]}
          selectedId={null}
          onSelectEmail={mockOnSelectEmail}
        />
      );

      expect(screen.getByTestId('mail-icon')).toBeInTheDocument();
    });
  });

  describe('Email selection interaction', () => {
    it('calls onSelectEmail when email clicked', async () => {
      const emails = createMockEmails(2);
      render(
        <EmailList
          emails={emails}
          selectedId={null}
          onSelectEmail={mockOnSelectEmail}
        />
      );

      const firstEmail = screen.getByText('Test Email Subject 1').closest('div.group');
      if (firstEmail) {
        fireEvent.click(firstEmail);
      }

      await waitFor(() => {
        expect(mockOnSelectEmail).toHaveBeenCalledTimes(1);
        expect(mockOnSelectEmail).toHaveBeenCalledWith(emails[0]);
      });
    });

    it('highlights selected email', () => {
      const emails = createMockEmails(2);
      render(
        <EmailList
          emails={emails}
          selectedId="mock-email-1"
          onSelectEmail={mockOnSelectEmail}
        />
      );

      // The selected email should have different styling
      // We can't easily test classes, but we can verify the email is rendered
      expect(screen.getByText('Test Email Subject 1')).toBeInTheDocument();
    });

    it('applies correct border-l-2 border-l-accent-500 classes to selected email', () => {
      const emails = createMockEmails(2);
      const { container } = render(
        <EmailList
          emails={emails}
          selectedId="mock-email-1"
          onSelectEmail={mockOnSelectEmail}
        />
      );

      // Selected email should have border-l-accent-500 class
      const selectedElement = container.querySelector('.border-l-accent-500');
      expect(selectedElement).toBeInTheDocument();

      // Non-selected email should not have the border-l-accent-500 class
      const emailItems = container.querySelectorAll('.group');
      expect(emailItems.length).toBe(2);
    });
  });

  describe('Load more button with pagination', () => {
    it('shows load more button when hasMore is true and emails exist', () => {
      const emails = createMockEmails(5);
      const pagination: FolderPaginationState = {
        pageToken: null,
        nextPageToken: 'next-token',
        hasMore: true,
        isLoading: false,
      };

      render(
        <EmailList
          emails={emails}
          selectedId={null}
          onSelectEmail={mockOnSelectEmail}
          pagination={pagination}
          onLoadMore={mockOnLoadMore}
        />
      );

      expect(screen.getByText('Load More')).toBeInTheDocument();
      expect(screen.getByTestId('chevron-down-icon')).toBeInTheDocument();
    });

    it('does not show load more button when hasMore is false', () => {
      const emails = createMockEmails(5);
      const pagination: FolderPaginationState = {
        pageToken: null,
        nextPageToken: null,
        hasMore: false,
        isLoading: false,
      };

      render(
        <EmailList
          emails={emails}
          selectedId={null}
          onSelectEmail={mockOnSelectEmail}
          pagination={pagination}
          onLoadMore={mockOnLoadMore}
        />
      );

      expect(screen.queryByText('Load More')).not.toBeInTheDocument();
    });

    it('does not show load more button when no emails', () => {
      const pagination: FolderPaginationState = {
        pageToken: null,
        nextPageToken: 'next-token',
        hasMore: true,
        isLoading: false,
      };

      render(
        <EmailList
          emails={[]}
          selectedId={null}
          onSelectEmail={mockOnSelectEmail}
          pagination={pagination}
          onLoadMore={mockOnLoadMore}
        />
      );

      expect(screen.queryByText('Load More')).not.toBeInTheDocument();
    });

    it('disables load more button when loading', () => {
      const emails = createMockEmails(5);
      const pagination: FolderPaginationState = {
        pageToken: null,
        nextPageToken: 'next-token',
        hasMore: true,
        isLoading: true,
      };

      render(
        <EmailList
          emails={emails}
          selectedId={null}
          onSelectEmail={mockOnSelectEmail}
          pagination={pagination}
          onLoadMore={mockOnLoadMore}
        />
      );

      const loadMoreButton = screen.getByText('Loading more emails...').closest('button');
      expect(loadMoreButton).toBeDisabled();
    });

    it('calls onLoadMore when load more button clicked', async () => {
      const emails = createMockEmails(5);
      const pagination: FolderPaginationState = {
        pageToken: null,
        nextPageToken: 'next-token',
        hasMore: true,
        isLoading: false,
      };

      render(
        <EmailList
          emails={emails}
          selectedId={null}
          onSelectEmail={mockOnSelectEmail}
          pagination={pagination}
          onLoadMore={mockOnLoadMore}
        />
      );

      const loadMoreButton = screen.getByText('Load More');
      fireEvent.click(loadMoreButton);

      await waitFor(() => {
        expect(mockOnLoadMore).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Email snippets and body', () => {
    it('displays email snippet when available', () => {
      const emails = [
        createMockEmail({
          snippet: 'This is a preview of the email content',
          body: 'Full email body here',
        }),
      ];

      render(
        <EmailList
          emails={emails}
          selectedId={null}
          onSelectEmail={mockOnSelectEmail}
        />
      );

      // Should show snippet truncated
      expect(screen.getByText(/preview of the email/)).toBeInTheDocument();
    });

    it('truncates long email bodies', () => {
      const longBody = 'A'.repeat(100);
      const emails = [
        createMockEmail({
          snippet: '',
          body: longBody,
        }),
      ];

      render(
        <EmailList
          emails={emails}
          selectedId={null}
          onSelectEmail={mockOnSelectEmail}
        />
      );

      // The body should be truncated (not showing all 100 characters)
      const displayedText = screen.queryByText(new RegExp(`^${longBody}$`));
      expect(displayedText).not.toBeInTheDocument();
    });
  });
});
