import { Search, X, Filter, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import type { FilterState } from '@/types/email';

interface FilterBarProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onSearch?: (query: string) => void;
}

export function FilterBar({ filters, onFiltersChange, onSearch }: FilterBarProps) {
  const [searchQuery, setSearchQuery] = useState(filters.query || '');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [senderFilter, setSenderFilter] = useState(filters.sender || '');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSearchQuery(filters.query || '');
  }, [filters.query]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    onFiltersChange({ ...filters, query: value });

    // Trigger search after debounce
    if (onSearch) {
      const timeout = setTimeout(() => {
        if (value.trim()) {
          onSearch(value);
        }
      }, 500);
      return () => clearTimeout(timeout);
    }
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
    <div className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center gap-3">
        {/* Search input */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search emails..."
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Filter toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
            showAdvanced || hasActiveFilters
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          )}
        >
          <Filter className="w-4 h-4" />
          <span>Filters</span>
          <ChevronDown className={cn(
            'w-4 h-4 transition-transform',
            showAdvanced && 'rotate-180'
          )} />
        </button>

        {/* Quick filters */}
        <button
          onClick={toggleUnread}
          className={cn(
            'px-4 py-2 rounded-lg transition-colors',
            filters.isUnread
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          )}
        >
          Unread
        </button>
      </div>

      {/* Advanced filters */}
      {showAdvanced && (
        <div className="mt-3 flex items-center gap-3">
          <div className="flex-1">
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
              placeholder="Filter by sender..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}
    </div>
  );
}
