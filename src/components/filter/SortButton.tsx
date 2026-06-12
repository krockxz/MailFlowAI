import { ArrowUpDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import type { SortOrder } from '@/types/email';

interface SortButtonProps {
  sortOrder: SortOrder;
  onSortChange: (order: SortOrder) => void;
}

const sortOptions: { value: SortOrder; label: string }[] = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'sender-asc', label: 'By sender (A-Z)' },
  { value: 'subject-asc', label: 'By subject (A-Z)' },
];

export function SortButton({ sortOrder, onSortChange }: SortButtonProps) {
  const currentLabel = sortOptions.find((o) => o.value === sortOrder)?.label || 'Sort';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-9 gap-1.5 px-2.5 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded-lg text-xs"
        >
          <ArrowUpDown className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{currentLabel}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel className="text-xs text-neutral-500 font-normal">Sort by</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {sortOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => onSortChange(option.value)}
            className="gap-2 cursor-pointer text-sm"
          >
            <Check
              className={cn(
                'w-4 h-4',
                sortOrder === option.value ? 'opacity-100' : 'opacity-0'
              )}
            />
            <span>{option.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
