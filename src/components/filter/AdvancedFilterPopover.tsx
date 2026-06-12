import { Filter, X } from 'lucide-react';
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { cn, debounce } from '@/lib/utils';
import type { FilterState } from '@/types/email';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { SenderFilter } from './SenderFilter';
import { DateRangeFilter } from './DateRangeFilter';

interface AdvancedFilterPopoverProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

export function AdvancedFilterPopover({ filters, onFiltersChange }: AdvancedFilterPopoverProps) {
  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false);
  const [senderFilter, setSenderFilter] = useState(filters.sender || '');

  const filtersRef = useRef(filters);
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  useEffect(() => {
    setSenderFilter(filters.sender || '');
  }, [filters.sender]);

  const debouncedFilterUpdate = useMemo(
    () => debounce((newFilters: FilterState) => {
      onFiltersChange(newFilters);
    }, 300),
    [onFiltersChange]
  );

  useEffect(() => {
    return () => {
      debouncedFilterUpdate.cancel();
    };
  }, [debouncedFilterUpdate]);

  const handleSenderChange = useCallback((value: string) => {
    setSenderFilter(value);
    debouncedFilterUpdate({
      ...filtersRef.current,
      sender: value || undefined,
    });
  }, [debouncedFilterUpdate]);

  const clearAllFilters = useCallback(() => {
    setSenderFilter('');
    debouncedFilterUpdate.cancel();
    onFiltersChange({ ...filtersRef.current, query: filtersRef.current.query, isUnread: filtersRef.current.isUnread });
  }, [onFiltersChange, debouncedFilterUpdate]);

  const setDateFilter = useCallback((dateFrom?: Date, dateTo?: Date) => {
    onFiltersChange({
      ...filtersRef.current,
      dateFrom,
      dateTo,
    });
  }, [onFiltersChange]);

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

          <SenderFilter value={senderFilter} onChange={handleSenderChange} />

          <DateRangeFilter filters={filters} onDateChange={setDateFilter} />
        </div>

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
  );
}
