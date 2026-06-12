import { Calendar as CalendarIcon, ChevronDown, X } from 'lucide-react';
import { useState, useCallback } from 'react';
import dayjs from 'dayjs';
import isToday from 'dayjs/plugin/isToday';
import { cn, isWithinLastDays } from '@/lib/utils';

dayjs.extend(isToday);
import type { FilterState } from '@/types/email';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';

type DatePreset = 'today' | 'week' | 'month' | 'quarter' | 'year' | null;

const DATE_PRESETS: { label: string; value: DatePreset; days?: number }[] = [
  { label: 'Today', value: 'today', days: 1 },
  { label: 'Last 7 days', value: 'week', days: 7 },
  { label: 'Last 30 days', value: 'month', days: 30 },
  { label: 'Last 3 months', value: 'quarter', days: 90 },
  { label: 'Last year', value: 'year', days: 365 },
];

interface DateRangeFilterProps {
  filters: FilterState;
  onDateChange: (dateFrom?: Date, dateTo?: Date) => void;
}

export function DateRangeFilter({ filters, onDateChange }: DateRangeFilterProps) {
  const [dateFromOpen, setDateFromOpen] = useState(false);
  const [dateToOpen, setDateToOpen] = useState(false);

  const applyDatePreset = useCallback((preset: DatePreset) => {
    if (!preset) {
      onDateChange(undefined, undefined);
      return;
    }

    const presetConfig = DATE_PRESETS.find(p => p.value === preset);
    if (presetConfig?.days) {
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - presetConfig.days);
      fromDate.setHours(0, 0, 0, 0);
      onDateChange(fromDate, undefined);
    }
  }, [onDateChange]);

  return (
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

      <div className="flex flex-wrap gap-2">
        {DATE_PRESETS.map((preset) => {
          const isActive = preset.value && (
            (preset.value === 'today' && filters.dateFrom && dayjs(filters.dateFrom).isToday()) ||
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
              {isActive && (
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2.5s_infinite]" />
              )}
              {!isActive && (
                <span className="absolute inset-0 rounded-xl ring-1 ring-inset ring-neutral-300/50 dark:ring-neutral-600/50 opacity-0 group-hover/preset:opacity-100 transition-opacity duration-300" />
              )}
            </button>
          );
        })}
      </div>

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
              <span>{filters.dateFrom ? dayjs(filters.dateFrom).format('MMM D, YYYY') : 'Start Date'}</span>
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
                onDateChange(date, filters.dateTo);
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
              <span>{filters.dateTo ? dayjs(filters.dateTo).format('MMM D, YYYY') : 'End Date'}</span>
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
                onDateChange(filters.dateFrom, endOfDay);
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

      {(filters.dateFrom || filters.dateTo) && (
        <button
          onClick={() => onDateChange(undefined, undefined)}
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
  );
}
