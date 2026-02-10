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
    <aside className="w-[240px] bg-neutral-50 dark:bg-neutral-950 border-r border-neutral-200 dark:border-neutral-800 flex flex-col h-screen shrink-0">
      {/* Header */}
      <div className="p-5">
        <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">AI Mail</h1>
        <p className="text-neutral-500 dark:text-neutral-400 text-xs mt-1">Intelligent email assistant</p>
      </div>

      {/* Compose Button */}
      <div className="px-4 mb-5">
        <Button
          onClick={onCompose}
          className="w-full bg-accent-500 hover:bg-accent-600 text-white shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-black/30"
        >

          <span>Compose</span>
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          const count = item.id === 'inbox' ? unreadCount : 0;

          return (
            <Button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              variant={isActive ? "secondary" : "ghost"}
              className={cn(
                'w-full justify-start mb-1.5',
                isActive
                  ? 'bg-neutral-800/50 dark:bg-neutral-800/50 text-neutral-900 dark:text-neutral-100 hover:bg-neutral-800/70 dark:hover:bg-neutral-800/70'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/50 dark:hover:bg-neutral-800/30 hover:text-neutral-900 dark:hover:text-neutral-100'
              )}
            >
              <Icon className="w-5 h-5 mr-3" />
              <span className="font-medium flex-1 text-left">{item.label}</span>
              {count > 0 && (
                <Badge variant="default" className="ml-auto">
                  {count > 99 ? '99+' : count}
                </Badge>
              )}
            </Button>
          );
        })}

        {/* Refresh button */}
        {onRefresh && (
          <Button
            onClick={onRefresh}
            disabled={isLoading}
            variant="ghost"
            className="w-full justify-start mb-1.5 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/50 dark:hover:bg-neutral-800/30 hover:text-neutral-900 dark:hover:text-neutral-100"
          >
            <RefreshCw className={cn('w-5 h-5 mr-3', isLoading && 'animate-spin')} />
            <span className="font-medium">{isLoading ? 'Syncing...' : 'Sync'}</span>
          </Button>
        )}
      </nav>

      {/* Footer */}
      <div className="p-4">
        <Separator className="mb-2 bg-neutral-200 dark:bg-neutral-800" />


        {!isAuthenticated ? (
          <Button
            onClick={() => login()}
            className="w-full bg-white text-neutral-900 hover:bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-100 shadow-lg"
          >
            <span>Sign in with Google</span>
          </Button>
        ) : (
          <Button
            onClick={logout}
            variant="ghost"
            className="w-full justify-start text-neutral-600 dark:text-neutral-400 hover:text-red-400 dark:hover:text-red-400 hover:bg-neutral-200/50 dark:hover:bg-neutral-800/30"
          >
            <LogOut className="w-5 h-5 mr-3" />
            <span className="font-medium">Sign out</span>
          </Button>
        )}
      </div>
    </aside>
  );
}
