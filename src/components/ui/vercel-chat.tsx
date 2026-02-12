import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Loader2, X, Sparkles, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCopilotChatHeadless_c } from '@copilotkit/react-core';

interface VercelChatProps {
  instructions?: string;
  placeholder?: string;
  className?: string;
}

const DEFAULT_INSTRUCTIONS = `You are an AI email assistant integrated into a mail client. Help users manage emails through natural language.

Be concise and helpful. Never use emojis in responses.`;

export function VercelChat({
  instructions = DEFAULT_INSTRUCTIONS,
  placeholder = 'Ask to compose, search, or manage emails...',
  className,
}: VercelChatProps) {
  // Wrap CopilotKit hook in try-catch for graceful degradation
  let copilotHook;
  try {
    copilotHook = useCopilotChatHeadless_c({
      makeSystemMessage: () => instructions,
    });
  } catch (error) {
    console.error('CopilotKit hook error:', error);
    // Return degraded UI if hook fails
    return (
      <div className="flex flex-col h-full bg-white dark:bg-neutral-950 p-6">
        <div className="flex flex-col items-center justify-center h-full text-center">
          <div className="w-14 h-14 rounded-2xl bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center mb-4 border border-neutral-200/60 dark:border-neutral-800/60">
            <AlertCircle className="w-6 h-6 text-neutral-400" />
          </div>
          <h3 className="font-medium text-sm text-neutral-900 dark:text-white mb-2">AI Assistant unavailable</h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-500 max-w-[280px]">
            The AI assistant encountered an error. Please refresh the page or try again later.
          </p>
        </div>
      </div>
    );
  }

  const { messages, sendMessage, isLoading, reset } = copilotHook;

  const [input, setInput] = useState('');
  const [inputHeight, setInputHeight] = useState(44);
  const [sendError, setSendError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(true);

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? 'smooth' : 'auto',
    });
  }, []);

  useEffect(() => {
    if (isScrolledToBottom) {
      scrollToBottom();
    }
  }, [messages, isScrolledToBottom, scrollToBottom]);

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
      setIsScrolledToBottom(isAtBottom);
    };

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);

    const target = e.target;
    target.style.height = '44px';
    const newHeight = Math.min(200, Math.max(44, target.scrollHeight));
    target.style.height = `${newHeight}px`;
    setInputHeight(newHeight);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    setInput('');
    setInputHeight(44);
    if (textareaRef.current) {
      textareaRef.current.style.height = '44px';
    }

    setSendError(null);

    try {
      await sendMessage({
        id: Date.now().toString(),
        role: 'user',
        content: trimmed,
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      setSendError(error instanceof Error ? error.message : 'Failed to send message');
      // Restore input on error so user can retry
      setInput(trimmed);
    }
  };

  const formatMessageContent = (content: string) => {
    return content
      .replace(/\n/g, '<br />')
      .replace(/• /g, '<span class="inline-block w-1.5 h-1.5 bg-current rounded-full mr-2 opacity-50"></span>')
      .replace(/"([^"]+)"/g, '"<span class="font-mono text-accent-600 dark:text-accent-400">$1</span>"');
  };

  const showWelcome = messages.length === 0;

  const renderMessage = (msg: any, index: number) => {
    const role = msg.role;
    const content = msg.content ?? '';

    if (!content || typeof content !== 'string') {
      return null;
    }

    const isUser = role === 'user';
    const isAssistant = role === 'assistant';

    if (!isUser && !isAssistant) {
      return null;
    }

    return (
      <div
        key={msg.id}
        className={cn(
          'flex gap-3 animate-fade-in',
          isUser ? 'justify-end' : 'justify-start'
        )}
        style={{ animationDelay: `${index * 30}ms` }}
      >
        {!isUser && (
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center shadow-sm">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
        )}

        <div
          className={cn(
            'max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
            isUser
              ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-tr-sm'
              : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded-tl-sm border border-neutral-200/60 dark:border-neutral-800/60'
          )}
        >
          <div
            className="whitespace-pre-wrap break-words"
            dangerouslySetInnerHTML={{ __html: formatMessageContent(content) }}
          />
        </div>

        {isUser && (
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-neutral-900 dark:bg-white flex items-center justify-center shadow-sm">
            <span className="text-white dark:text-neutral-900 text-xs font-medium">You</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={cn('flex flex-col h-full bg-white dark:bg-neutral-950', className)}>
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-6"
        style={{ scrollbarWidth: 'thin', scrollbarColor: 'hsl(var(--muted-foreground)) transparent' }}
      >
        <div className="max-w-full space-y-5">
          {showWelcome && (
            <div className="flex gap-3 justify-start animate-fade-in">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center shadow-sm">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="max-w-[85%] rounded-2xl rounded-tl-sm px-4 py-3 bg-neutral-50/80 dark:bg-neutral-900/50 border border-neutral-200/60 dark:border-neutral-800/60 text-sm backdrop-blur-sm">
                <p className="font-medium text-neutral-900 dark:text-neutral-100 mb-3">How can I help with your email today?</p>
                <div className="space-y-2 text-neutral-600 dark:text-neutral-400 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-1 h-1 bg-neutral-400 rounded-full shrink-0" />
                    <span>"Send an email to <span className="font-mono text-accent-600 dark:text-accent-400">john@example.com</span>"</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1 h-1 bg-neutral-400 rounded-full shrink-0" />
                    <span>"Show emails from Sarah"</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1 h-1 bg-neutral-400 rounded-full shrink-0" />
                    <span>"Find emails about the project"</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1 h-1 bg-neutral-400 rounded-full shrink-0" />
                    <span>"Reply saying I'll be there"</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {messages.map(renderMessage)}

          {sendError && (
            <div className="flex gap-3 justify-start animate-fade-in">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/50 flex items-center justify-center shadow-sm">
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
              </div>
              <div className="max-w-[85%] rounded-2xl rounded-tl-sm px-4 py-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-sm">
                <p className="text-red-800 dark:text-red-300">Failed to send message. Please try again.</p>
              </div>
            </div>
          )}

          {isLoading && (
            <div className="flex gap-3 justify-start animate-fade-in">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center shadow-sm">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="bg-neutral-100 dark:bg-neutral-900 rounded-2xl rounded-tl-sm px-4 py-2.5 border border-neutral-200/60 dark:border-neutral-800/60">
                <div className="flex items-center gap-1.5 h-5">
                  <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-[pulse_1.2s_ease-in-out_infinite]" />
                  <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-[pulse_1.2s_ease-in-out_0.15s_infinite]" />
                  <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-[pulse_1.2s_ease-in-out_0.3s_infinite]" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="border-t border-neutral-200/60 dark:border-neutral-800/60 p-4">
        <div className="flex items-end gap-3">
          <div className="flex-1 relative group">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              rows={1}
              disabled={isLoading}
              className={cn(
                'w-full resize-none rounded-xl px-4 py-3 text-sm',
                'bg-neutral-100 dark:bg-neutral-900/50',
                'border border-neutral-200/60 dark:border-neutral-800/60',
                'text-neutral-900 dark:text-neutral-100',
                'placeholder:text-neutral-400 dark:placeholder:text-neutral-600',
                'focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500/60 focus:bg-white dark:focus:bg-neutral-950',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'transition-all duration-200',
                'shadow-inner shadow-neutral-200/50 dark:shadow-neutral-800/50'
              )}
              style={{ height: `${inputHeight}px`, fontFamily: 'inherit' }}
            />
          </div>

          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={cn(
              'flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200',
              'border border-transparent',
              input.trim() && !isLoading
                ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-md hover:shadow-lg hover:scale-105 active:scale-95'
                : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-400 dark:text-neutral-600 cursor-not-allowed'
            )}
            aria-label="Send message"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>

        {messages.length > 0 && (
          <button
            onClick={reset}
            className="mt-3 text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors flex items-center gap-1.5"
          >
            <X className="w-3 h-3" />
            Clear chat
          </button>
        )}
      </div>
    </div>
  );
}
