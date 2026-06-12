import { useCallback, useRef, useEffect } from 'react';
import type { FilterState } from '@/types/email';
import { SearchInput } from '@/components/filter/SearchInput';
import { UnreadFilterButton } from '@/components/filter/UnreadFilterButton';
import { AdvancedFilterPopover } from '@/components/filter/AdvancedFilterPopover';

interface FilterBarProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

export function FilterBar({ filters, onFiltersChange }: FilterBarProps) {
  const filtersRef = useRef(filters);
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  const toggleUnread = useCallback(() => {
    onFiltersChange({
      ...filtersRef.current,
      isUnread: filtersRef.current.isUnread === undefined ? true : undefined,
    });
  }, [onFiltersChange]);

  return (
    <div className="px-4 py-3">
      <div className="flex items-center gap-2.5">
        <SearchInput filters={filters} onFiltersChange={onFiltersChange} />
        <UnreadFilterButton isUnread={filters.isUnread} onToggle={toggleUnread} />
        <AdvancedFilterPopover filters={filters} onFiltersChange={onFiltersChange} />
      </div>
    </div>
  );
}
