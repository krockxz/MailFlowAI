import { useState, useRef, useEffect, useCallback } from 'react';
import { CopilotChat } from '@copilotkit/react-ui';
import { X, Sparkles, AlertCircle, GripVertical, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAppStore } from '@/store';

interface CopilotSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const MIN_WIDTH = 280;
const MAX_WIDTH = 600;
const DEFAULT_WIDTH = 340;

const isCopilotConfigured = !!import.meta.env.VITE_COPILOT_API_KEY;

export function CopilotSidebar({ isOpen, onClose }: CopilotSidebarProps) {
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
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
        className="fixed right-0 top-0 h-full shadow-2xl z-50 flex flex-col glass-elevated border-l border-neutral-200/60 dark:border-neutral-800/60 animate-slide-in-right"
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

        {/* Header with gradient */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200/50 dark:border-neutral-800/50 bg-gradient-to-r from-accent-50/50 to-transparent dark:from-accent-950/30 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative">
              <Avatar className="w-10 h-10 shadow-lg bg-gradient-to-br from-accent-500 to-accent-600 text-white ring-2 ring-accent-500/20">
                <AvatarFallback className="bg-transparent text-white">
                  <Sparkles className="w-5 h-5" />
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-gradient-to-br from-green-400 to-green-500 rounded-full border-2 border-white dark:border-neutral-900" />
            </div>
            <div className="min-w-0">
              <h2 className="font-semibold text-sm text-neutral-900 dark:text-white truncate">AI Assistant</h2>

            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0 ml-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800/50 transition-all duration-200"
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
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-950/50 dark:to-indigo-950/50 flex items-center justify-center mb-4">
                <AlertCircle className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="font-semibold text-neutral-900 dark:text-white mb-2">Authentication Required</h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4 max-w-xs">
                Please sign in with your Google account to access the AI assistant.
              </p>
            </div>
          ) : isCopilotConfigured ? (
            <div className="h-full flex flex-col">
              <CopilotChat
                className="h-full flex-1"
                instructions={`You are an AI email assistant integrated into a mail client. Help users manage emails through natural language.

AVAILABLE ACTIONS (always use these to actually perform actions, don't just describe them):
1. composeEmail(to, subject, body, cc) - Opens compose form and fills it visibly
2. sendEmail(confirm) - Sends the composed email (ONLY if confirm=true, always ask user first)
3. searchEmails(query, sender, days, isUnread) - Searches emails and updates the UI
4. openEmail(latest, sender, subject) - Opens a specific email in detail view
5. replyToEmail(emailId, body) - Opens reply form with the message
6. navigateToView(view) - Switches between 'inbox', 'sent'
7. clearFilters() - Removes all active filters

CONTEXT AWARENESS:
- You can see which email is currently open
- You can see the current view (inbox/sent)
- You can see all inbox and sent emails (first 20)

IMPORTANT BEHAVIORS:
- ALWAYS actually perform actions through tools, don't just describe what would happen
- When composing, the user will see the form fill in real-time
- When searching, the main email list updates to show filtered results
- When asked to reply without specifying which email, use the currently open one
- Always confirm before sending (require explicit user confirmation)
- Be concise and helpful
- Never use emojis in responses`}
                labels={{
                  title: '',
                  initial: 'How can I help with your email today?\n\nTry asking me to:\n• "Send an email to john@example.com"\n• "Show emails from Sarah"\n• "Find emails about the project"\n• "Reply to this email saying I\'ll be there"',
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
                  activityIcon: null,
                  spinnerIcon: null,
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
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-950/50 dark:to-orange-950/50 flex items-center justify-center mb-4">
                <AlertCircle className="w-8 h-8 text-amber-500" />
              </div>
              <h3 className="font-semibold text-neutral-900 dark:text-white mb-2">AI Assistant Not Configured</h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4 max-w-xs">
                Add <code className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-xs">VITE_COPILOT_API_KEY</code> to your .env file to enable AI features.
              </p>
              <a
                href="https://cloud.copilotkit.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-accent-600 hover:text-accent-500 dark:text-accent-400 dark:hover:text-accent-300 underline font-medium transition-colors"
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
