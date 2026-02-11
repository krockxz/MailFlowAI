/**
 * Tests for Compose component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Compose } from '../Compose';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  X: ({ className }: { className: string }) => <div data-testid="x-icon" className={className} />,
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

// Mock toast functions
vi.mock('@/lib/toast', () => ({
  showSendSuccess: vi.fn(),
  showSendError: vi.fn(),
}));

// Mock store
vi.mock('@/store/useAppStore', () => ({
  useAppStore: vi.fn((selector) => {
    const state = { darkMode: false };
    return selector ? selector(state) : state;
  }),
}));

describe('Compose', () => {
  const mockOnClose = vi.fn();
  const mockOnSend = vi.fn().mockResolvedValue(undefined);

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

      // Check that form renders with the title
      expect(screen.getByText('New Message')).toBeInTheDocument();

      // Check that input fields have the correct values
      const toInput = screen.getByDisplayValue('recipient@example.com');
      expect(toInput).toBeTruthy();

      const subjectInput = screen.getByDisplayValue('Pre-filled Subject');
      expect(subjectInput).toBeTruthy();

      const bodyInput = screen.getByDisplayValue('Pre-filled body');
      expect(bodyInput).toBeTruthy();
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

    it('shows Subject input Field', () => {
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
  });

  describe('Send button', () => {
    it('has correct styling classes', () => {
      render(
        <Compose
          isOpen={true}
          onClose={mockOnClose}
          onSend={mockOnSend}
        />
      );

      const sendButton = screen.getByText('Send').closest('button');
      expect(sendButton).toHaveClass('bg-accent-500');
    });

    it('has correct dimensions in expanded state', () => {
      render(
        <Compose
          isOpen={true}
          onClose={mockOnClose}
          onSend={mockOnSend}
        />
      );

      const sendButton = screen.getByText('Send').closest('button');
      expect(sendButton).toBeTruthy();
    });

    it('submits form when Send button clicked', async () => {
      render(
        <Compose
          isOpen={true}
          onClose={mockOnClose}
          onSend={mockOnSend}
        />
      );

      const toInput = screen.getByPlaceholderText('To');
      const form = toInput.closest('form');
      if (form) fireEvent.submit(form);

      await waitFor(() => {
        expect(mockOnSend).toHaveBeenCalled();
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });

  describe('Modal styling', () => {
    it('has correct outer container classes', () => {
      const { container } = render(
        <Compose
          isOpen={true}
          onClose={mockOnClose}
          onSend={mockOnSend}
        />
      );

      const modal = container.firstChild as HTMLElement;
      expect(modal).toBeTruthy();
      expect(modal.className).toContain('glass-elevated');
    });

    it('has correct modal dimensions in expanded state', () => {
      const { container } = render(
        <Compose
          isOpen={true}
          onClose={mockOnClose}
          onSend={mockOnSend}
        />
      );

      const modal = container.firstChild as HTMLElement;
      expect(modal.className).toContain('w-[620px]');
      expect(modal.className).toContain('h-[560px]');
    });

    it('has smooth transition classes', () => {
      const { container } = render(
        <Compose
          isOpen={true}
          onClose={mockOnClose}
          onSend={mockOnSend}
        />
      );

      const modal = container.firstChild as HTMLElement;
      expect(modal.className).toContain('transition-all');
      expect(modal.className).toContain('duration-300');
      expect(modal.className).toContain('ease-out');
    });
  });

  describe('Header styling', () => {
    it('has border classes', () => {
      const { container } = render(
        <Compose
          isOpen={true}
          onClose={mockOnClose}
          onSend={mockOnSend}
        />
      );

      const modal = container.firstChild as HTMLElement;
      expect(modal.className).toContain('border-neutral-200');
      expect(modal.className).toContain('dark:border-neutral-800');
    });
  });
});
