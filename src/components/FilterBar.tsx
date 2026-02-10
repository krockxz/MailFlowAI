import { Search, X, Filter, Calendar as CalendarIcon, User } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
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

export function FilterBar({ filters, onFiltersChange }: FilterBarProps) {
  const [searchQuery, setSearchQuery] = useState(filters.query || '');
  const [senderFilter, setSenderFilter] = useState(filters.sender || '');
  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false);
  const [dateFromOpen, setDateFromOpen] = useState(false);
  const [dateToOpen, setDateToOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSearchQuery(filters.query || '');
  }, [filters.query]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    onFiltersChange({ ...filters, query: value || undefined });
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSenderFilter('');
    onFiltersChange({});
  };

  const clearAllFilters = () => {
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

  const setDateFilter = (dateFrom?: Date, dateTo?: Date) => {
    onFiltersChange({
      ...filters,
      dateFrom,
      dateTo,
    });
  };

  const applyDatePreset = (preset: DatePreset) => {
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
  };

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
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors p-1 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-700 min-h-[36px] min-w-[36px] flex items-center justify-center"
              aria-label="Clear search"
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

        {/* Advanced Filter Popover */}
        <Popover open={isFilterPopoverOpen} onOpenChange={setIsFilterPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="secondary"
              size="sm"
              className={cn(
                'rounded-xl relative',
                hasActiveFilters && 'bg-accent-500 dark:bg-accent-500 text-white hover:bg-accent-600 dark:hover:bg-accent-600'
              )}
            >
              <Filter className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Filter</span>
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-white dark:bg-black text-accent-500 dark:text-accent-500 rounded-full text-xs font-semibold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-80 p-4"
            align="end"
            sideOffset={8}
          >
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">Filters</h3>
                {hasActiveFilters && (
                  <button
                    onClick={clearAllFilters}
                    className="text-xs text-accent-500 hover:text-accent-600 transition-colors"
                  >
                    Clear all
                  </button>
                )}
              </div>

              {/* Sender filter */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
                  <User className="w-3.5 h-3.5" />
                  From sender
                </label>
                <Input
                  type="text"
                  value={senderFilter}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSenderFilter(value);
                    onFiltersChange({
                      ...filters,
                      sender: value || undefined,
                    });
                  }}
                  placeholder="email@example.com"
                  className="bg-neutral-100 dark:bg-neutral-800 border-transparent"
                />
              </div>

              {/* Date range filter */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
                  <CalendarIcon className="w-3.5 h-3.5" />
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
                          'text-xs px-2 py-1 rounded-md transition-colors',
                          isActive
                            ? 'bg-accent-500 text-white'
                            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
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
                        className={cn(
                          'flex-1 justify-start text-left font-normal',
                          !filters.dateFrom && 'text-neutral-500'
                        )}
                      >
                        {filters.dateFrom ? format(filters.dateFrom, 'MMM d') : 'From'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
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
                        className={cn(
                          'flex-1 justify-start text-left font-normal',
                          !filters.dateTo && 'text-neutral-500'
                        )}
                      >
                        {filters.dateTo ? format(filters.dateTo, 'MMM d') : 'To'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
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
              <div className="pt-2 border-t border-neutral-200 dark:border-neutral-700 sm:hidden">
                <Button
                  onClick={() => setIsFilterPopoverOpen(false)}
                  className="w-full"
                  size="sm"
                >
                  Apply Filters
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Active filters display */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          {filters.isUnread !== undefined && (
            <ActiveFilterBadge onRemove={() => onFiltersChange({ ...filters, isUnread: undefined })}>
              Unread only
            </ActiveFilterBadge>
          )}
          {filters.sender && (
            <ActiveFilterBadge onRemove={() => {
              setSenderFilter('');
              onFiltersChange({ ...filters, sender: undefined });
            }}>
              From: {filters.sender}
            </ActiveFilterBadge>
          )}
          {filters.dateFrom && (
            <ActiveFilterBadge onRemove={() => setDateFilter(undefined, filters.dateTo)}>
              From: {format(filters.dateFrom, 'MMM d')}
            </ActiveFilterBadge>
          )}
          {filters.dateTo && (
            <ActiveFilterBadge onRemove={() => setDateFilter(filters.dateFrom, undefined)}>
              To: {format(filters.dateTo, 'MMM d')}
            </ActiveFilterBadge>
          )}
        </div>
      )}
    </div>
  );
}

// Helper component for active filter badges
function ActiveFilterBadge({
  children,
  onRemove
}: {
  children: React.ReactNode;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-accent-50 dark:bg-accent-950/30 text-accent-700 dark:text-accent-300 text-xs font-medium">
      {children}
      <button
        onClick={onRemove}
        className="hover:text-accent-900 dark:hover:text-accent-100 transition-colors"
      >
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}

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
