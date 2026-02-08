import { Inbox, Send, PenTool, RefreshCw, LogOut, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { initiateOAuth, clearTokens } from '@/services/auth';
import type { ViewType } from '@/types/email';

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
  return (
    <aside className="w-64 bg-zinc-900 dark:bg-black border-r border-zinc-800 flex flex-col h-screen shrink-0">
      {/* Header */}
      <div className="p-6">
        <h1 className="text-xl font-bold text-white tracking-tight">AI Mail</h1>
        <p className="text-zinc-500 text-xs mt-1">Intelligent email assistant</p>
      </div>

      {/* Compose Button */}
      <div className="px-4 mb-6">
        <button
          onClick={onCompose}
          className="w-full flex items-center justify-center gap-2.5 py-3 px-4 bg-white hover:bg-zinc-100 text-zinc-900 rounded-xl transition-smooth font-medium shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-black/30"
        >
          <PenTool className="w-4.5 h-4.5" />
          <span>Compose</span>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          const count = item.id === 'inbox' ? unreadCount : 0;

          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={cn(
                'w-full flex items-center justify-between px-4 py-3 rounded-xl mb-1.5 transition-smooth group',
                isActive
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
              )}
            >
              <div className="flex items-center gap-3">
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </div>
              {count > 0 && (
                <span className="bg-blue-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full tabular-nums">
                  {count > 99 ? '99+' : count}
                </span>
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
              'w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-1.5 transition-smooth group',
              'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200',
              isLoading && 'opacity-50 cursor-wait'
            )}
          >
            <RefreshCw className={cn('w-5 h-5', isLoading && 'animate-spin')} />
            <span className="font-medium">{isLoading ? 'Syncing...' : 'Sync'}</span>
          </button>
        )}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-zinc-800">
        <button className="flex items-center gap-3 text-zinc-500 hover:text-zinc-300 transition-smooth w-full px-4 py-3 rounded-xl hover:bg-zinc-800/50 mb-2">
          <Settings className="w-5 h-5" />
          <span className="font-medium">Settings</span>
        </button>

        {!isAuthenticated ? (
          <button
            onClick={() => initiateOAuth()}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white text-zinc-900 hover:bg-zinc-100 rounded-xl transition-smooth font-medium shadow-lg"
          >
            <span>Sign in with Google</span>
          </button>
        ) : (
          <button
            onClick={() => {
              clearTokens();
              window.location.reload();
            }}
            className="flex items-center gap-3 text-zinc-500 hover:text-red-400 hover:bg-zinc-800/50 transition-smooth w-full px-4 py-3 rounded-xl"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sign out</span>
          </button>
        )}
      </div>
    </aside>
  );
}
