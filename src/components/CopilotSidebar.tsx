import { CopilotChat } from '@copilotkit/react-ui';

interface CopilotSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CopilotSidebar({ isOpen, onClose }: CopilotSidebarProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-white border-l border-gray-200 shadow-xl z-40 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div>
          <h2 className="font-semibold text-gray-900">AI Assistant</h2>
          <p className="text-xs text-gray-500">Ask me to manage your email</p>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          aria-label="Close"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
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
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <p className="text-xs text-gray-500 mb-2">Try saying:</p>
        <div className="space-y-1">
          <button className="w-full text-left text-sm text-blue-600 hover:text-blue-800 px-2 py-1 hover:bg-blue-50 rounded">
            "Send an email to john@example.com"
          </button>
          <button className="w-full text-left text-sm text-blue-600 hover:text-blue-800 px-2 py-1 hover:bg-blue-50 rounded">
            "Show emails from last week"
          </button>
          <button className="w-full text-left text-sm text-blue-600 hover:text-blue-800 px-2 py-1 hover:bg-blue-50 rounded">
            "Open the latest email"
          </button>
        </div>
      </div>
    </div>
  );
}
