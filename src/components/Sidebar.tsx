import { Inbox, Send, RefreshCw, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import type { ViewType } from '@/types/email';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  onCompose: () => void;
  unreadCount: number;
  isLoading?: boolean;
  onRefresh?: () => void;
  isAuthenticated: boolean;
}

const navItems = [
  { id: 'inbox' as const, label: 'Inbox', icon: Inbox },
  { id: 'sent' as const, label: 'Sent', icon: Send },
] as const;

export function Sidebar({
  currentView,
  onViewChange,
  onCompose,
  unreadCount,
  isLoading = false,
  onRefresh,
  isAuthenticated
}: SidebarProps) {
  const { login, logout } = useGoogleAuth();

  return (
    <aside className="w-60 bg-white dark:bg-neutral-950 border-r border-neutral-200 dark:border-neutral-800 flex flex-col h-screen shrink-0">
      {/* Header */}
      <div className="p-4">
        <h1 className="text-sm font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
          Mail
        </h1>
      </div>

      {/* Compose Button */}
      <div className="px-3 mb-4">
        <Button
          onClick={onCompose}
          className="w-full bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100"
        >
          Compose
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          const count = item.id === 'inbox' ? unreadCount : 0;

          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-neutral-100 text-neutral-900 dark:bg-neutral-900 dark:text-white'
                  : 'text-neutral-600 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:bg-neutral-900'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="w-4 h-4" />
              <span className="flex-1 text-left">{item.label}</span>
              {count > 0 && (
                <Badge className="bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                  {count > 99 ? '99+' : count}
                </Badge>
              )}
            </button>
          );
        })}

        {/* Refresh button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className={cn(
              'w-full flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors',
              'text-neutral-500 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:bg-neutral-900',
              isLoading && 'opacity-50'
            )}
            aria-label="Sync emails"
          >
            <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
            <span>{isLoading ? 'Syncing...' : 'Sync'}</span>
          </button>
        )}
      </nav>

      {/* Footer */}
      <div className="p-3">
        <Separator className="mb-3 bg-neutral-200 dark:bg-neutral-800" />

        {!isAuthenticated ? (
          <Button
            onClick={() => login()}
            className="w-full"
            variant="outline"
          >
            Sign in with Google
          </Button>
        ) : (
          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        )}
      </div>
    </aside>
  );
}
