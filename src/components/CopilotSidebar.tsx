import { useState, useCallback, useEffect, useRef } from 'react';
import { X, Sparkles, AlertCircle, ChevronLeft, GripVertical } from 'lucide-react';
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
const DEFAULT_WIDTH = 340;

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
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <div
        className={cn(
          "fixed right-0 top-0 h-full shadow-xl z-50 flex flex-col bg-white dark:bg-neutral-950",
          "border-l border-neutral-200/60 dark:border-neutral-800/60",
          "transition-all duration-300 ease-in-out",
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
            "absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize z-10",
            "hover:bg-gradient-to-r hover:from-violet-300/40 hover:to-transparent",
            "dark:hover:from-violet-700/30 dark:hover:to-transparent",
            "transition-all duration-200",
            "group",
            isResizing && 'bg-gradient-to-r from-violet-400/50 to-transparent dark:from-violet-600/40'
          )}
          aria-hidden="true"
        >
          {/* Visible drag indicator - centered */}
          <div className={cn(
            "absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2",
            "opacity-0 group-hover:opacity-100 transition-opacity duration-200",
            "pointer-events-none flex flex-col gap-0.5"
          )}>
            <div className="w-0.5 h-3.5 bg-neutral-400 dark:bg-neutral-600 rounded-full shadow-sm" />
            <div className="w-0.5 h-3.5 bg-neutral-400 dark:bg-neutral-600 rounded-full shadow-sm" />
          </div>
          {/* Subtle left border glow */}
          <div className={cn(
            "absolute left-0 top-0 bottom-0 w-px",
            "bg-gradient-to-b from-transparent via-violet-400/30 to-transparent",
            "opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          )} />
        </div>

        {/* Gradient Header */}
        <div className="relative shrink-0 overflow-hidden">
          {/* Multi-layer gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-violet-700 to-indigo-800" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_100%_at_50%_0%,rgba(255,255,255,0.15),transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_20%_100%,rgba(120,80,255,0.3),transparent_50%)]" />

          {/* Animated glow effects */}
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-violet-400/30 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '3s' }} />
          <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-indigo-400/25 rounded-full blur-2xl animate-pulse" style={{ animationDuration: '4s', animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/3 w-20 h-20 bg-purple-400/20 rounded-full blur-2xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '0.5s' }} />

          {/* Subtle grid overlay */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: `linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)`,
            backgroundSize: '20px 20px'
          }} />

          {/* Header content */}
          <div className="relative flex items-center justify-between px-4 py-4">
            <div className="flex items-center gap-3 min-w-0">
              {/* Avatar with enhanced glow */}
              <div className="relative">
                <div className="absolute inset-0 bg-white/30 rounded-full blur-md" />
                <div className="absolute inset-0 bg-gradient-to-br from-violet-300/40 to-indigo-400/40 rounded-full blur-sm" />
                <Avatar className="w-10 h-10 relative ring-2 ring-white/30 shadow-lg">
                  <AvatarFallback className="bg-gradient-to-br from-white to-violet-50 text-violet-700 text-sm font-semibold">
                    <Sparkles className="w-4.5 h-4.5" />
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-bold text-white tracking-tight drop-shadow-sm">
                  MailFlowAI
                </h2>
                <p className="text-[10px] text-violet-200 font-medium tracking-wide uppercase opacity-90">AI Email Assistant</p>
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              className={cn(
                "flex-shrink-0 p-2 rounded-xl",
                "text-white/80 hover:text-white hover:bg-white/15",
                "transition-all duration-200",
                "focus:outline-none focus:ring-2 focus:ring-white/30 focus:bg-white/20",
                "active:scale-95"
              )}
              aria-label="Close MailFlowAI Assistant"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Decorative bottom border with glow */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/3 h-px bg-white/30 blur-sm" />
        </div>

        {/* Chat interface */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0 bg-gradient-to-b from-neutral-50/50 to-transparent dark:from-neutral-950">
          {!isAuthenticated ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <div className="relative mb-5">
                <div className="absolute inset-0 bg-violet-500/10 rounded-2xl blur-xl" />
                <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-100 to-violet-50 dark:from-violet-900/30 dark:to-violet-950 flex items-center justify-center border border-violet-200/50 dark:border-violet-800/50">
                  <AlertCircle className="w-7 h-7 text-violet-600 dark:text-violet-400" />
                </div>
              </div>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-2">Sign in required</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-500 max-w-[240px] leading-relaxed">
                Please sign in with your Google account to access the AI assistant.
              </p>
            </div>
          ) : isCopilotConfigured ? (
            <VercelChat />
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <div className="relative mb-5">
                <div className="absolute inset-0 bg-violet-500/10 rounded-2xl blur-xl" />
                <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-100 to-violet-50 dark:from-violet-900/30 dark:to-violet-950 flex items-center justify-center border border-violet-200/50 dark:border-violet-800/50">
                  <AlertCircle className="w-7 h-7 text-violet-600 dark:text-violet-400" />
                </div>
              </div>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-2">AI not configured</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-500 max-w-[280px] mb-3 leading-relaxed">
                Add <span className="px-2 py-0.5 rounded-md bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 text-[10px] font-mono font-medium border border-violet-200/50 dark:border-violet-800/50">VITE_COPILOT_API_KEY</span> to your .env file to enable the AI assistant.
              </p>
              <a
                href="https://cloud.copilotkit.ai"
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium",
                  "bg-violet-600 text-white hover:bg-violet-700",
                  "transition-all duration-200",
                  "hover:shadow-lg hover:shadow-violet-500/25",
                  "focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
                )}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Get your free API key
              </a>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
