import { useState, useCallback, useEffect, useRef } from 'react';
import { X, Sparkles, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { VercelChat } from '@/components/ui/vercel-chat';
import { useAppStore } from '@/store';
import { isAuthenticated as checkAuthStatus } from '@/services/auth';
import { cn } from '@/lib/utils';

interface CopilotSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const MIN_WIDTH = 280;
const MAX_WIDTH = 500;
const DEFAULT_WIDTH = 320;

const isCopilotConfigured = !!import.meta.env.VITE_COPILOT_API_KEY;

export function CopilotSidebar({ isOpen, onClose }: CopilotSidebarProps) {
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
        className="fixed inset-0 bg-black/10 backdrop-blur-sm z-40 lg:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <div
        className="fixed right-0 top-0 h-full shadow-lg z-50 flex flex-col bg-white dark:bg-neutral-950 border-l border-neutral-200 dark:border-neutral-800"
        style={{
          width,
          minWidth: MIN_WIDTH,
          maxWidth: MAX_WIDTH,
          transition: isResizing ? 'none' : 'width 0.2s ease-out',
        }}
        role="dialog"
        aria-modal="true"
        aria-label="AI Assistant"
      >
        {/* Resize handle */}
        <div
          ref={resizeHandleRef}
          onMouseDown={handleMouseDown}
          className={cn(
            "absolute left-0 top-0 bottom-0 w-1.5 cursor-ew-resize hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors",
            isResizing && 'bg-neutral-400 dark:bg-neutral-600'
          )}
          aria-hidden="true"
        >
          <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
            <div className="flex flex-col gap-0.5">
              <div className="w-0.5 h-3 bg-neutral-400 dark:bg-neutral-600" />
              <div className="w-0.5 h-3 bg-neutral-400 dark:bg-neutral-600" />
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-medium">
                <Sparkles className="w-3.5 h-3.5" />
              </AvatarFallback>
            </Avatar>
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
              AI Assistant
            </h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close AI Assistant"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Chat interface */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {!isAuthenticated ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <div className="w-12 h-12 rounded-lg bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center mb-4 border border-neutral-200 dark:border-neutral-800">
                <AlertCircle className="w-6 h-6 text-neutral-400" />
              </div>
              <h3 className="text-sm font-medium text-neutral-900 dark:text-white mb-2">Sign in required</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-500 max-w-[220px]">
                Please sign in with your Google account to access the AI assistant.
              </p>
            </div>
          ) : isCopilotConfigured ? (
            <VercelChat />
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <div className="w-12 h-12 rounded-lg bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center mb-4 border border-neutral-200 dark:border-neutral-800">
                <AlertCircle className="w-6 h-6 text-neutral-400" />
              </div>
              <h3 className="text-sm font-medium text-neutral-900 dark:text-white mb-2">AI not configured</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-500 max-w-[280px]">
                Add <span className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-[10px] font-mono">VITE_COPILOT_API_KEY</span> to your .env file to enable the AI assistant.
              </p>
              <a
                href="https://cloud.copilotkit.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-neutral-900 dark:text-neutral-100 hover:text-neutral-700 dark:hover:text-neutral-300 underline font-medium transition-colors"
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
