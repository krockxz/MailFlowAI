import { Inbox, Send, Pen, RefreshCw, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ViewType } from '@/types/email';

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  onCompose: () => void;
  unreadCount: number;
  isLoading?: boolean;
  onRefresh?: () => void;
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
  onRefresh
}: SidebarProps) {
  return (
    <div className="w-64 bg-gray-900 text-white flex flex-col h-screen shrink-0">
      {/* Header */}
      <div className="p-4">
        <h1 className="text-xl font-bold">AI Mail</h1>
        <p className="text-gray-400 text-sm">Powered by AI Assistant</p>
      </div>

      {/* Compose Button */}
      <div className="px-4 mb-4">
        <button
          onClick={onCompose}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 rounded-full transition-colors font-medium"
        >
          <Pen className="w-5 h-5" />
          <span>Compose</span>
        </button>
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
                'w-full flex items-center justify-between px-4 py-3 rounded-lg mb-1 transition-colors',
                isActive ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-800'
              )}
            >
              <div className="flex items-center gap-3">
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </div>
              {count > 0 && (
                <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
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
              'w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors',
              'text-gray-300 hover:bg-gray-800',
              isLoading && 'opacity-50 cursor-wait'
            )}
          >
            <RefreshCw className={cn('w-5 h-5', isLoading && 'animate-spin')} />
            <span>{isLoading ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        )}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800">
        <button className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors">
          <Settings className="w-5 h-5" />
          <span>Settings</span>
        </button>
      </div>
    </div>
  );
}
