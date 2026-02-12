import { Search, X, Filter, Calendar as CalendarIcon, User } from 'lucide-react';
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { format } from 'date-fns';
import { cn, debounce } from '@/lib/utils';
import type { FilterState } from '@/types/email';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';

interface FilterBarProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

// Quick date range presets
type DatePreset = 'today' | 'week' | 'month' | 'quarter' | 'year' | null;

const DATE_PRESETS: { label: string; value: DatePreset; days?: number }[] = [
  { label: 'Today', value: 'today', days: 1 },
  { label: 'Last 7 days', value: 'week', days: 7 },
  { label: 'Last 30 days', value: 'month', days: 30 },
  { label: 'Last 3 months', value: 'quarter', days: 90 },
  { label: 'Last year', value: 'year', days: 365 },
];

// Helper functions
function isToday(date: Date): boolean {
  const today = new Date();
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
}

function isWithinLastDays(date: Date, days: number): boolean {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  cutoff.setHours(0, 0, 0, 0);
  return date >= cutoff;
}

export function FilterBar({ filters, onFiltersChange }: FilterBarProps) {
  const [searchQuery, setSearchQuery] = useState(filters.query || '');
  const [senderFilter, setSenderFilter] = useState(filters.sender || '');
  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false);
  const [dateFromOpen, setDateFromOpen] = useState(false);
  const [dateToOpen, setDateToOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keep local state in sync with external filters
  useEffect(() => {
    setSearchQuery(filters.query || '');
  }, [filters.query]);

  useEffect(() => {
    setSenderFilter(filters.sender || '');
  }, [filters.sender]);

  // Debounced filter update (300ms delay) - memoized
  const debouncedFilterUpdate = useMemo(
    () => debounce((newFilters: FilterState) => {
      setIsSearching(false);
      onFiltersChange(newFilters);
    }, 300),
    [onFiltersChange]
  );

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      debouncedFilterUpdate.cancel();
    };
  }, [debouncedFilterUpdate]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setIsSearching(true);
    debouncedFilterUpdate({ ...filters, query: value || undefined });
  }, [filters, debouncedFilterUpdate]);

  const handleSenderChange = useCallback((value: string) => {
    setSenderFilter(value);
    setIsSearching(true);
    debouncedFilterUpdate({
      ...filters,
      sender: value || undefined,
    });
  }, [filters, debouncedFilterUpdate]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    debouncedFilterUpdate.cancel();
    setIsSearching(false);
    onFiltersChange({ ...filters, query: undefined });
  }, [filters, onFiltersChange, debouncedFilterUpdate]);

  const clearAllFilters = useCallback(() => {
    setSearchQuery('');
    setSenderFilter('');
    debouncedFilterUpdate.cancel();
    setIsSearching(false);
    onFiltersChange({});
  }, [onFiltersChange, debouncedFilterUpdate]);

  const toggleUnread = useCallback(() => {
    onFiltersChange({
      ...filters,
      isUnread: filters.isUnread === undefined ? true : undefined,
    });
  }, [filters, onFiltersChange]);

  const setDateFilter = useCallback((dateFrom?: Date, dateTo?: Date) => {
    onFiltersChange({
      ...filters,
      dateFrom,
      dateTo,
    });
  }, [filters, onFiltersChange]);

  const applyDatePreset = useCallback((preset: DatePreset) => {
    if (!preset) {
      setDateFilter(undefined, undefined);
      return;
    }

    const presetConfig = DATE_PRESETS.find(p => p.value === preset);
    if (presetConfig?.days) {
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - presetConfig.days);
      fromDate.setHours(0, 0, 0, 0);
      setDateFilter(fromDate, undefined);
    }
  }, [setDateFilter]);

  const hasActiveFilters = !!(
    filters.query ||
    filters.sender ||
    filters.isUnread !== undefined ||
    filters.dateFrom ||
    filters.dateTo
  );

  const activeFilterCount = [
    filters.query,
    filters.sender,
    filters.isUnread !== undefined,
    filters.dateFrom,
    filters.dateTo
  ].filter(Boolean).length;

  return (
    <div className="px-4 py-2">
      <div className="flex items-center gap-2">
        {/* Search input */}
        <div className="flex-1 relative">
          <Search className={cn(
            "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400",
            isSearching && "text-neutral-600 dark:text-neutral-500"
          )} />
          <Input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search emails..."
            className={cn(
              "pl-10 pr-9 bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 h-9 text-sm",
              isSearching && "border-neutral-400 dark:border-neutral-600"
            )}
          />
          {searchQuery && !isSearching && (
            <button
              onClick={clearSearch}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800"
              aria-label="Clear search"
            >
              <X className="w-3 h-3" />
            </button>
          )}
          {isSearching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-3 h-3 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Quick filters */}
        <Button
          onClick={toggleUnread}
          variant={filters.isUnread ? "default" : "secondary"}
          size="sm"
          className="h-9"
        >
          Unread
        </Button>

        {/* Advanced Filter Popover */}
        <Popover open={isFilterPopoverOpen} onOpenChange={setIsFilterPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="secondary"
              size="sm"
              className="h-9 relative"
            >
              <Filter className="w-3.5 h-3.5 mr-1.5" />
              <span className="hidden sm:inline">Filter</span>
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-full text-xs font-semibold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-80 p-4 bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800"
            align="end"
            sideOffset={4}
          >
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">Filters</h3>
                {hasActiveFilters && (
                  <button
                    onClick={clearAllFilters}
                    className="text-xs text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors"
                  >
                    Clear all
                  </button>
                )}
              </div>

              {/* Sender filter */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
                  <User className="w-3 h-3" />
                  From sender
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    value={senderFilter}
                    onChange={(e) => handleSenderChange(e.target.value)}
                    placeholder="email@example.com"
                    className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 h-9 text-sm pr-9"
                  />
                  {isSearching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="w-3 h-3 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
              </div>

              {/* Date range filter */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
                  <CalendarIcon className="w-3 h-3" />
                  Date range
                </label>

                {/* Quick presets */}
                <div className="flex flex-wrap gap-1.5">
                  {DATE_PRESETS.map((preset) => {
                    const isActive = preset.value && (
                      (preset.value === 'today' && filters.dateFrom && isToday(filters.dateFrom)) ||
                      (preset.days && filters.dateFrom && isWithinLastDays(filters.dateFrom, preset.days))
                    );
                    return (
                      <button
                        key={preset.label}
                        onClick={() => applyDatePreset(preset.value)}
                        className={cn(
                          'text-xs px-2.5 py-1 font-medium transition-colors',
                          isActive
                            ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                            : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                        )}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>

                {/* Custom date range */}
                <div className="flex gap-2">
                  <Popover open={dateFromOpen} onOpenChange={setDateFromOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 justify-start text-left font-normal h-9"
                      >
                        {filters.dateFrom ? format(filters.dateFrom, 'MMM d') : 'From'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800" align="start">
                      <Calendar
                        mode="single"
                        selected={filters.dateFrom}
                        onSelect={(date) => {
                          setDateFilter(date, filters.dateTo);
                          setDateFromOpen(false);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>

                  <Popover open={dateToOpen} onOpenChange={setDateToOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 justify-start text-left font-normal h-9"
                      >
                        {filters.dateTo ? format(filters.dateTo, 'MMM d') : 'To'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800" align="end">
                      <Calendar
                        mode="single"
                        selected={filters.dateTo}
                        onSelect={(date) => {
                          const endOfDay = date ? new Date(date) : undefined;
                          if (endOfDay) {
                            endOfDay.setHours(23, 59, 59, 999);
                          }
                          setDateFilter(filters.dateFrom, endOfDay);
                          setDateToOpen(false);
                        }}
                        initialFocus
                        disabled={(date) => filters.dateFrom ? date < filters.dateFrom : false}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Clear date range */}
                {(filters.dateFrom || filters.dateTo) && (
                  <button
                    onClick={() => setDateFilter(undefined, undefined)}
                    className="text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
                  >
                    Clear date range
                  </button>
                )}
              </div>

              {/* Apply button for mobile */}
              <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 sm:hidden">
                <Button
                  onClick={() => setIsFilterPopoverOpen(false)}
                  className="w-full h-9"
                  size="sm"
                >
                  Apply Filters
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
