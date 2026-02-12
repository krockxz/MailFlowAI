import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Sparkles, AlertCircle, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { VercelChat } from '@/components/ui/vercel-chat';
import { useAppStore } from '@/store';
import { isAuthenticated as checkAuthStatus } from '@/services/auth';

interface CopilotSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const MIN_WIDTH = 280;
const MAX_WIDTH = 600;
const DEFAULT_WIDTH = 340;

const isCopilotConfigured = !!import.meta.env.VITE_COPILOT_API_KEY;

export function CopilotSidebar({ isOpen, onClose }: CopilotSidebarProps) {
  // Use both store state and direct auth check for reliability
  const storeAuthState = useAppStore((state) => state.isAuthenticated);
  const isAuthenticated = storeAuthState || checkAuthStatus();
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const resizeHandleRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const newWidth = window.innerWidth - e.clientX;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop overlay for mobile */}
      <div
        className="fixed inset-0 bg-black/10 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        className="fixed right-0 top-0 h-full shadow-2xl z-50 flex flex-col bg-white dark:bg-neutral-950 border-l border-neutral-200/60 dark:border-neutral-800/60"
        style={{
          width,
          minWidth: MIN_WIDTH,
          maxWidth: MAX_WIDTH,
          transition: isResizing ? 'none' : 'width 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Resize handle */}
        <div
          ref={resizeHandleRef}
          onMouseDown={handleMouseDown}
          className={`absolute left-0 top-0 bottom-0 w-1.5 cursor-ew-resize hover:bg-accent-500/20 active:bg-accent-500/30 transition-all duration-200 z-10 group ${isResizing ? 'bg-accent-500/30' : ''
            }`}
        >
          <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
            <GripVertical className="w-4 h-4 text-neutral-400" />
          </div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200/50 dark:border-neutral-800/50 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative">
              <Avatar className="w-9 h-9 shadow-sm bg-gradient-to-br from-accent-500 to-accent-600 text-white">
                <AvatarFallback className="bg-transparent text-white">
                  <Sparkles className="w-4 h-4" />
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-neutral-900" />
            </div>
            <div className="min-w-0">
              <h2 className="font-semibold text-sm text-neutral-900 dark:text-white tracking-tight">AI Assistant</h2>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0 ml-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800/50 transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Chat interface */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {!isAuthenticated ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center mb-4 border border-neutral-200/60 dark:border-neutral-800/60">
                <AlertCircle className="w-6 h-6 text-neutral-400" />
              </div>
              <h3 className="font-medium text-sm text-neutral-900 dark:text-white mb-2">Sign in required</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-500 max-w-[220px]">
                Please sign in with your Google account to access the AI assistant.
              </p>
            </div>
          ) : isCopilotConfigured ? (
            <VercelChat />
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center mb-4 border border-neutral-200/60 dark:border-neutral-800/60">
                <AlertCircle className="w-6 h-6 text-neutral-400" />
              </div>
              <h3 className="font-medium text-sm text-neutral-900 dark:text-white mb-2">AI not configured</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-500 max-w-[280px]">
                Add <span className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-[10px] font-mono">VITE_COPILOT_API_KEY</span> to your .env file to enable the AI assistant.
              </p>
              <a
                href="https://cloud.copilotkit.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-accent-600 hover:text-accent-500 dark:text-accent-400 dark:hover:text-accent-300 underline font-medium transition-colors"
              >
                Get your free API key
              </a>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
