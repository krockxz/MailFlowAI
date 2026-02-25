import { X, Filter, Calendar as CalendarIcon, User, ChevronDown, Sparkles, Search } from 'lucide-react';
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { format } from 'date-fns';
import { cn, debounce } from '@/lib/utils';
import type { FilterState } from '@/types/email';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';

// Animated search icon component with premium feel
const SearchIconAnim = ({ isSearching }: { isSearching: boolean }) => (
  <div className="relative">
    <Search className={cn(
      "w-4 h-4 transition-all duration-300 ease-out",
      isSearching ? "scale-110 rotate-12" : "scale-100 rotate-0"
    )} />
    {isSearching && (
      <div className="absolute inset-0 bg-neutral-400/20 dark:bg-neutral-500/20 rounded-full animate-[ping_1s_ease-in-out_infinite]" />
    )}
  </div>
);

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

  // Use a ref to always have current filters without recreating callbacks
  const filtersRef = useRef(filters);
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  // Keep local state in sync with external filters - combined effect
  useEffect(() => {
    setSearchQuery(filters.query || '');
    setSenderFilter(filters.sender || '');
  }, [filters.query, filters.sender]);

  // Debounced filter update (300ms delay) - stable reference
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
    // Use ref to get current filters, avoiding callback recreation
    debouncedFilterUpdate({ ...filtersRef.current, query: value || undefined });
  }, [debouncedFilterUpdate]);

  const handleSenderChange = useCallback((value: string) => {
    setSenderFilter(value);
    setIsSearching(true);
    // Use ref to get current filters, avoiding callback recreation
    debouncedFilterUpdate({
      ...filtersRef.current,
      sender: value || undefined,
    });
  }, [debouncedFilterUpdate]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    debouncedFilterUpdate.cancel();
    setIsSearching(false);
    onFiltersChange({ ...filtersRef.current, query: undefined });
  }, [onFiltersChange, debouncedFilterUpdate]);

  const clearAllFilters = useCallback(() => {
    setSearchQuery('');
    setSenderFilter('');
    debouncedFilterUpdate.cancel();
    setIsSearching(false);
    onFiltersChange({});
  }, [onFiltersChange, debouncedFilterUpdate]);

  const toggleUnread = useCallback(() => {
    onFiltersChange({
      ...filtersRef.current,
      isUnread: filtersRef.current.isUnread === undefined ? true : undefined,
    });
  }, [onFiltersChange]);

  const setDateFilter = useCallback((dateFrom?: Date, dateTo?: Date) => {
    onFiltersChange({
      ...filtersRef.current,
      dateFrom,
      dateTo,
    });
  }, [onFiltersChange]);

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
    <div className="px-4 py-3">
      <div className="flex items-center gap-2.5">
        {/* Premium Search input with enhanced focus ring */}
        <div className="flex-1 relative group/search">
          {/* Search icon container with animated icon and gradient glow */}
          <div className={cn(
            "absolute left-3 top-1/2 -translate-y-1/2 transition-all duration-300 ease-out z-10",
            "text-neutral-400 group-focus-within/search:text-neutral-700 dark:group-focus-within/search:text-neutral-300",
            isSearching && "text-neutral-600 dark:text-neutral-400"
          )}>
            <SearchIconAnim isSearching={isSearching} />
          </div>

          {/* Premium focus ring with gradient effect */}
          <div className={cn(
            "absolute inset-0 rounded-xl opacity-0 transition-all duration-300 ease-out pointer-events-none",
            "group-focus-within/search:opacity-100",
            "bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 dark:from-neutral-700 dark:via-neutral-800 dark:to-neutral-700",
            "blur-sm -z-10 group-focus-within/search:scale-105 scale-100"
          )} />

          {/* Input with enhanced focus states */}
          <Input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search emails by subject, sender, or content..."
            className={cn(
              "pl-10 pr-10 h-11 text-sm rounded-xl",
              "bg-white/95 dark:bg-neutral-900/90",
              "backdrop-blur-sm",
              "border-neutral-200 dark:border-neutral-700/50",
              "transition-all duration-300 ease-out",
              "focus:ring-2 focus:ring-neutral-300/50 dark:focus:ring-neutral-600/50 focus:border-neutral-400 dark:focus:border-neutral-500",
              "focus:bg-white dark:focus:bg-neutral-900 focus:shadow-lg",
              "focus:shadow-neutral-200/30 dark:focus:shadow-black/20",
              "placeholder:text-neutral-400/70 dark:placeholder:text-neutral-500/70",
              isSearching && "border-neutral-400/70 dark:border-neutral-600/50"
            )}
          />

          {/* Clear button with premium animations */}
          <button
            onClick={clearSearch}
            className={cn(
              "absolute right-2 top-1/2 -translate-y-1/2 z-10",
              "text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200",
              "p-1.5 rounded-lg transition-all duration-200 ease-out",
              "hover:bg-neutral-200/50 dark:hover:bg-neutral-700/50",
              "hover:scale-110 active:scale-95",
              "opacity-0 scale-90 pointer-events-none translate-x-2",
              searchQuery && !isSearching && "opacity-100 scale-100 pointer-events-auto translate-x-0"
            )}
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5 transition-transform duration-200 group-hover/button:rotate-90" />
          </button>

          {/* Premium searching indicator with glow */}
          {isSearching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              <div className="flex gap-0.5 items-end h-4">
                <span className={cn(
                  "w-1 h-2 bg-gradient-to-t from-neutral-500 to-neutral-400 rounded-full animate-[bounce_1.4s_ease-in-out_infinite]",
                  "[animation-delay:-0s]"
                )} />
                <span className={cn(
                  "w-1 h-3 bg-gradient-to-t from-neutral-500 to-neutral-400 rounded-full animate-[bounce_1.4s_ease-in-out_infinite]",
                  "[animation-delay:-0.2s]"
                )} />
                <span className={cn(
                  "w-1 h-4 bg-gradient-to-t from-neutral-600 to-neutral-400 rounded-full animate-[bounce_1.4s_ease-in-out_infinite]",
                  "[animation-delay:-0.4s]"
                )} />
              </div>
            </div>
          )}
        </div>

        {/* Premium Unread filter button */}
        <Button
          onClick={toggleUnread}
          size="sm"
          className={cn(
            "h-11 px-4 rounded-xl font-medium transition-all duration-300 ease-out relative overflow-hidden",
            filters.isUnread
              ? "bg-gradient-to-br from-neutral-900 to-neutral-800 text-white dark:from-white dark:to-neutral-100 dark:text-neutral-900 shadow-lg shadow-neutral-900/20 dark:shadow-white/10 hover:shadow-xl hover:shadow-neutral-900/30 dark:hover:shadow-white/20 hover:scale-[1.02] active:scale-[0.98]"
              : "bg-white/80 dark:bg-neutral-900/80 text-neutral-700 dark:text-neutral-300 border border-neutral-200/70 dark:border-neutral-700/50 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-600 backdrop-blur-sm"
          )}
        >
          {/* Subtle shimmer effect for active state */}
          {filters.isUnread && (
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer_2.5s_infinite]" />
          )}
          <Sparkles className={cn(
            "w-3.5 h-3.5 mr-1.5 transition-all duration-500 ease-out relative z-10",
            filters.isUnread ? "rotate-12 scale-110" : "rotate-0 scale-100"
          )} />
          <span className="relative z-10">Unread</span>
          {filters.isUnread && (
            <span className="ml-2 w-2 h-2 bg-white/90 dark:bg-neutral-900 rounded-full animate-[pulse-glow_2s_ease-in-out_infinite] relative z-10" />
          )}
        </Button>

        {/* Premium Advanced Filter Popover */}
        <Popover open={isFilterPopoverOpen} onOpenChange={setIsFilterPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              size="sm"
              className={cn(
                "h-11 px-3.5 rounded-xl transition-all duration-300 ease-out relative overflow-hidden",
                "bg-white/80 dark:bg-neutral-900/80 text-neutral-700 dark:text-neutral-300",
                "border border-neutral-200/70 dark:border-neutral-700/50",
                "hover:bg-neutral-50 dark:hover:bg-neutral-800",
                "hover:border-neutral-300 dark:hover:border-neutral-600",
                "hover:shadow-md hover:shadow-neutral-200/20 dark:hover:shadow-black/20",
                "data-[state=open]:bg-neutral-100 dark:data-[state=open]:bg-neutral-800",
                "data-[state=open]:shadow-lg",
                "backdrop-blur-sm"
              )}
            >
              <Filter className={cn(
                "w-4 h-4 mr-2 transition-transform duration-500 ease-out",
                isFilterPopoverOpen && "rotate-180 scale-110"
              )} />
              <span className="hidden sm:inline font-medium">Filters</span>
              {/* Premium badge with glow */}
              {activeFilterCount > 0 && (
                <span className={cn(
                  "absolute -top-1.5 -right-1.5 min-w-[1.25rem] h-5",
                  "bg-gradient-to-br from-neutral-900 to-neutral-800 dark:from-white dark:to-neutral-100 text-white dark:text-neutral-900",
                  "rounded-full text-xs font-semibold shadow-lg shadow-neutral-900/20 dark:shadow-white/20",
                  "flex items-center justify-center px-1",
                  "transition-all duration-300 ease-out",
                  "animate-[scaleIn_0.3s_ease-out]",
                  "ring-2 ring-white dark:ring-neutral-900"
                )}>
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>

          <PopoverContent
            className={cn(
              "w-96 p-0 rounded-2xl",
              "bg-white/90 dark:bg-neutral-900/90",
              "border border-neutral-200/70 dark:border-neutral-700/50",
              "shadow-2xl shadow-neutral-200/40 dark:shadow-black/50",
              "backdrop-blur-md"
            )}
            align="end"
            sideOffset={12}
          >
            <div className="p-5 space-y-5">
              {/* Premium Header with gradient icon */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2.5 rounded-xl transition-all duration-300",
                    "bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-700",
                    "shadow-inner"
                  )}>
                    <Filter className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white tracking-tight">
                      Filter Options
                    </h3>
                    {hasActiveFilters && (
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 dark:bg-neutral-500" />
                        {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active
                      </p>
                    )}
                  </div>
                </div>
                {hasActiveFilters && (
                  <button
                    onClick={clearAllFilters}
                    className={cn(
                      "text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5",
                      "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white",
                      "bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-700",
                      "hover:from-neutral-200 hover:to-neutral-300 dark:hover:from-neutral-700 dark:hover:to-neutral-600",
                      "transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm"
                    )}
                  >
                    <X className="w-3 h-3" />
                    Clear all
                  </button>
                )}
              </div>

              {/* Premium Sender filter */}
              <div className="space-y-3">
                <label className={cn(
                  "text-xs font-bold text-neutral-600 dark:text-neutral-400 tracking-wide uppercase",
                  "flex items-center gap-2"
                )}>
                  <div className={cn(
                    "p-1.5 rounded-lg",
                    "bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-700"
                  )}>
                    <User className="w-3 h-3 text-neutral-600 dark:text-neutral-400" />
                  </div>
                  From Sender
                </label>
                <div className="relative group/sender">
                  <div className={cn(
                    "absolute inset-0 rounded-xl opacity-0 transition-all duration-300 pointer-events-none",
                    "group-focus-within/sender:opacity-100 group-hover/sender:opacity-50",
                    "bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 dark:from-neutral-700 dark:via-neutral-800 dark:to-neutral-700",
                    "blur-sm -z-10"
                  )} />
                  <Input
                    type="text"
                    value={senderFilter}
                    onChange={(e) => handleSenderChange(e.target.value)}
                    placeholder="email@example.com"
                    className={cn(
                      "h-11 text-sm pr-10 rounded-xl",
                      "bg-white/95 dark:bg-neutral-900/95 backdrop-blur-sm",
                      "border-neutral-200/70 dark:border-neutral-700/50",
                      "focus:ring-2 focus:ring-neutral-300/50 dark:focus:ring-neutral-600/50",
                      "focus:border-neutral-400 dark:focus:border-neutral-500",
                      "transition-all duration-300 shadow-sm"
                    )}
                  />
                  {senderFilter && (
                    <button
                      onClick={() => handleSenderChange('')}
                      className={cn(
                        "absolute right-2.5 top-1/2 -translate-y-1/2",
                        "text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200",
                        "p-1.5 rounded-lg transition-all duration-200",
                        "hover:bg-neutral-200/50 dark:hover:bg-neutral-700/50",
                        "hover:scale-110 active:scale-95"
                      )}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Premium Date range filter */}
              <div className="space-y-3">
                <label className={cn(
                  "text-xs font-bold text-neutral-600 dark:text-neutral-400 tracking-wide uppercase",
                  "flex items-center gap-2"
                )}>
                  <div className={cn(
                    "p-1.5 rounded-lg",
                    "bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-700"
                  )}>
                    <CalendarIcon className="w-3 h-3 text-neutral-600 dark:text-neutral-400" />
                  </div>
                  Date Range
                </label>

                {/* Premium Quick presets with enhanced styling */}
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
                          'text-xs px-3 py-2 rounded-xl font-medium transition-all duration-300 ease-out',
                          'relative overflow-hidden group/preset',
                          isActive
                            ? 'bg-gradient-to-br from-neutral-900 to-neutral-800 text-white dark:from-white dark:to-neutral-100 dark:text-neutral-900 shadow-lg shadow-neutral-900/20 dark:shadow-white/10 hover:shadow-xl hover:scale-105'
                            : 'bg-gradient-to-br from-neutral-100 to-neutral-200/50 text-neutral-700 dark:from-neutral-800 dark:to-neutral-700/50 dark:text-neutral-300 hover:from-neutral-200 hover:to-neutral-300 dark:hover:from-neutral-700 dark:hover:to-neutral-600 hover:scale-105'
                        )}
                      >
                        {preset.label}
                        {/* Premium shimmer effect for active state */}
                        {isActive && (
                          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2.5s_infinite]" />
                        )}
                        {/* Subtle border glow for hover */}
                        {!isActive && (
                          <span className="absolute inset-0 rounded-xl ring-1 ring-inset ring-neutral-300/50 dark:ring-neutral-600/50 opacity-0 group-hover/preset:opacity-100 transition-opacity duration-300" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Premium Custom date range */}
                <div className="flex gap-2">
                  <Popover open={dateFromOpen} onOpenChange={setDateFromOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                          "flex-1 justify-between text-left font-normal h-11 rounded-xl",
                          "bg-white/95 dark:bg-neutral-900/95 backdrop-blur-sm",
                          "border-neutral-200/70 dark:border-neutral-700/50",
                          "hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-600",
                          "transition-all duration-300 hover:shadow-md",
                          filters.dateFrom && "text-neutral-900 dark:text-white font-semibold border-neutral-400/70 dark:border-neutral-500/50"
                        )}
                      >
                        <span>{filters.dateFrom ? format(filters.dateFrom, 'MMM d, yyyy') : 'Start Date'}</span>
                        <ChevronDown className="w-4 h-4 text-neutral-400 transition-transform duration-300" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className={cn(
                      "w-auto p-3 rounded-2xl",
                      "bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md",
                      "border border-neutral-200/70 dark:border-neutral-700/50",
                      "shadow-2xl shadow-neutral-200/40 dark:shadow-black/50"
                    )} align="start">
                      <Calendar
                        mode="single"
                        selected={filters.dateFrom}
                        onSelect={(date) => {
                          setDateFilter(date, filters.dateTo);
                          setDateFromOpen(false);
                        }}
                        initialFocus
                        className={cn(
                          "[&_td]:rounded-lg [&_td]:h-9 [&_td]:w-9",
                          "[&_[data-selected]]:bg-neutral-900 [&_[data-selected]]:text-white",
                          "dark:[&_[data-selected]]:bg-white dark:[&_[data-selected]]:text-neutral-900"
                        )}
                      />
                    </PopoverContent>
                  </Popover>

                  <Popover open={dateToOpen} onOpenChange={setDateToOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                          "flex-1 justify-between text-left font-normal h-11 rounded-xl",
                          "bg-white/95 dark:bg-neutral-900/95 backdrop-blur-sm",
                          "border-neutral-200/70 dark:border-neutral-700/50",
                          "hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-600",
                          "transition-all duration-300 hover:shadow-md",
                          filters.dateTo && "text-neutral-900 dark:text-white font-semibold border-neutral-400/70 dark:border-neutral-500/50"
                        )}
                      >
                        <span>{filters.dateTo ? format(filters.dateTo, 'MMM d, yyyy') : 'End Date'}</span>
                        <ChevronDown className="w-4 h-4 text-neutral-400 transition-transform duration-300" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className={cn(
                      "w-auto p-3 rounded-2xl",
                      "bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md",
                      "border border-neutral-200/70 dark:border-neutral-700/50",
                      "shadow-2xl shadow-neutral-200/40 dark:shadow-black/50"
                    )} align="end">
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
                        className={cn(
                          "[&_td]:rounded-lg [&_td]:h-9 [&_td]:w-9",
                          "[&_[data-selected]]:bg-neutral-900 [&_[data-selected]]:text-white",
                          "dark:[&_[data-selected]]:bg-white dark:[&_[data-selected]]:text-neutral-900",
                          "[&_[data-disabled]]:opacity-30 [&_[data-disabled]]:line-through"
                        )}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Premium Clear date range */}
                {(filters.dateFrom || filters.dateTo) && (
                  <button
                    onClick={() => setDateFilter(undefined, undefined)}
                    className={cn(
                      "text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all duration-200",
                      "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200",
                      "bg-gradient-to-br from-neutral-100/80 to-neutral-200/50 dark:from-neutral-800/50 dark:to-neutral-700/30",
                      "hover:from-neutral-200 hover:to-neutral-300 dark:hover:from-neutral-700 dark:hover:to-neutral-600",
                      "hover:scale-105 active:scale-95"
                    )}
                  >
                    <X className="w-3 h-3" />
                    Clear date range
                  </button>
                )}
              </div>
            </div>

            {/* Apply button for mobile - premium */}
            <div className="p-4 pt-0 border-t border-neutral-100/70 dark:border-neutral-800/50 sm:hidden">
              <Button
                onClick={() => setIsFilterPopoverOpen(false)}
                className={cn(
                  "w-full h-11 rounded-xl font-semibold",
                  "bg-gradient-to-br from-neutral-900 to-neutral-800 dark:from-white dark:to-neutral-100",
                  "text-white dark:text-neutral-900 shadow-lg shadow-neutral-900/20 dark:shadow-white/10",
                  "hover:shadow-xl hover:shadow-neutral-900/30 dark:hover:shadow-white/20",
                  "hover:scale-[1.02] active:scale-[0.98]",
                  "transition-all duration-200"
                )}
                size="sm"
              >
                Apply Filters
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
