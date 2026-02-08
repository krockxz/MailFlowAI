import { Search, X, Filter } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import type { FilterState } from '@/types/email';

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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-400 group-focus-within:text-blue-500 transition-smooth" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search emails..."
            className="w-full pl-10 pr-10 py-2.5 bg-zinc-100 dark:bg-zinc-800 border-transparent rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white dark:focus:bg-zinc-900 transition-smooth placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-smooth p-0.5 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Quick filters */}
        <button
          onClick={toggleUnread}
          className={cn(
            'px-4 py-2.5 rounded-xl text-sm font-medium transition-smooth',
            filters.isUnread
              ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
          )}
        >
          Unread
        </button>

        {/* Filter toggle */}
        <button
          onClick={() => {
            setSenderFilter(senderFilter ? '' : (filters.sender || ''));
            if (!senderFilter) {
              onFiltersChange({ ...filters, sender: undefined });
            }
          }}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-smooth',
            hasActiveFilters
              ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
          )}
        >
          <Filter className="w-4 h-4" />
          <span className="hidden sm:inline">Filter</span>
        </button>

        {/* Sender filter - shown when active */}
        {senderFilter && (
          <input
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
            className="w-40 px-3 py-2.5 bg-zinc-100 dark:bg-zinc-800 border-transparent rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-smooth"
          />
        )}
      </div>
    </div>
  );
}
