import { useState, useCallback, useEffect, useRef } from 'react';
import { X, Sparkles, AlertCircle } from 'lucide-react';
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
const DEFAULT_WIDTH = 340;

const isAIEnabled = true;

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
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <div
        className={cn(
          "fixed right-0 top-0 h-full z-50 flex flex-col bg-white dark:bg-neutral-950",
          "border-l border-neutral-200 dark:border-neutral-800",
          "transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
        style={{
          width,
          minWidth: MIN_WIDTH,
          maxWidth: MAX_WIDTH,
          transition: isResizing ? 'none' : 'width 0.2s ease-out, transform 0.3s ease-in-out',
        }}
        role="dialog"
        aria-modal="true"
        aria-label="MailFlowAI Assistant"
      >
        {/* Resize handle */}
        <div
          ref={resizeHandleRef}
          onMouseDown={handleMouseDown}
          className={cn(
            "absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize z-10",
            "hover:bg-neutral-300 dark:hover:bg-neutral-600",
            "transition-colors duration-150",
            isResizing && 'bg-neutral-400 dark:bg-neutral-500'
          )}
          aria-hidden="true"
        />

        {/* Header */}
        <div className="shrink-0 border-b border-neutral-200 dark:border-neutral-800 px-4 py-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-neutral-900 dark:bg-white text-white dark:text-neutral-900">
                  <Sparkles className="w-4 h-4" />
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  MailFlowAI
                </h2>
                <p className="text-[10px] text-neutral-500 dark:text-neutral-500">
                  AI Email Assistant
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className={cn(
                "p-1.5 rounded-md text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300",
                "hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              )}
              aria-label="Close MailFlowAI Assistant"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Chat interface */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {!isAuthenticated ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <AlertCircle className="w-8 h-8 text-neutral-400 mb-3" />
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-1.5">Sign in required</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-500 max-w-[240px]">
                Please sign in with your Google account to access the AI assistant.
              </p>
            </div>
          ) : isAIEnabled ? (
            <VercelChat />
          ) : null}
        </div>
      </div>
    </>
  );
}
