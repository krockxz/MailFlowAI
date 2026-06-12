import { Moon, Sun, RefreshCw, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ViewType } from '@/types/email';
import type { FilterState } from '@/types/email';
import { Button } from '@/components/ui/button';
import { FilterBar } from '@/components/FilterBar';

interface AppHeaderProps {
  currentView: ViewType;
  isCopilotOpen: boolean;
  isSyncing: boolean;
  darkMode: boolean;
  onToggleCopilot: () => void;
  onToggleDarkMode: () => void;
  onSync: () => void;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

export function AppHeader({
  currentView,
  isCopilotOpen,
  isSyncing,
  darkMode,
  onToggleCopilot,
  onToggleDarkMode,
  onSync,
  filters,
  onFiltersChange,
}: AppHeaderProps) {
  return (
    <header className={cn(
      "glass-header-enhanced border-b border-neutral-200/60 dark:border-neutral-800/60 relative z-20",
      "transition-all duration-300 ease-in-out"
    )}>
      <div className="flex items-center px-5 lg:px-6 py-3 gap-3 lg:gap-4">
        <div className={cn(
          "shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold",
          "bg-neutral-100/80 dark:bg-neutral-900/80",
          "border border-neutral-200/60 dark:border-neutral-700/60",
          "text-neutral-700 dark:text-neutral-300",
          "transition-all duration-200"
        )}>
          <div className={cn(
            "w-2 h-2 rounded-full transition-colors duration-300",
            currentView === 'inbox' ? 'bg-accent-500 shadow-sm shadow-accent-500/40' : 'bg-neutral-400 dark:bg-neutral-600'
          )} />
          <span className="capitalize">{currentView}</span>
        </div>

        <div className="flex-1 min-w-0 transition-all duration-200 ease-in-out">
          <FilterBar
            filters={filters}
            onFiltersChange={onFiltersChange}
          />
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={onSync}
            disabled={isSyncing}
            aria-label="Sync emails"
            className={cn(
              "relative h-9 w-9 rounded-lg",
              "transition-all duration-200",
              "hover:bg-neutral-100 dark:hover:bg-neutral-900",
              isSyncing && "text-accent-600 dark:text-accent-400"
            )}
          >
            <RefreshCw className={cn(
              "w-4 h-4 transition-transform duration-500",
              isSyncing && "animate-spin"
            )} />
            {isSyncing && (
              <div className="absolute inset-0 rounded-lg bg-accent-500/10 animate-pulse" />
            )}
          </Button>

          <div className="w-px h-5 bg-neutral-200 dark:bg-neutral-800 mx-1" />

          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCopilot}
            aria-label={isCopilotOpen ? 'Close AI Assistant' : 'Open AI Assistant'}
            className={cn(
              "relative h-9 w-9 rounded-lg transition-all duration-200",
              "hover:bg-neutral-100 dark:hover:bg-neutral-900",
              isCopilotOpen && "bg-accent-50 dark:bg-accent-950/50 text-accent-700 dark:text-accent-400"
            )}
          >
            <Sparkles className={cn(
              "w-4 h-4 transition-all duration-300",
              isCopilotOpen && "fill-current"
            )} />
            {isCopilotOpen && (
              <div className="absolute inset-0 rounded-lg bg-accent-500/5" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleDarkMode}
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            className="h-9 w-9 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-all duration-200"
          >
            <div className="relative transition-all duration-300">
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </div>
          </Button>
        </div>
      </div>
    </header>
  );
}
