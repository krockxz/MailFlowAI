import { CopilotChat } from '@copilotkit/react-ui';
import { X, Sparkles, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface CopilotSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const isCopilotConfigured = !!import.meta.env.VITE_COPILOT_API_KEY;

export function CopilotSidebar({ isOpen, onClose }: CopilotSidebarProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-[320px] shadow-2xl z-40 flex flex-col transition-transform duration-300 ease-out animate-slide-in-right bg-white dark:bg-neutral-900 border-l border-neutral-200 dark:border-neutral-800">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
        <div className="flex items-center gap-3">
          <Avatar className="w-9 h-9 shadow-lg shadow-accent-500/25 bg-gradient-to-br from-accent-500 to-accent-600 text-white">
            <AvatarFallback className="bg-transparent text-white">
              <Sparkles className="w-5 h-5" />
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-semibold text-base text-neutral-900 dark:text-white">AI Assistant</h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Ask me to manage your email</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-9 w-9 min-h-[36px] min-w-[36px]"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Chat interface */}
      <div className="flex-1 overflow-hidden">
        {isCopilotConfigured ? (
          <CopilotChat
            className="h-full"
            instructions="You are an AI email assistant. Help users compose, search, and manage their emails. Always confirm before sending. When composing or searching, actually perform the action through the available tools."
            labels={{
              title: 'AI Mail Assistant',
              initial: 'How can I help you with your email today?',
              placeholder: 'Ask me to compose, search, or manage emails...',
            }}
          />
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
  );
}
