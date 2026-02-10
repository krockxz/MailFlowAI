import { Search, X, Filter } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import type { FilterState } from '@/types/email';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface FilterBarProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onSearch?: (query: string) => void;
}

export function FilterBar({ filters, onFiltersChange }: FilterBarProps) {
  const [searchQuery, setSearchQuery] = useState(filters.query || '');
  const [senderFilter, setSenderFilter] = useState(filters.sender || '');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSearchQuery(filters.query || '');
  }, [filters.query]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    onFiltersChange({ ...filters, query: value });
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSenderFilter('');
    onFiltersChange({});
  };

  const toggleUnread = () => {
    onFiltersChange({
      ...filters,
      isUnread: filters.isUnread === undefined ? true : undefined,
    });
  };

  const hasActiveFilters = filters.query || filters.sender || filters.isUnread !== undefined;

  return (
    <div className="px-4 py-3">
      <div className="flex items-center gap-3">
        {/* Search input */}
        <div className="flex-1 relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-neutral-400 group-focus-within:text-accent-500 transition-colors duration-200" />
          <Input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search emails..."
            className="pl-10 pr-10 bg-neutral-100 dark:bg-neutral-800 border-transparent focus-visible:bg-white dark:focus-visible:bg-neutral-900"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors p-0.5 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-700"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Quick filters */}
        <Button
          onClick={toggleUnread}
          variant={filters.isUnread ? "default" : "secondary"}
          size="sm"
          className={cn(
            'rounded-xl',
            filters.isUnread && 'bg-accent-500 hover:bg-accent-600 shadow-lg shadow-accent-500/25'
          )}
        >
          Unread
        </Button>

        {/* Filter toggle */}
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setSenderFilter(senderFilter ? '' : (filters.sender || ''));
            if (!senderFilter) {
              onFiltersChange({ ...filters, sender: undefined });
            }
          }}
          className={cn(
            'rounded-xl',
            hasActiveFilters && 'bg-accent-500 dark:bg-accent-500 text-white hover:bg-accent-600 dark:hover:bg-accent-600'
          )}
        >
          <Filter className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">Filter</span>
        </Button>

        {/* Sender filter - shown when active */}
        {senderFilter && (
          <Input
            type="text"
            value={senderFilter}
            onChange={(e) => {
              setSenderFilter(e.target.value);
              onFiltersChange({
                ...filters,
                sender: e.target.value || undefined,
              });
            }}
            placeholder="From..."
            className="w-40 bg-neutral-100 dark:bg-neutral-800 border-transparent"
          />
        )}
      </div>
    </div>
  );
}
