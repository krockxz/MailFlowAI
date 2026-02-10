import { useState, useRef, useEffect, useCallback } from 'react';
import { CopilotChat } from '@copilotkit/react-ui';
import { X, Sparkles, AlertCircle, ChevronLeft, ChevronRight, GripVertical, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface CopilotSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const MIN_WIDTH = 280;
const MAX_WIDTH = 600;
const DEFAULT_WIDTH = 320;

const isCopilotConfigured = !!import.meta.env.VITE_COPILOT_API_KEY;

export function CopilotSidebar({ isOpen, onClose }: CopilotSidebarProps) {
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
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
        className="fixed inset-0 bg-black/20 z-40 lg:hidden"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        className="fixed right-0 top-0 h-full shadow-2xl z-50 flex flex-col bg-white dark:bg-neutral-900 border-l border-neutral-200 dark:border-neutral-800"
        style={{
          width: isCollapsed ? 0 : width,
          minWidth: isCollapsed ? 0 : MIN_WIDTH,
          maxWidth: MAX_WIDTH,
          transition: isResizing ? 'none' : 'width 0.2s ease-out',
        }}
      >
        {/* Resize handle */}
        {!isCollapsed && (
          <div
            ref={resizeHandleRef}
            onMouseDown={handleMouseDown}
            className={`absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-accent-500/30 active:bg-accent-500/50 transition-colors z-10 group ${isResizing ? 'bg-accent-500/50' : ''
              }`}
          >
            <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
              <GripVertical className="w-4 h-4 text-neutral-400" />
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className="w-8 h-8 shadow-lg shadow-accent-500/25 bg-gradient-to-br from-accent-500 to-accent-600 text-white shrink-0">
              <AvatarFallback className="bg-transparent text-white">
                <Sparkles className="w-4 h-4" />
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h2 className="font-semibold text-sm text-neutral-900 dark:text-white truncate">AI Assistant</h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">Manage your email with AI</p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0 ml-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="h-8 w-8 min-h-[32px] min-w-[32px]"
              aria-label={isCollapsed ? 'Expand' : 'Collapse'}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 min-h-[32px] min-w-[32px]"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Chat interface */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {isCopilotConfigured ? (
            <div className="h-full flex flex-col">
              <CopilotChat
                className="h-full flex-1"
                instructions="You are an AI email assistant. Help users compose, search, and manage their emails. Always confirm before sending. When composing or searching, actually perform the action through the available tools. Be concise and helpful. Strictly do not use emojis in your responses."
                labels={{
                  title: '',
                  initial: 'How can I help with your email today?',
                  placeholder: 'Ask to compose, search, or manage emails...',
                  error: 'An error occurred. Please try again.',
                  stopGenerating: 'Stop generating',
                  regenerateResponse: 'Regenerate response',
                  copyToClipboard: 'Copy to clipboard',
                  thumbsUp: 'Helpful',
                  thumbsDown: 'Not helpful',
                  copied: 'Copied!',
                }}
                icons={{
                  sendIcon: <Send className="w-4 h-4" />,
                  activityIcon: <Loader2 className="w-4 h-4 animate-spin" />,
                  spinnerIcon: <Loader2 className="w-4 h-4 animate-spin" />,
                  stopIcon: <X className="w-4 h-4" />,
                  openIcon: <Sparkles className="w-4 h-4" />,
                  closeIcon: <X className="w-4 h-4" />,
                  headerCloseIcon: <X className="w-4 h-4" />,
                  copyIcon: null,
                  thumbsUpIcon: null,
                  thumbsDownIcon: null,
                  regenerateIcon: <Loader2 className="w-4 h-4" />,
                  uploadIcon: null,
                  pushToTalkIcon: null,
                }}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <AlertCircle className="w-12 h-12 text-warning mb-4" />
              <h3 className="font-semibold text-neutral-900 dark:text-white mb-2">AI Assistant Not Configured</h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                Add <code className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800">VITE_COPILOT_API_KEY</code> to your .env file to enable AI features.
              </p>
              <a
                href="https://cloud.copilotkit.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-accent-500 hover:text-accent-600 underline"
              >
                Get your free API key
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Collapsed state trigger */}
      {isCollapsed && isOpen && (
        <div
          className="fixed right-0 top-1/2 -translate-y-1/2 bg-white dark:bg-neutral-900 border-l border-y border-neutral-200 dark:border-neutral-800 rounded-l-lg shadow-lg z-50 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
          onClick={() => setIsCollapsed(false)}
        >
          <div className="p-2">
            <ChevronLeft className="w-4 h-4 text-neutral-500" />
          </div>
        </div>
      )}
    </>
  );
}
