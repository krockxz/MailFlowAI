import { Inbox, Send, RefreshCw, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import type { ViewType } from '@/types/email';
import { Button } from '@/components/ui/button';
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

// Premium badge with custom styling for better contrast
function NavBadge({ count, isActive }: { count: number; isActive: boolean }) {
  const displayCount = count > 99 ? '99+' : count;

  return (
    <span
      className={cn(
        'flex items-center justify-center min-w-5 h-5 px-1.5 text-xs font-bold rounded-full transition-all duration-200',
        isActive
          ? 'bg-accent-600 text-white shadow-sm shadow-accent-600/30'
          : 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
      )}
    >
      {displayCount}
    </span>
  );
}

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
      {/* Header with gradient logo background */}
      <div className="p-4 flex items-center gap-3">
        <div className="relative w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-accent-600 to-accent-500 shadow-lg shadow-accent-600/20 ring-1 ring-accent-600/10">
          <img src="/brand/logo.png" alt="MailFlowAI Logo" className="w-5 h-5 rounded-md object-cover" />
        </div>
        <h1 className="text-base font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
          MailFlowAI
        </h1>
      </div>

      {/* Compose Button with gradient and shadow */}
      <div className="px-4 pb-5">
        <Button
          onClick={onCompose}
          className={cn(
            'w-full font-medium shadow-lg shadow-accent-600/25 hover:shadow-xl hover:shadow-accent-600/30',
            'bg-gradient-to-r from-accent-600 to-accent-500',
            'hover:from-accent-700 hover:to-accent-600',
            'text-white border-0',
            'dark:from-accent-500 dark:to-accent-400',
            'dark:hover:from-accent-600 dark:hover:to-accent-500'
          )}
        >
          Compose
        </Button>
      </div>

      {/* Navigation Section with visual separation */}
      <div className="flex-1 px-3 flex flex-col">
        {/* Section Label */}
        <span className="px-3 pb-2 text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
          Folders
        </span>

        <nav className="space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            const count = item.id === 'inbox' ? unreadCount : 0;

            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={cn(
                  'group relative w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200',
                  'before:absolute before:inset-0 before:rounded-lg before:opacity-0 before:transition-opacity before:duration-200',
                  isActive
                    ? 'bg-accent-50 text-accent-700 dark:bg-accent-950/50 dark:text-accent-400 shadow-sm before:bg-accent-600/5'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-900/50 hover:scale-[1.02] hover:text-neutral-900 dark:hover:text-neutral-200'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className={cn(
                  'w-4 h-4 transition-colors duration-200',
                  isActive ? 'text-accent-600 dark:text-accent-400' : 'text-neutral-500 dark:text-neutral-500 group-hover:text-neutral-700 dark:group-hover:text-neutral-300'
                )} />
                <span className="flex-1 text-left">{item.label}</span>
                {count > 0 && <NavBadge count={count} isActive={isActive} />}
              </button>
            );
          })}

          {/* Divider before actions */}
          <div className="my-3 h-px bg-neutral-200 dark:bg-neutral-800" />

          {/* Sync action */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className={cn(
                'group w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200',
                'text-neutral-500 dark:text-neutral-400 hover:scale-[1.02]',
                isLoading
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-neutral-100 dark:hover:bg-neutral-900/50 hover:text-neutral-900 dark:hover:text-neutral-200'
              )}
              aria-label="Sync emails"
            >
              <RefreshCw className={cn(
                'w-4 h-4 transition-colors duration-200',
                isLoading ? 'animate-spin text-neutral-400' : 'group-hover:text-neutral-700 dark:group-hover:text-neutral-300'
              )} />
              <span>{isLoading ? 'Syncing...' : 'Sync emails'}</span>
            </button>
          )}
        </nav>
      </div>

      {/* Footer with account section */}
      <div className="p-4">
        <Separator className="mb-4 bg-neutral-200 dark:bg-neutral-800" />

        {/* Section Label */}
        <span className="px-3 pb-2 block text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
          Account
        </span>

        {!isAuthenticated ? (
          <Button
            onClick={() => login()}
            className="w-full hover:bg-neutral-50 dark:hover:bg-neutral-900"
            variant="outline"
          >
            Sign in with Google
          </Button>
        ) : (
          <button
            onClick={() => logout()}
            className="group w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900/50 rounded-lg transition-all duration-200 hover:scale-[1.02]"
          >
            <LogOut className="w-4 h-4 transition-colors duration-200 group-hover:text-neutral-700 dark:group-hover:text-neutral-300" />
            Sign out
          </button>
        )}
      </div>
    </aside>
  );
}
