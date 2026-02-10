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
    <div className="px-4 py-2">
      <div className="flex items-center gap-3">
        {/* Search input */}
        <div className="flex-1 relative group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-neutral-400 group-focus-within:text-accent-500 transition-colors duration-300" />
          <Input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search emails..."
            className="pl-11 pr-10 bg-neutral-100/80 dark:bg-neutral-800/50 border-neutral-200/60 dark:border-neutral-700/50 focus-visible:bg-white dark:focus-visible:bg-neutral-900/50 focus-visible:border-accent-500 rounded-xl h-10 transition-all duration-300"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-all duration-200 p-1.5 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700/50 flex items-center justify-center"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Quick filters */}
        <Button
          onClick={toggleUnread}
          variant={filters.isUnread ? "default" : "secondary"}
          size="sm"
          className={cn(
            'rounded-xl h-10 transition-all duration-300 font-medium',
            filters.isUnread
              ? 'bg-accent-500 hover:bg-accent-600 text-white shadow-lg shadow-accent-500/25'
              : 'bg-neutral-100/80 dark:bg-neutral-800/50 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700/50'
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
                'rounded-xl h-10 relative transition-all duration-300 font-medium',
                hasActiveFilters
                  ? 'bg-accent-500 dark:bg-accent-500 text-white hover:bg-accent-600 dark:hover:bg-accent-600 shadow-lg shadow-accent-500/25'
                  : 'bg-neutral-100/80 dark:bg-neutral-800/50 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700/50'
              )}
            >
              <Filter className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Filter</span>
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-white dark:bg-black text-accent-500 dark:text-accent-500 rounded-full text-xs font-semibold flex items-center justify-center shadow-sm">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-80 p-5 rounded-2xl border-neutral-200/60 dark:border-neutral-800/60 glass-elevated"
            align="end"
            sideOffset={8}
          >
            <div className="space-y-5">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm text-neutral-900 dark:text-white">Filters</h3>
                {hasActiveFilters && (
                  <button
                    onClick={clearAllFilters}
                    className="text-xs text-accent-600 dark:text-accent-400 hover:text-accent-500 transition-colors font-medium"
                  >
                    Clear all
                  </button>
                )}
              </div>

              {/* Sender filter */}
              <div className="space-y-2.5">
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
                  className="bg-neutral-100/80 dark:bg-neutral-800/50 border-neutral-200/60 dark:border-neutral-700/50 focus-visible:border-accent-500 rounded-lg h-10 text-sm"
                />
              </div>

              {/* Date range filter */}
              <div className="space-y-2.5">
                <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
                  <CalendarIcon className="w-3.5 h-3.5" />
                  Date range
                </label>

                {/* Quick presets */}
                <div className="flex flex-wrap gap-2">
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
                          'text-xs px-3 py-1.5 rounded-lg font-medium transition-all duration-200',
                          isActive
                            ? 'bg-accent-500 text-white shadow-sm shadow-accent-500/20'
                            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
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
                          'flex-1 justify-start text-left font-normal rounded-lg h-10 transition-all duration-200',
                          !filters.dateFrom && 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
                        )}
                      >
                        {filters.dateFrom ? format(filters.dateFrom, 'MMM d') : 'From'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-xl border-neutral-200/60 dark:border-neutral-800/60 glass-elevated" align="start">
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
                          'flex-1 justify-start text-left font-normal rounded-lg h-10 transition-all duration-200',
                          !filters.dateTo && 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
                        )}
                      >
                        {filters.dateTo ? format(filters.dateTo, 'MMM d') : 'To'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-xl border-neutral-200/60 dark:border-neutral-800/60 glass-elevated" align="end">
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
                    className="text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors font-medium"
                  >
                    Clear date range
                  </button>
                )}
              </div>

              {/* Apply button for mobile */}
              <div className="pt-2 border-t border-neutral-200/50 dark:border-neutral-800/50 sm:hidden">
                <Button
                  onClick={() => setIsFilterPopoverOpen(false)}
                  className="w-full rounded-xl h-10"
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
