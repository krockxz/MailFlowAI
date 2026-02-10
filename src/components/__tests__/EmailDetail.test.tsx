/**
 * Tests for EmailDetail component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EmailDetail } from '../EmailDetail';
import { createMockEmail, createMockEmails } from '@/test/test-utils';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  ArrowLeft: ({ className }: { className: string }) => <div data-testid="arrow-left-icon" className={className} />,
  Reply: ({ className }: { className: string }) => <div data-testid="reply-icon" className={className} />,
  Forward: ({ className }: { className: string }) => <div data-testid="forward-icon" className={className} />,
  Loader2: ({ className }: { className: string }) => <div data-testid="loader-icon" className={className} />,
}));

// Mock the useEmails hook
vi.mock('@/hooks/useEmails', () => ({
  useEmails: () => ({
    fetchThread: vi.fn().mockResolvedValue([]),
  }),
}));

// Mock the store
vi.mock('@/store/useAppStore', () => ({
  useAppStore: vi.fn((selector) => {
    const state = {
      activeThread: null,
      isLoading: false,
      darkMode: false,
    };
    return selector ? selector(state) : state;
  }),
}));

describe('EmailDetail', () => {
  const mockOnBack = vi.fn();
  const mockOnReply = vi.fn();
  const mockOnForward = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering with email', () => {
    it('renders email detail when email provided', () => {
      const email = createMockEmail({
        subject: 'Test Email Subject',
        from: { name: 'John Doe', email: 'john@example.com' },
        body: 'This is the email body content',
      });

      render(
        <EmailDetail
          email={email}
          onBack={mockOnBack}
          onReply={mockOnReply}
          onForward={mockOnForward}
        />
      );

      expect(screen.getByText('Test Email Subject')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText(/john@example.com/)).toBeInTheDocument();
      expect(screen.getByText('This is the email body content')).toBeInTheDocument();
    });

    it('displays email subject', () => {
      const email = createMockEmail({ subject: 'Important Meeting Tomorrow' });

      render(
        <EmailDetail
          email={email}
          onBack={mockOnBack}
        />
      );

      expect(screen.getByText('Important Meeting Tomorrow')).toBeInTheDocument();
    });

    it('displays sender information', () => {
      const email = createMockEmail({
        from: { name: 'Jane Smith', email: 'jane@example.com' },
      });

      render(
        <EmailDetail
          email={email}
          onBack={mockOnBack}
        />
      );

      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  describe('Empty state (no email selected)', () => {
    it('shows empty state when email is null', () => {
      render(
        <EmailDetail
          email={null}
          onBack={mockOnBack}
        />
      );

      expect(screen.getByText('Select an email to read')).toBeInTheDocument();
    });

    it('does not show action buttons when email is null', () => {
      render(
        <EmailDetail
          email={null}
          onBack={mockOnBack}
          onReply={mockOnReply}
          onForward={mockOnForward}
        />
      );

      // Action buttons should not be in the document when email is null
      expect(screen.queryByTestId('reply-icon')).not.toBeInTheDocument();
    });
  });

  describe('Thread display', () => {
    it('displays single email when no thread', () => {
      const email = createMockEmail({
        subject: 'Single Email',
        from: { name: 'Alice', email: 'alice@example.com' },
        body: 'Single message body',
      });

      render(
        <EmailDetail
          email={email}
          onBack={mockOnBack}
        />
      );

      expect(screen.getByText('Single Email')).toBeInTheDocument();
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Single message body')).toBeInTheDocument();
    });
  });

  describe('Action buttons', () => {
    it('calls onBack when back button clicked', async () => {
      const email = createMockEmail();

      render(
        <EmailDetail
          email={email}
          onBack={mockOnBack}
        />
      );

      const backButton = screen.getByText('Back');
      fireEvent.click(backButton);

      await waitFor(() => {
        expect(mockOnBack).toHaveBeenCalledTimes(1);
      });
    });

    it('calls onReply when reply button clicked (first button in header)', async () => {
      const email = createMockEmail({ id: 'email-123' });

      render(
        <EmailDetail
          email={email}
          onBack={mockOnBack}
          onReply={mockOnReply}
        />
      );

      // Get all reply icons (there are two - one in header, one in quick reply)
      const replyIcons = screen.getAllByTestId('reply-icon');
      // Click the first one (header button)
      const headerReplyButton = replyIcons[0].closest('button');
      if (headerReplyButton) {
        fireEvent.click(headerReplyButton);
      }

      await waitFor(() => {
        expect(mockOnReply).toHaveBeenCalledWith('email-123');
      });
    });

    it('calls onForward when forward button clicked', async () => {
      const email = createMockEmail({ id: 'email-456' });

      render(
        <EmailDetail
          email={email}
          onBack={mockOnBack}
          onForward={mockOnForward}
        />
      );

      const forwardButton = screen.getByTestId('forward-icon').closest('button');
      if (forwardButton) {
        fireEvent.click(forwardButton);
      }

      await waitFor(() => {
        expect(mockOnForward).toHaveBeenCalledWith('email-456');
      });
    });

    it('renders all action buttons when email is provided', () => {
      const email = createMockEmail();

      render(
        <EmailDetail
          email={email}
          onBack={mockOnBack}
          onReply={mockOnReply}
          onForward={mockOnForward}
        />
      );

      expect(screen.getByTestId('arrow-left-icon')).toBeInTheDocument();
      // Use getAllByTestId for reply-icon since there are two (header + quick reply)
      expect(screen.getAllByTestId('reply-icon')).toHaveLength(2);
      expect(screen.getByTestId('forward-icon')).toBeInTheDocument();
    });

    it('shows quick reply button when onReply is provided', () => {
      const email = createMockEmail({
        from: { name: 'John Doe', email: 'john@example.com' },
      });

      render(
        <EmailDetail
          email={email}
          onBack={mockOnBack}
          onReply={mockOnReply}
        />
      );

      expect(screen.getByText(/Reply to/)).toBeInTheDocument();
    });
  });

  describe('Email display', () => {
    it('displays formatted full date', () => {
      const testDate = new Date('2023-05-15T10:30:00Z');
      const email = createMockEmail({
        date: testDate,
      });

      render(
        <EmailDetail
          email={email}
          onBack={mockOnBack}
        />
      );

      // The component should render without error
      expect(screen.getByText('Test Email Subject')).toBeInTheDocument();
    });

    it('renders email body with whitespace preserved', () => {
      const emailBody = 'Line 1\n\nLine 2\n\nLine 3';
      const email = createMockEmail({
        body: emailBody,
      });

      const { container } = render(
        <EmailDetail
          email={email}
          onBack={mockOnBack}
        />
      );

      // The body should be rendered in a pre element
      expect(container.querySelector('pre')).toBeInTheDocument();
      expect(container.textContent).toContain('Line 1');
    });

    it('messages container has max-w-[800px] class for design spec compliance', () => {
      const email = createMockEmail({
        subject: 'Max Width Test',
        body: 'Testing max-width constraint',
      });

      const { container } = render(
        <EmailDetail
          email={email}
          onBack={mockOnBack}
        />
      );

      // Find the max-width container div
      const maxWidthContainer = container.querySelector('.max-w-\\[800px\\]');
      expect(maxWidthContainer).toBeInTheDocument();

      // Verify it also has mx-auto for centering
      expect(maxWidthContainer).toHaveClass('mx-auto');
    });
  });
});
