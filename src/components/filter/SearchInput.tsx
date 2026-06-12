import { X, Search } from 'lucide-react';
import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { cn, debounce } from '@/lib/utils';
import type { FilterState } from '@/types/email';
import { Input } from '@/components/ui/input';

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

interface SearchInputProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

export function SearchInput({ filters, onFiltersChange }: SearchInputProps) {
  const [searchQuery, setSearchQuery] = useState(filters.query || '');
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filtersRef = useRef(filters);
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  useEffect(() => {
    setSearchQuery(filters.query || '');
  }, [filters.query]);

  const debouncedFilterUpdate = useMemo(
    () => debounce((newFilters: FilterState) => {
      setIsSearching(false);
      onFiltersChange(newFilters);
    }, 300),
    [onFiltersChange]
  );

  useEffect(() => {
    return () => {
      debouncedFilterUpdate.cancel();
    };
  }, [debouncedFilterUpdate]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setIsSearching(true);
    debouncedFilterUpdate({ ...filtersRef.current, query: value || undefined });
  }, [debouncedFilterUpdate]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    debouncedFilterUpdate.cancel();
    setIsSearching(false);
    onFiltersChange({ ...filtersRef.current, query: undefined });
  }, [onFiltersChange, debouncedFilterUpdate]);

  return (
    <div className="flex-1 relative group/search">
      <div className={cn(
        "absolute left-3 top-1/2 -translate-y-1/2 transition-all duration-300 ease-out z-10",
        "text-neutral-400 group-focus-within/search:text-neutral-700 dark:group-focus-within/search:text-neutral-300",
        isSearching && "text-neutral-600 dark:text-neutral-400"
      )}>
        <SearchIconAnim isSearching={isSearching} />
      </div>

      <div className={cn(
        "absolute inset-0 rounded-xl opacity-0 transition-all duration-300 ease-out pointer-events-none",
        "group-focus-within/search:opacity-100",
        "bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 dark:from-neutral-700 dark:via-neutral-800 dark:to-neutral-700",
        "blur-sm -z-10 group-focus-within/search:scale-105 scale-100"
      )} />

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
  );
}
