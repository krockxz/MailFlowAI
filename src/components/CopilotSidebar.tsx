import { CopilotChat } from '@copilotkit/react-ui';
import { X, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store';

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
    <div className={cn(
      'fixed right-0 top-0 h-full w-96 shadow-2xl z-40 flex flex-col transition-transform duration-300 ease-out animate-slide-in-right',
      darkMode ? 'bg-zinc-900 border-l border-zinc-800' : 'bg-white border-l border-zinc-200'
    )}>
      {/* Header */}
      <div className={cn(
        'flex items-center justify-between p-5 border-b',
        darkMode ? 'border-zinc-800 bg-zinc-900/50' : 'border-zinc-200 bg-zinc-50'
      )}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className={cn('font-semibold text-base', darkMode ? 'text-white' : 'text-zinc-900')}>AI Assistant</h2>
            <p className={cn('text-xs', darkMode ? 'text-zinc-500' : 'text-zinc-400')}>Ask me to manage your email</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className={cn(
            'p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-xl transition-smooth',
            darkMode ? 'text-zinc-400 hover:text-white' : 'text-zinc-400 hover:text-zinc-700'
          )}
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
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
      <div className={cn(
        'p-4 border-t',
        darkMode ? 'border-zinc-800 bg-zinc-900/50' : 'border-zinc-200 bg-zinc-50'
      )}>
        <p className={cn('text-xs font-medium mb-3 px-1', darkMode ? 'text-zinc-500' : 'text-zinc-400')}>
          Try saying:
        </p>
        <div className="space-y-1.5">
          {examplePrompts.map((prompt, index) => (
            <button
              key={index}
              className={cn(
                'w-full text-left text-sm px-3 py-2.5 rounded-xl transition-smooth flex items-center gap-2.5',
                darkMode
                  ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-white border border-transparent hover:border-zinc-200 hover:shadow-sm'
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
