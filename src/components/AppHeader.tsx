import { Moon, Sun, RefreshCw, Mail } from 'lucide-react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import type { ViewType, FilterState, SortOrder } from '@/types/email';
import { Button } from '@/components/ui/button';
import { FilterBar } from '@/components/FilterBar';

interface AppHeaderProps {
  currentView: ViewType;
  isCopilotOpen: boolean;
  isSyncing: boolean;
  onToggleCopilot: () => void;
  onSync: () => void;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  sortOrder: SortOrder;
  onSortChange: (order: SortOrder) => void;
}

export function AppHeader({
  isCopilotOpen: _copilot,
  isSyncing,
  onToggleCopilot,
  onSync,
  filters,
  onFiltersChange,
  sortOrder,
  onSortChange,
}: AppHeaderProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  return (
    <header className="border-b border-neutral-200 dark:border-neutral-800 relative z-20 bg-white dark:bg-neutral-950">
      <div className="flex items-center px-4 lg:px-5 py-2.5 gap-3 lg:gap-4">
        <div className="flex-1 min-w-0">
          <FilterBar
            filters={filters}
            onFiltersChange={onFiltersChange}
            sortOrder={sortOrder}
            onSortChange={onSortChange}
          />
        </div>

        <div className="flex items-center gap-0.5 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={onSync}
            disabled={isSyncing}
            aria-label="Sync emails"
            className="h-8 w-8 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-900"
          >
            <RefreshCw className={cn(
              "w-4 h-4",
              isSyncing && "animate-spin"
            )} />
          </Button>

          <div className="w-px h-4 bg-neutral-200 dark:bg-neutral-800 mx-0.5" />

          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCopilot}
            aria-label="Toggle AI Assistant"
            className="h-8 w-8 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-900"
          >
            <Mail className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="h-8 w-8 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-900"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </header>
  );
}
