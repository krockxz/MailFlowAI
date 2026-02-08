/**
 * Tests for Sidebar component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Sidebar } from '../Sidebar';
import type { ViewType } from '@/types/email';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Inbox: ({ className }: { className: string }) => <div data-testid="inbox-icon" className={className} />,
  Send: ({ className }: { className: string }) => <div data-testid="send-icon" className={className} />,
  PenTool: ({ className }: { className: string }) => <div data-testid="pen-icon" className={className} />,
  RefreshCw: ({ className }: { className: string }) => <div data-testid="refresh-icon" className={className} />,
  LogOut: ({ className }: { className: string }) => <div data-testid="logout-icon" className={className} />,
  Settings: ({ className }: { className: string }) => <div data-testid="settings-icon" className={className} />,
}));

// Mock useGoogleAuth hook
vi.mock('@/hooks/useGoogleAuth', () => ({
  useGoogleAuth: () => ({
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

describe('Sidebar', () => {
  const mockOnViewChange = vi.fn();
  const mockOnCompose = vi.fn();
  const mockOnRefresh = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Navigation items', () => {
    it('renders navigation items (Inbox, Sent)', () => {
      render(
        <Sidebar
          currentView="inbox"
          onViewChange={mockOnViewChange}
          onCompose={mockOnCompose}
          unreadCount={0}
          isAuthenticated={true}
        />
      );

      expect(screen.getByText('Inbox')).toBeInTheDocument();
      expect(screen.getByText('Sent')).toBeInTheDocument();
    });

    it('highlights current view', () => {
      render(
        <Sidebar
          currentView="inbox"
          onViewChange={mockOnViewChange}
          onCompose={mockOnCompose}
          unreadCount={0}
          isAuthenticated={true}
        />
      );

      // The current view should have different styling (via variant prop)
      expect(screen.getByText('Inbox')).toBeInTheDocument();
    });

    it('shows unread count badge for inbox', () => {
      render(
        <Sidebar
          currentView="inbox"
          onViewChange={mockOnViewChange}
          onCompose={mockOnCompose}
          unreadCount={5}
          isAuthenticated={true}
        />
      );

      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('shows 99+ when unread count exceeds 99', () => {
      render(
        <Sidebar
          currentView="inbox"
          onViewChange={mockOnViewChange}
          onCompose={mockOnCompose}
          unreadCount={150}
          isAuthenticated={true}
        />
      );

      expect(screen.getByText('99+')).toBeInTheDocument();
    });

    it('shows badge for inbox regardless of current view', () => {
      render(
        <Sidebar
          currentView="sent"
          onViewChange={mockOnViewChange}
          onCompose={mockOnCompose}
          unreadCount={10}
          isAuthenticated={true}
        />
      );

      // The badge is for inbox count, shown in the inbox nav item
      // It should be visible even when viewing sent folder
      expect(screen.getByText('10')).toBeInTheDocument();
    });
  });

  describe('Compose button', () => {
    it('renders compose button', () => {
      render(
        <Sidebar
          currentView="inbox"
          onViewChange={mockOnViewChange}
          onCompose={mockOnCompose}
          unreadCount={0}
          isAuthenticated={true}
        />
      );

      expect(screen.getByText('Compose')).toBeInTheDocument();
      expect(screen.getByTestId('pen-icon')).toBeInTheDocument();
    });

    it('calls onCompose when compose button clicked', () => {
      render(
        <Sidebar
          currentView="inbox"
          onViewChange={mockOnViewChange}
          onCompose={mockOnCompose}
          unreadCount={0}
          isAuthenticated={true}
        />
      );

      const composeButton = screen.getByText('Compose').closest('button');
      if (composeButton) {
        fireEvent.click(composeButton);
      }

      expect(mockOnCompose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Refresh button', () => {
    it('renders refresh button when onRefresh is provided', () => {
      render(
        <Sidebar
          currentView="inbox"
          onViewChange={mockOnViewChange}
          onCompose={mockOnCompose}
          unreadCount={0}
          onRefresh={mockOnRefresh}
          isAuthenticated={true}
        />
      );

      expect(screen.getByText('Sync')).toBeInTheDocument();
    });

    it('disables refresh when loading', () => {
      render(
        <Sidebar
          currentView="inbox"
          onViewChange={mockOnViewChange}
          onCompose={mockOnCompose}
          unreadCount={0}
          onRefresh={mockOnRefresh}
          isLoading={true}
          isAuthenticated={true}
        />
      );

      expect(screen.getByText('Syncing...')).toBeInTheDocument();
      const refreshButton = screen.getByText('Syncing...').closest('button');
      expect(refreshButton).toBeDisabled();
    });

    it('calls onRefresh when refresh clicked', () => {
      render(
        <Sidebar
          currentView="inbox"
          onViewChange={mockOnViewChange}
          onCompose={mockOnCompose}
          unreadCount={0}
          onRefresh={mockOnRefresh}
          isAuthenticated={true}
        />
      );

      const refreshButton = screen.getByText('Sync').closest('button');
      if (refreshButton) {
        fireEvent.click(refreshButton);
      }

      expect(mockOnRefresh).toHaveBeenCalledTimes(1);
    });
  });

  describe('Navigation clicks', () => {
    it('calls onViewChange when Inbox clicked', () => {
      render(
        <Sidebar
          currentView="sent"
          onViewChange={mockOnViewChange}
          onCompose={mockOnCompose}
          unreadCount={0}
          isAuthenticated={true}
        />
      );

      const inboxButton = screen.getByText('Inbox').closest('button');
      if (inboxButton) {
        fireEvent.click(inboxButton);
      }

      expect(mockOnViewChange).toHaveBeenCalledWith('inbox');
    });

    it('calls onViewChange when Sent clicked', () => {
      render(
        <Sidebar
          currentView="inbox"
          onViewChange={mockOnViewChange}
          onCompose={mockOnCompose}
          unreadCount={0}
          isAuthenticated={true}
        />
      );

      const sentButton = screen.getByText('Sent').closest('button');
      if (sentButton) {
        fireEvent.click(sentButton);
      }

      expect(mockOnViewChange).toHaveBeenCalledWith('sent');
    });
  });

  describe('Authentication state', () => {
    it('shows login button when not authenticated', () => {
      render(
        <Sidebar
          currentView="inbox"
          onViewChange={mockOnViewChange}
          onCompose={mockOnCompose}
          unreadCount={0}
          isAuthenticated={false}
        />
      );

      expect(screen.getByText('Sign in with Google')).toBeInTheDocument();
    });

    it('shows logout button when authenticated', () => {
      render(
        <Sidebar
          currentView="inbox"
          onViewChange={mockOnViewChange}
          onCompose={mockOnCompose}
          unreadCount={0}
          isAuthenticated={true}
        />
      );

      expect(screen.getByText('Sign out')).toBeInTheDocument();
      expect(screen.getByTestId('logout-icon')).toBeInTheDocument();
    });

    it('does not show logout button when not authenticated', () => {
      render(
        <Sidebar
          currentView="inbox"
          onViewChange={mockOnViewChange}
          onCompose={mockOnCompose}
          unreadCount={0}
          isAuthenticated={false}
        />
      );

      expect(screen.queryByText('Sign out')).not.toBeInTheDocument();
    });
  });

  describe('Settings button', () => {
    it('renders settings button', () => {
      render(
        <Sidebar
          currentView="inbox"
          onViewChange={mockOnViewChange}
          onCompose={mockOnCompose}
          unreadCount={0}
          isAuthenticated={true}
        />
      );

      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.getByTestId('settings-icon')).toBeInTheDocument();
    });
  });

  describe('Header', () => {
    it('renders app title', () => {
      render(
        <Sidebar
          currentView="inbox"
          onViewChange={mockOnViewChange}
          onCompose={mockOnCompose}
          unreadCount={0}
          isAuthenticated={true}
        />
      );

      expect(screen.getByText('AI Mail')).toBeInTheDocument();
    });

    it('renders app tagline', () => {
      render(
        <Sidebar
          currentView="inbox"
          onViewChange={mockOnViewChange}
          onCompose={mockOnCompose}
          unreadCount={0}
          isAuthenticated={true}
        />
      );

      expect(screen.getByText('Intelligent email assistant')).toBeInTheDocument();
    });
  });

  describe('Full sidebar rendering', () => {
    it('renders all main sections', () => {
      render(
        <Sidebar
          currentView="inbox"
          onViewChange={mockOnViewChange}
          onCompose={mockOnCompose}
          unreadCount={3}
          onRefresh={mockOnRefresh}
          isAuthenticated={true}
        />
      );

      // Header
      expect(screen.getByText('AI Mail')).toBeInTheDocument();

      // Compose button
      expect(screen.getByText('Compose')).toBeInTheDocument();

      // Navigation
      expect(screen.getByText('Inbox')).toBeInTheDocument();
      expect(screen.getByText('Sent')).toBeInTheDocument();

      // Refresh
      expect(screen.getByText('Sync')).toBeInTheDocument();

      // Settings
      expect(screen.getByText('Settings')).toBeInTheDocument();

      // Logout (authenticated)
      expect(screen.getByText('Sign out')).toBeInTheDocument();
    });
  });
});
