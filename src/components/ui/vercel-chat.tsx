import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { Send, Loader2, X, Sparkles, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCopilotChatHeadless_c as useCopilotChatHeadless } from '@copilotkit/react-core';
import { Streamdown } from 'streamdown';

interface VercelChatProps {
  instructions?: string;
  placeholder?: string;
  className?: string;
}

const DEFAULT_INSTRUCTIONS = `You are an AI email assistant integrated into a mail client. Help users manage emails through natural language.

Be concise and helpful. Never use emojis in responses.`;

// Custom components for Streamdown styling - Vercel minimal style
const streamdownComponents = {
  h1: ({ children, ...props }: any) => (
    <h1 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mt-4 mb-2" {...props}>{children}</h1>
  ),
  h2: ({ children, ...props }: any) => (
    <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mt-3 mb-2" {...props}>{children}</h2>
  ),
  h3: ({ children, ...props }: any) => (
    <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mt-2 mb-1" {...props}>{children}</h3>
  ),
  p: ({ children, ...props }: any) => (
    <p className="my-1.5 text-sm text-neutral-700 dark:text-neutral-300" {...props}>{children}</p>
  ),
  strong: ({ children, ...props }: any) => (
    <strong className="font-semibold text-neutral-900 dark:text-neutral-100" {...props}>{children}</strong>
  ),
  em: ({ children, ...props }: any) => (
    <em className="italic text-neutral-800 dark:text-neutral-200" {...props}>{children}</em>
  ),
  code: ({ children, className, ...props }: any) => {
    // Inline code (no className) vs code block (has className)
    if (className) {
      return (
        <code className={cn("text-xs font-mono bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 my-2 block overflow-x-auto text-neutral-800 dark:text-neutral-200", className)} {...props}>
          {children}
        </code>
      );
    }
    return (
      <code className="text-xs font-mono bg-neutral-100 dark:bg-neutral-800 px-1 py-0.5 text-neutral-800 dark:text-neutral-200" {...props}>
        {children}
      </code>
    );
  },
  a: ({ href, children, ...props }: any) => (
    <a
      href={href}
      className="text-neutral-900 dark:text-neutral-100 hover:underline"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    >
      {children}
    </a>
  ),
  ul: ({ children, ...props }: any) => (
    <ul className="my-1.5 space-y-0.5" {...props}>{children}</ul>
  ),
  ol: ({ children, ...props }: any) => (
    <ol className="my-1.5 space-y-0.5" {...props}>{children}</ol>
  ),
  li: ({ children, ...props }: any) => (
    <li className="text-sm text-neutral-700 dark:text-neutral-300" {...props}>{children}</li>
  ),
  blockquote: ({ children, ...props }: any) => (
    <blockquote className="border-l-2 border-neutral-300 dark:border-neutral-700 pl-3 text-neutral-600 dark:text-neutral-400 my-2" {...props}>
      {children}
    </blockquote>
  ),
  hr: (props: any) => (
    <hr className="my-3 border-neutral-200 dark:border-neutral-800" {...props} />
  ),
  del: ({ children, ...props }: any) => (
    <del className="line-through text-neutral-500" {...props}>{children}</del>
  ),
};

export const VercelChat = memo(function VercelChatInternal({
  instructions = DEFAULT_INSTRUCTIONS,
  placeholder = 'Ask to compose, search, or manage emails...',
  className,
}: VercelChatProps) {
  // Wrap CopilotKit hook in try-catch for graceful degradation
  let copilotHook;
  try {
    copilotHook = useCopilotChatHeadless({
      makeSystemMessage: () => instructions,
    });
  } catch (error) {
    console.error('CopilotKit hook error:', error);
    return (
      <div className="flex flex-col h-full bg-white dark:bg-neutral-950 p-6">
        <div className="flex flex-col items-center justify-center h-full text-center">
          <div className="w-12 h-12 rounded-lg bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center mb-4 border border-neutral-200 dark:border-neutral-800">
            <AlertCircle className="w-6 h-6 text-neutral-400" />
          </div>
          <h3 className="text-sm font-medium text-neutral-900 dark:text-white mb-2">AI Assistant unavailable</h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-500 max-w-[280px]">
            The AI assistant encountered an error. Please refresh the page or try again later.
          </p>
        </div>
      </div>
    );
  }

  const { messages, sendMessage, isLoading, reset } = copilotHook;

  const [input, setInput] = useState('');
  const [inputHeight, setInputHeight] = useState(40);
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

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const target = e.target;
    setInput(target.value);

    // Auto-resize textarea
    target.style.height = '40px';
    const newHeight = Math.min(150, Math.max(40, target.scrollHeight));
    target.style.height = `${newHeight}px`;
    setInputHeight(newHeight);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, []);

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    setInput('');
    setInputHeight(40);
    if (textareaRef.current) {
      textareaRef.current.style.height = '40px';
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
      setInput(trimmed);
    }
  }, [input, isLoading, sendMessage]);

  const showWelcome = messages.length === 0;

  const renderMessage = useCallback((msg: any, _index: number) => {
    const role = msg.role;

    // Handle different content formats from CopilotKit
    let content = '';
    if (typeof msg.content === 'string') {
      content = msg.content;
    } else if (Array.isArray(msg.content)) {
      const textParts = msg.content.filter((part: any) => part.type === 'text');
      content = textParts.map((part: any) => part.text).join('');
    } else {
      content = String(msg.content ?? '');
    }

    if (!content) {
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
          'flex gap-3 mb-4',
          isUser ? 'justify-end' : 'justify-start'
        )}
      >
        {!isUser && (
          <div className="flex-shrink-0 w-7 h-7 rounded bg-neutral-900 dark:bg-white flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-white dark:text-neutral-900" />
          </div>
        )}

        <div
          className={cn(
            'max-w-[85%] px-3 py-2 text-sm',
            isUser
              ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded'
              : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded'
          )}
        >
          {isUser ? (
            <div className="whitespace-pre-wrap break-words">{content}</div>
          ) : (
            <Streamdown components={streamdownComponents}>
              {content}
            </Streamdown>
          )}
        </div>

        {isUser && (
          <div className="flex-shrink-0 w-7 h-7 rounded bg-neutral-900 dark:bg-white flex items-center justify-center">
            <span className="text-white dark:text-neutral-900 text-xs font-medium">Y</span>
          </div>
        )}
      </div>
    );
  }, []);

  return (
    <div className={cn('flex flex-col h-full bg-white dark:bg-neutral-950', className)}>
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-4"
      >
        <div className="max-w-full">
          {showWelcome && (
            <div className="flex gap-3 justify-start mb-4">
              <div className="flex-shrink-0 w-7 h-7 rounded bg-neutral-900 dark:bg-white flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-white dark:text-neutral-900" />
              </div>
              <div className="max-w-[85%] px-3 py-2 bg-neutral-50 dark:bg-neutral-900 rounded text-sm">
                <p className="font-medium text-neutral-900 dark:text-neutral-100 mb-3">How can I help with your email today?</p>
                <div className="space-y-1.5 text-neutral-600 dark:text-neutral-400 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-1 h-1 bg-neutral-300 dark:bg-neutral-700 rounded-full shrink-0" />
                    <span>"Send an email to <span className="font-mono text-neutral-900 dark:text-neutral-100">john@example.com</span>"</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1 h-1 bg-neutral-300 dark:bg-neutral-700 rounded-full shrink-0" />
                    <span>"Show emails from Sarah"</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1 h-1 bg-neutral-300 dark:bg-neutral-700 rounded-full shrink-0" />
                    <span>"Find emails about project"</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1 h-1 bg-neutral-300 dark:bg-neutral-700 rounded-full shrink-0" />
                    <span>"Reply saying I'll be there"</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {messages.map(renderMessage)}

          {sendError && (
            <div className="flex gap-3 justify-start mb-4">
              <div className="flex-shrink-0 w-7 h-7 rounded bg-error flex items-center justify-center">
                <AlertCircle className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="max-w-[85%] px-3 py-2 bg-error/10 dark:bg-error/20 text-sm rounded text-error">
                <p className="text-error dark:text-error/80">Failed to send message. Please try again.</p>
              </div>
            </div>
          )}

          {isLoading && (
            <div className="flex gap-3 justify-start mb-4">
              <div className="flex-shrink-0 w-7 h-7 rounded bg-neutral-900 dark:bg-white flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-white dark:text-neutral-900" />
              </div>
              <div className="bg-neutral-100 dark:bg-neutral-900 rounded px-3 py-2 text-sm">
                <div className="flex items-center gap-1">
                  <span className="w-1 h-1 bg-neutral-400 dark:bg-neutral-600 rounded-full animate-pulse"></span>
                  <span className="w-1 h-1 bg-neutral-400 dark:bg-neutral-600 rounded-full animate-pulse" style={{ animationDelay: '0.15s' }}></span>
                  <span className="w-1 h-1 bg-neutral-400 dark:bg-neutral-600 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }}></span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="border-t border-neutral-200 dark:border-neutral-800 p-4">
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              rows={1}
              disabled={isLoading}
              className={cn(
                'w-full resize-none rounded px-3 py-2 text-sm',
                'bg-white dark:bg-neutral-900',
                'border border-neutral-300 dark:border-neutral-700',
                'text-neutral-900 dark:text-neutral-100',
                'placeholder:text-neutral-400 dark:placeholder:text-neutral-600',
                'focus:outline-none focus:border-neutral-400 focus:bg-white dark:focus:bg-neutral-900 focus:ring-1 focus:ring-neutral-400 dark:focus:border-neutral-500',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'transition-colors',
                'pr-10'
              )}
              style={{ height: `${inputHeight}px`, fontFamily: 'inherit' }}
            />
          </div>

          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={cn(
              'flex-shrink-0 w-9 h-9 rounded flex items-center justify-center transition-colors',
              'border',
              input.trim() && !isLoading
                ? 'bg-neutral-900 text-white border-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:border-neutral-100'
                : 'bg-transparent text-neutral-400 border-neutral-300 dark:text-neutral-600 dark:border-neutral-700 cursor-not-allowed'
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
});
