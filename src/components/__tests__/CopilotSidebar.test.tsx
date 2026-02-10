/**
 * Tests for CopilotSidebar component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CopilotSidebar } from '../CopilotSidebar';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  X: ({ className }: { className: string }) => <div data-testid="x-icon" className={className} />,
  Sparkles: ({ className }: { className: string }) => <div data-testid="sparkles-icon" className={className} />,
}));

// Mock @copilotkit/react-ui CopilotChat
vi.mock('@copilotkit/react-ui', () => ({
  CopilotChat: ({ instructions, labels, className }: any) => (
    <div data-testid="copilot-chat" className={className}>
      <div data-testid="instructions">{instructions}</div>
      <div data-testid="labels">{JSON.stringify(labels)}</div>
    </div>
  ),
}));

// Mock the store
vi.mock('@/store/useAppStore', () => ({
  useAppStore: vi.fn((selector) => {
    const state = { darkMode: false };
    return selector ? selector(state) : state;
  }),
}));

describe('CopilotSidebar', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Conditional rendering', () => {
    it('does not render when isOpen is false', () => {
      const { container } = render(
        <CopilotSidebar
          isOpen={false}
          onClose={mockOnClose}
        />
      );

      expect(container.firstChild).toBe(null);
    });

    it('renders when isOpen is true', () => {
      render(
        <CopilotSidebar
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByTestId('copilot-chat')).toBeInTheDocument();
    });
  });

  describe('Header', () => {
    it('displays header with title', () => {
      render(
        <CopilotSidebar
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('AI Assistant')).toBeInTheDocument();
    });

    it('displays header subtitle', () => {
      render(
        <CopilotSidebar
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Ask me to manage your email')).toBeInTheDocument();
    });

    it('displays sparkles icon in avatar', () => {
      render(
        <CopilotSidebar
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByTestId('sparkles-icon')).toBeInTheDocument();
    });
  });

  describe('Close interaction', () => {
    it('renders close button', () => {
      render(
        <CopilotSidebar
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByTestId('x-icon')).toBeInTheDocument();
    });

    it('calls onClose when close button clicked', () => {
      render(
        <CopilotSidebar
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      const closeButton = screen.getByTestId('x-icon').closest('button');
      if (closeButton) {
        fireEvent.click(closeButton);
      }

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('close button has correct aria-label', () => {
      render(
        <CopilotSidebar
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      const closeButton = screen.getByLabelText('Close');
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe('Example prompts', () => {
    it('renders example prompt buttons', () => {
      render(
        <CopilotSidebar
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      // Check for the "Try saying:" label
      expect(screen.getByText('Try saying:')).toBeInTheDocument();

      // Check for example prompts
      expect(screen.getByText(/Send an email to/)).toBeInTheDocument();
      expect(screen.getByText(/Show emails from last week/)).toBeInTheDocument();
      expect(screen.getByText(/Open the latest unread email/)).toBeInTheDocument();
    });

    it('displays example prompt text with quotes', () => {
      render(
        <CopilotSidebar
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      // Example prompts should be displayed with quotes
      expect(screen.getByText(/"Send an email to john@example.com"/)).toBeInTheDocument();
    });

    it('displays prompt icons/emojis', () => {
      render(
        <CopilotSidebar
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      // The component renders emoji icons with prompts
      const { container } = render(
        <CopilotSidebar
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      expect(container.textContent).toContain('✉️');
      expect(container.textContent).toContain('📅');
      expect(container.textContent).toContain('📬');
    });
  });

  describe('CopilotChat integration', () => {
    it('renders CopilotChat component', () => {
      render(
        <CopilotSidebar
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByTestId('copilot-chat')).toBeInTheDocument();
    });

    it('passes instructions to CopilotChat', () => {
      render(
        <CopilotSidebar
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      const instructions = screen.getByTestId('instructions');
      expect(instructions.textContent).toContain('AI email assistant');
    });
  });

  describe('Dark mode styling', () => {
    it('applies styles based on darkMode prop from store', () => {
      render(
        <CopilotSidebar
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      // The sidebar should render with dark mode aware classes
      const sidebar = screen.getByTestId('copilot-chat').closest('.fixed');
      expect(sidebar).toBeInTheDocument();
    });
  });

  describe('Layout and positioning', () => {
    it('renders as fixed positioned element', () => {
      const { container } = render(
        <CopilotSidebar
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      const sidebar = container.querySelector('.fixed');
      expect(sidebar).toBeInTheDocument();
    });

    it('has correct width class (320px per design spec)', () => {
      const { container } = render(
        <CopilotSidebar
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      const sidebar = container.querySelector('.w-\\[320px\\]');
      expect(sidebar).toBeInTheDocument();
    });

    it('has full height', () => {
      const { container } = render(
        <CopilotSidebar
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      const sidebar = container.querySelector('.h-full');
      expect(sidebar).toBeInTheDocument();
    });
  });

  describe('Visual regression tests', () => {
    it('has neutral background classes for light and dark mode', () => {
      const { container } = render(
        <CopilotSidebar
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      const sidebar = container.querySelector('.fixed');
      expect(sidebar).toHaveClass('bg-white');
      expect(sidebar).toHaveClass('dark:bg-neutral-900');
    });

    it('has neutral border classes for light and dark mode', () => {
      const { container } = render(
        <CopilotSidebar
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      const sidebar = container.querySelector('.fixed');
      expect(sidebar).toHaveClass('border-neutral-200');
      expect(sidebar).toHaveClass('dark:border-neutral-800');
    });

    it('header has neutral background and border classes', () => {
      const { container } = render(
        <CopilotSidebar
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      const header = container.querySelector('.border-b');
      expect(header).toHaveClass('bg-neutral-50');
      expect(header).toHaveClass('border-neutral-200');
      expect(header).toHaveClass('dark:border-neutral-800');
      // Check that dark mode bg class is present (with opacity)
      expect(header?.className).toContain('dark:bg-neutral-900');
    });

    it('avatar uses accent-500 to accent-600 gradient', () => {
      const { container } = render(
        <CopilotSidebar
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      const avatar = container.querySelector('.shadow-accent-500\\/25');
      expect(avatar).toBeInTheDocument();
      expect(avatar).toHaveClass('from-accent-500');
      expect(avatar).toHaveClass('to-accent-600');
    });

    it('header text uses neutral colors', () => {
      const { container } = render(
        <CopilotSidebar
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      const title = container.querySelector('.font-semibold');
      expect(title).toHaveClass('text-neutral-900');
      expect(title).toHaveClass('dark:text-white');

      const subtitle = container.querySelector('.text-xs');
      expect(subtitle).toHaveClass('text-neutral-500');
      expect(subtitle).toHaveClass('dark:text-neutral-400');
    });

    it('footer has neutral background and border classes', () => {
      const { container } = render(
        <CopilotSidebar
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      const footer = container.querySelector('.border-t');
      expect(footer).toHaveClass('bg-neutral-50');
      expect(footer).toHaveClass('border-neutral-200');
      expect(footer).toHaveClass('dark:border-neutral-800');
      // Check that dark mode bg class is present (with opacity)
      expect(footer?.className).toContain('dark:bg-neutral-900');
    });

    it('example prompt buttons use neutral colors in light mode', () => {
      const { container } = render(
        <CopilotSidebar
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      const buttons = container.querySelectorAll('button');
      const exampleButton = Array.from(buttons).find(btn =>
        btn.textContent?.includes('Send an email to')
      );
      expect(exampleButton).toHaveClass('text-neutral-600');
      expect(exampleButton).toHaveClass('hover:text-neutral-900');
      expect(exampleButton).toHaveClass('hover:bg-white');
      expect(exampleButton).toHaveClass('hover:border-neutral-200');
    });

    it('sidebar does not contain any zinc color classes', () => {
      const { container } = render(
        <CopilotSidebar
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      const sidebarHtml = container.innerHTML;
      expect(sidebarHtml).not.toMatch(/bg-zinc-/);
      expect(sidebarHtml).not.toMatch(/text-zinc-/);
      expect(sidebarHtml).not.toMatch(/border-zinc-/);
      expect(sidebarHtml).not.toMatch(/hover:bg-zinc-/);
    });
  });

  describe('Full sidebar rendering', () => {
    it('renders all main sections when open', () => {
      render(
        <CopilotSidebar
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      // Header
      expect(screen.getByText('AI Assistant')).toBeInTheDocument();

      // Chat interface
      expect(screen.getByTestId('copilot-chat')).toBeInTheDocument();

      // Example prompts footer
      expect(screen.getByText('Try saying:')).toBeInTheDocument();

      // Close button
      expect(screen.getByTestId('x-icon')).toBeInTheDocument();
    });
  });
});
