import { Inbox, Send, RefreshCw, LogOut, Sparkles } from 'lucide-react';
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
    <aside className="w-[260px] bg-white/50 dark:bg-neutral-950/50 backdrop-blur-xl border-r border-neutral-200/60 dark:border-neutral-800/60 flex flex-col h-screen shrink-0 mesh-gradient">
      {/* Header with gradient text */}
      <div className="p-6">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center shadow-lg shadow-accent-500/25">
            <Sparkles className="w-4.5 h-4.5 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">
            <span className="text-gradient">AI Mail</span>
          </h1>
        </div>
        <p className="text-neutral-500 dark:text-neutral-400 text-xs pl-[42px] -mt-0.5">Intelligent email assistant</p>
      </div>

      {/* Compose Button with gradient */}
      <div className="px-5 mb-6">
        <Button
          onClick={onCompose}
          className="w-full btn-accent-gradient text-white rounded-xl h-11 font-medium shadow-lg shadow-accent-500/25"
        >
          <span className="relative z-10">Compose</span>
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          const count = item.id === 'inbox' ? unreadCount : 0;

          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-2 transition-all duration-300 group',
                isActive
                  ? 'bg-accent-500 text-white shadow-lg shadow-accent-500/25'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/50 hover:text-neutral-900 dark:hover:text-neutral-100'
              )}
            >
              <Icon className={cn(
                'w-5 h-5 transition-transform duration-300',
                !isActive && 'group-hover:scale-110'
              )} />
              <span className="font-medium flex-1 text-left text-sm">{item.label}</span>
              {count > 0 && (
                <Badge className={cn(
                  'ml-auto text-xs font-semibold',
                  isActive
                    ? 'bg-white/20 text-white hover:bg-white/25 border-0'
                    : 'bg-accent-100 text-accent-700 dark:bg-accent-950 dark:text-accent-300 border-0'
                )}>
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
              'w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-2 transition-all duration-300 group',
              'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/50 hover:text-neutral-700 dark:hover:text-neutral-200',
              isLoading && 'opacity-50 cursor-not-allowed'
            )}
          >
            <RefreshCw className={cn(
              'w-5 h-5 transition-transform duration-500',
              isLoading ? 'animate-spin' : 'group-hover:rotate-180'
            )} />
            <span className="font-medium text-sm">{isLoading ? 'Syncing...' : 'Sync'}</span>
          </button>
        )}
      </nav>

      {/* Footer */}
      <div className="p-5">
        <Separator className="mb-4 bg-neutral-200/60 dark:bg-neutral-800/60" />

        {!isAuthenticated ? (
          <Button
            onClick={() => login()}
            className="w-full bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-xl h-11 font-medium border border-neutral-200/60 dark:border-neutral-700/60 transition-all duration-300"
          >
            <span>Sign in with Google</span>
          </Button>
        ) : (
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-neutral-500 dark:text-neutral-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all duration-300 group"
          >
            <LogOut className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-0.5" />
            <span className="font-medium text-sm">Sign out</span>
          </button>
        )}
      </div>
    </aside>
  );
}
