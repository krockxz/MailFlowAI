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

function NavBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  const displayCount = count > 99 ? '99+' : count;
  return (
    <span className="flex items-center justify-center min-w-5 h-5 px-1.5 text-[10px] font-semibold rounded-full bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900">
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
    <aside className="w-60 bg-white dark:bg-neutral-950 border-r border-neutral-200 dark:border-neutral-800 flex flex-col h-screen shrink-0 hidden lg:flex">
      <div className="p-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-neutral-900 dark:bg-white">
          <img src="/brand/logo.png" alt="MailFlowAI" className="w-4.5 h-4.5 rounded object-cover" />
        </div>
        <h1 className="text-sm font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
          MailFlowAI
        </h1>
      </div>

      <div className="px-4 pb-4">
        <Button
          onClick={onCompose}
          className="w-full font-medium text-sm bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-200 dark:text-neutral-900 border-0"
        >
          Compose
        </Button>
      </div>

      <div className="flex-1 px-3 flex flex-col">
        <span className="px-3 pb-2 text-[11px] font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
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
                  'w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                  isActive
                    ? 'bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-white'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 hover:text-neutral-900 dark:hover:text-neutral-200'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className={cn(
                  'w-4 h-4',
                  isActive ? 'text-neutral-700 dark:text-neutral-300' : 'text-neutral-400 dark:text-neutral-500'
                )} />
                <span className="flex-1 text-left">{item.label}</span>
                <NavBadge count={count} />
              </button>
            );
          })}

          <div className="my-3 h-px bg-neutral-200 dark:bg-neutral-800" />

          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                'text-neutral-500 dark:text-neutral-400',
                isLoading
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-neutral-50 dark:hover:bg-neutral-900/50 hover:text-neutral-900 dark:hover:text-neutral-200'
              )}
              aria-label="Sync emails"
            >
              <RefreshCw className={cn(
                'w-4 h-4',
                isLoading ? 'animate-spin' : ''
              )} />
              <span>{isLoading ? 'Syncing...' : 'Sync emails'}</span>
            </button>
          )}
        </nav>
      </div>

      <div className="p-4">
        <Separator className="mb-4 bg-neutral-200 dark:bg-neutral-800" />
        <span className="px-3 pb-2 block text-[11px] font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
          Account
        </span>

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
            className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-neutral-900/50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        )}
      </div>
    </aside>
  );
}
