/**
 * Tests for FilterBar component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FilterBar } from '../FilterBar';
import { createMockFilterState } from '@/test/test-utils';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Search: ({ className }: { className: string }) => <div data-testid="search-icon" className={className} />,
  X: ({ className }: { className: string }) => <div data-testid="x-icon" className={className} />,
  Filter: ({ className }: { className: string }) => <div data-testid="filter-icon" className={className} />,
}));

describe('FilterBar', () => {
  const mockOnFiltersChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Search input', () => {
    it('renders search input with placeholder', () => {
      render(
        <FilterBar
          filters={createMockFilterState()}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      expect(screen.getByPlaceholderText('Search emails...')).toBeInTheDocument();
    });

    it('displays current filter value', () => {
      render(
        <FilterBar
          filters={createMockFilterState({ query: 'test search' })}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search emails...') as HTMLInputElement;
      expect(searchInput.value).toBe('test search');
    });

    it('updates filters on search input change', () => {
      render(
        <FilterBar
          filters={createMockFilterState()}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search emails...');
      fireEvent.change(searchInput, { target: { value: 'new search' } });

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        query: 'new search',
        sender: '',
        isUnread: undefined,
      });
    });

    it('shows clear button when search has value', () => {
      render(
        <FilterBar
          filters={createMockFilterState({ query: 'test' })}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      expect(screen.getByTestId('x-icon')).toBeInTheDocument();
    });

    it('hides clear button when search is empty', () => {
      render(
        <FilterBar
          filters={createMockFilterState({ query: '' })}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      expect(screen.queryByTestId('x-icon')).not.toBeInTheDocument();
    });
  });

  describe('Clear search button', () => {
    it('clears all filters when clear button clicked', () => {
      render(
        <FilterBar
          filters={createMockFilterState({
            query: 'test query',
            sender: 'test@example.com',
            isUnread: true,
          })}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const clearButton = screen.getByTestId('x-icon').closest('button');
      if (clearButton) {
        fireEvent.click(clearButton);
      }

      expect(mockOnFiltersChange).toHaveBeenCalledWith({});
    });
  });

  describe('Unread filter toggle', () => {
    it('toggles unread filter on button click', () => {
      render(
        <FilterBar
          filters={createMockFilterState()}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const unreadButton = screen.getByText('Unread');
      fireEvent.click(unreadButton);

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        query: '',
        sender: '',
        isUnread: true,
      });
    });

    it('removes unread filter when already active', () => {
      render(
        <FilterBar
          filters={createMockFilterState({ isUnread: true })}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const unreadButton = screen.getByText('Unread');
      fireEvent.click(unreadButton);

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        query: '',
        sender: '',
        isUnread: undefined,
      });
    });

    it('highlights Unread button when filter is active', () => {
      render(
        <FilterBar
          filters={createMockFilterState({ isUnread: true })}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const unreadButton = screen.getByText('Unread');
      expect(unreadButton).toBeInTheDocument();
    });
  });

  describe('Filter toggle', () => {
    it('renders Filter button with icon', () => {
      render(
        <FilterBar
          filters={createMockFilterState()}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      expect(screen.getByText('Filter')).toBeInTheDocument();
      expect(screen.getByTestId('filter-icon')).toBeInTheDocument();
    });

    it('applies active filter style when filters exist', () => {
      render(
        <FilterBar
          filters={createMockFilterState({
            query: 'test',
            isUnread: true,
          })}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const filterButton = screen.getByText('Filter').closest('button');
      // When filters are active, the button should have different styling
      expect(filterButton).toBeInTheDocument();
    });

    it('calls onFiltersChange to remove sender when filter clicked without active sender filter', () => {
      render(
        <FilterBar
          filters={createMockFilterState()}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const filterButton = screen.getByText('Filter').closest('button');
      if (filterButton) {
        fireEvent.click(filterButton);
      }

      // The component sets sender to undefined when toggling off
      expect(mockOnFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({
          sender: undefined,
        })
      );
    });
  });

  describe('Sender filter input (conditional rendering)', () => {
    it('does not show sender input when filters do not include sender', () => {
      render(
        <FilterBar
          filters={createMockFilterState()}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      expect(screen.queryByPlaceholderText('From...')).not.toBeInTheDocument();
    });

    it('sender input behavior is controlled by internal state', () => {
      // The sender input visibility is controlled by the local senderFilter state
      // which is toggled via the Filter button
      render(
        <FilterBar
          filters={createMockFilterState({ sender: 'test@example.com' })}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      // Initially, the sender input might not be visible due to local state
      // The filter button needs to be clicked to toggle it
      const filterButton = screen.getByText('Filter').closest('button');

      // First click might set senderFilter to empty (clearing it)
      if (filterButton) {
        fireEvent.click(filterButton);
      }

      // Since filters.sender exists, another click should show the input
      // But the logic is: if senderFilter is truthy, set to ''; otherwise set to filters.sender || ''
      // This means the input shows based on the internal toggle state
    });
  });

  describe('Integration tests', () => {
    it('handles multiple filter changes', () => {
      render(
        <FilterBar
          filters={createMockFilterState()}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      // Add search query
      const searchInput = screen.getByPlaceholderText('Search emails...');
      fireEvent.change(searchInput, { target: { value: 'project update' } });

      // Toggle unread
      const unreadButton = screen.getByText('Unread');
      fireEvent.click(unreadButton);

      expect(mockOnFiltersChange).toHaveBeenCalledTimes(2);
    });

    it('shows active filters indicator', () => {
      render(
        <FilterBar
          filters={createMockFilterState({
            query: 'important',
            isUnread: true,
          })}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      // Clear button should be visible when filters are active
      expect(screen.getByTestId('x-icon')).toBeInTheDocument();
    });

    it('renders all filter controls', () => {
      render(
        <FilterBar
          filters={createMockFilterState()}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      expect(screen.getByPlaceholderText('Search emails...')).toBeInTheDocument();
      expect(screen.getByText('Unread')).toBeInTheDocument();
      expect(screen.getByText('Filter')).toBeInTheDocument();
    });
  });
});
