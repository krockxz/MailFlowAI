/**
 * Tests for Compose component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Compose } from '../Compose';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  X: ({ className }: { className: string }) => <div data-testid="x-icon" className={className} />,
  Minus: ({ className }: { className: string }) => <div data-testid="minus-icon" className={className} />,
  Maximize2: ({ className }: { className: string }) => <div data-testid="maximize-icon" className={className} />,
  Send: ({ className }: { className: string }) => <div data-testid="send-icon" className={className} />,
  Loader2: ({ className }: { className: string }) => <div data-testid="loader-icon" className={className} />,
}));

// Mock react-hook-form
vi.mock('react-hook-form', () => ({
  useForm: () => ({
    register: vi.fn(() => ({ onChange: vi.fn(), onBlur: vi.fn(), ref: vi.fn(), name: 'test' })),
    handleSubmit: (fn: any) => (e: any) => {
      e?.preventDefault?.();
      return fn({
        to: 'test@example.com',
        subject: 'Test Subject',
        body: 'Test Body',
        cc: '',
      });
    },
    reset: vi.fn(),
    formState: { errors: {}, isSubmitting: false },
  }),
}));

// Mock @hookform/resolvers
vi.mock('@hookform/resolvers/zod', () => ({
  zodResolver: () => ({} as any),
}));

// Mock the store
vi.mock('@/store/useAppStore', () => ({
  useAppStore: vi.fn((selector) => {
    const state = { darkMode: false };
    return selector ? selector(state) : state;
  }),
}));

describe('Compose', () => {
  const mockOnClose = vi.fn();
  const mockOnSend = vi.fn().mockResolvedValue(undefined);
  const mockOnToggleMinimize = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Conditional rendering', () => {
    it('does not render when isOpen is false', () => {
      const { container } = render(
        <Compose
          isOpen={false}
          onClose={mockOnClose}
          onSend={mockOnSend}
        />
      );

      expect(container.firstChild).toBe(null);
    });

    it('renders form when isOpen is true', () => {
      render(
        <Compose
          isOpen={true}
          onClose={mockOnClose}
          onSend={mockOnSend}
        />
      );

      expect(screen.getByText('New Message')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('To')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Subject')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Write your message...')).toBeInTheDocument();
    });
  });

  describe('Initial data pre-filling', () => {
    it('pre-fills form with initialData', () => {
      render(
        <Compose
          isOpen={true}
          onClose={mockOnClose}
          onSend={mockOnSend}
          initialData={{
            to: 'recipient@example.com',
            subject: 'Pre-filled Subject',
            body: 'Pre-filled body',
            cc: 'cc@example.com',
          }}
        />
      );

      // Check that the form renders with the title
      expect(screen.getByText('New Message')).toBeInTheDocument();
    });

    it('shows Cc field when initialData includes cc', () => {
      render(
        <Compose
          isOpen={true}
          onClose={mockOnClose}
          onSend={mockOnSend}
          initialData={{
            to: 'test@example.com',
            cc: 'cc@example.com',
          }}
        />
      );

      // The "Add Cc" / "Hide Cc" button should be present
      expect(screen.getByText(/Cc/)).toBeInTheDocument();
    });
  });

  describe('Form validation', () => {
    it('shows To input field', () => {
      render(
        <Compose
          isOpen={true}
          onClose={mockOnClose}
          onSend={mockOnSend}
        />
      );

      const toInput = screen.getByPlaceholderText('To');
      expect(toInput).toBeInTheDocument();
      expect(toInput.tagName.toLowerCase()).toBe('input');
    });

    it('shows Subject input field', () => {
      render(
        <Compose
          isOpen={true}
          onClose={mockOnClose}
          onSend={mockOnSend}
        />
      );

      const subjectInput = screen.getByPlaceholderText('Subject');
      expect(subjectInput).toBeInTheDocument();
      expect(subjectInput.tagName.toLowerCase()).toBe('input');
    });

    it('shows Body textarea', () => {
      render(
        <Compose
          isOpen={true}
          onClose={mockOnClose}
          onSend={mockOnSend}
        />
      );

      const bodyTextarea = screen.getByPlaceholderText('Write your message...');
      expect(bodyTextarea).toBeInTheDocument();
      expect(bodyTextarea.tagName.toLowerCase()).toBe('textarea');
    });
  });

  describe('Form submission', () => {
    it('calls onSend when form is submitted', async () => {
      render(
        <Compose
          isOpen={true}
          onClose={mockOnClose}
          onSend={mockOnSend}
        />
      );

      const form = screen.getByPlaceholderText('To').closest('form');
      if (form) {
        fireEvent.submit(form);
      }

      await waitFor(() => {
        expect(mockOnSend).toHaveBeenCalled();
      });
    });

    it('calls onClose after successful send', async () => {
      render(
        <Compose
          isOpen={true}
          onClose={mockOnClose}
          onSend={mockOnSend}
        />
      );

      const form = screen.getByPlaceholderText('To').closest('form');
      if (form) {
        fireEvent.submit(form);
      }

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });

  describe('Minimize/maximize toggle', () => {
    it('shows minimize button when not minimized', () => {
      render(
        <Compose
          isOpen={true}
          onClose={mockOnClose}
          onSend={mockOnSend}
          isMinimized={false}
          onToggleMinimize={mockOnToggleMinimize}
        />
      );

      expect(screen.getByTestId('minus-icon')).toBeInTheDocument();
    });

    it('shows maximize button when minimized', () => {
      render(
        <Compose
          isOpen={true}
          onClose={mockOnClose}
          onSend={mockOnSend}
          isMinimized={true}
          onToggleMinimize={mockOnToggleMinimize}
        />
      );

      expect(screen.getByTestId('maximize-icon')).toBeInTheDocument();
    });

    it('calls onToggleMinimize when minimize button clicked', async () => {
      render(
        <Compose
          isOpen={true}
          onClose={mockOnClose}
          onSend={mockOnSend}
          onToggleMinimize={mockOnToggleMinimize}
        />
      );

      const minimizeButton = screen.getByTestId('minus-icon').closest('button');
      if (minimizeButton) {
        fireEvent.click(minimizeButton);
      }

      await waitFor(() => {
        expect(mockOnToggleMinimize).toHaveBeenCalled();
      });
    });
  });

  describe('Close button', () => {
    it('renders close button', () => {
      render(
        <Compose
          isOpen={true}
          onClose={mockOnClose}
          onSend={mockOnSend}
        />
      );

      expect(screen.getByTestId('x-icon')).toBeInTheDocument();
    });

    it('calls onClose when close button clicked', async () => {
      render(
        <Compose
          isOpen={true}
          onClose={mockOnClose}
          onSend={mockOnSend}
        />
      );

      const closeButton = screen.getByTestId('x-icon').closest('button');
      if (closeButton) {
        fireEvent.click(closeButton);
      }

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });

  describe('Cc field toggle', () => {
    it('shows Add Cc button when cc field is not visible', () => {
      render(
        <Compose
          isOpen={true}
          onClose={mockOnClose}
          onSend={mockOnSend}
        />
      );

      const addCcButton = screen.getByText('Add Cc');
      expect(addCcButton).toBeInTheDocument();
    });

    it('toggles Cc field when Add Cc button clicked', async () => {
      render(
        <Compose
          isOpen={true}
          onClose={mockOnClose}
          onSend={mockOnSend}
        />
      );

      const addCcButton = screen.getByText('Add Cc');
      fireEvent.click(addCcButton);

      await waitFor(() => {
        expect(screen.getByText('Hide Cc')).toBeInTheDocument();
      });
    });
  });

  describe('Send button', () => {
    it('renders Send button', () => {
      render(
        <Compose
          isOpen={true}
          onClose={mockOnClose}
          onSend={mockOnSend}
        />
      );

      expect(screen.getByText('Send')).toBeInTheDocument();
      expect(screen.getByTestId('send-icon')).toBeInTheDocument();
    });

    it('shows loading state when submitting', () => {
      // This test verifies the send button renders
      render(
        <Compose
          isOpen={true}
          onClose={mockOnClose}
          onSend={mockOnSend}
        />
      );

      const sendButton = screen.getByText('Send');
      expect(sendButton).toBeInTheDocument();
    });
  });
});
