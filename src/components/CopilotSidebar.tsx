import { CopilotChat } from '@copilotkit/react-ui';
import { X, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface CopilotSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const examplePrompts = [
  { text: 'Send an email to john@example.com', icon: '✉️' },
  { text: 'Show emails from last week', icon: '📅' },
  { text: 'Open the latest unread email', icon: '📬' },
];

export function CopilotSidebar({ isOpen, onClose }: CopilotSidebarProps) {
  const darkMode = useAppStore((state) => state.darkMode);

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
        <CopilotChat
          className="h-full"
          instructions="You are an AI email assistant. Help users compose, search, and manage their emails. Always confirm before sending. When composing or searching, actually perform the action through the available tools."
          labels={{
            title: 'AI Mail Assistant',
            initial: 'How can I help you with your email today?',
            placeholder: 'Ask me to compose, search, or manage emails...',
          }}
        />
      </div>

      {/* Footer with example prompts */}
      <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
        <p className="text-xs font-medium mb-3 px-1 text-neutral-500 dark:text-neutral-400">
          Try saying:
        </p>
        <div className="space-y-1.5">
          {examplePrompts.map((prompt, index) => (
            <button
              key={index}
              className={cn(
                'w-full text-left text-sm px-4 py-3 rounded-xl transition-all duration-200 flex items-center gap-2.5 min-h-[44px]',
                darkMode
                  ? 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-white border border-transparent hover:border-neutral-200 hover:shadow-sm'
              )}
            >
              <span className="text-base">{prompt.icon}</span>
              <span className="truncate">"{prompt.text}"</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
