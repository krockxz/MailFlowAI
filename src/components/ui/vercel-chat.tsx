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

// Custom components for Streamdown styling - Enhanced Vercel style
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
    <p className="my-1.5 text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed" {...props}>{children}</p>
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
        <code className={cn(
          "text-xs font-mono px-2 py-1.5 my-2 block overflow-x-auto",
          "bg-violet-50 dark:bg-violet-950/50",
          "text-violet-800 dark:text-violet-200",
          "border border-violet-200/50 dark:border-violet-800/50",
          "rounded-md",
          className
        )} {...props}>
          {children}
        </code>
      );
    }
    return (
      <code className={cn(
        "text-xs font-mono px-1.5 py-0.5",
        "bg-violet-100 dark:bg-violet-900/50",
        "text-violet-800 dark:text-violet-200",
        "rounded"
      )} {...props}>
        {children}
      </code>
    );
  },
  a: ({ href, children, ...props }: any) => (
    <a
      href={href}
      className="text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 hover:underline transition-colors"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    >
      {children}
    </a>
  ),
  ul: ({ children, ...props }: any) => (
    <ul className="my-1.5 space-y-1" {...props}>{children}</ul>
  ),
  ol: ({ children, ...props }: any) => (
    <ol className="my-1.5 space-y-1" {...props}>{children}</ol>
  ),
  li: ({ children, ...props }: any) => (
    <li className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed" {...props}>{children}</li>
  ),
  blockquote: ({ children, ...props }: any) => (
    <blockquote className={cn(
      "border-l-2 border-violet-300 dark:border-violet-700 pl-3 my-2",
      "text-neutral-600 dark:text-neutral-400 italic"
    )} {...props}>
      {children}
    </blockquote>
  ),
  hr: (props: any) => (
    <hr className={cn("my-3 border-neutral-200 dark:border-neutral-800", "border-dashed")} {...props} />
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
          <div className="relative mb-5">
            <div className="absolute inset-0 bg-red-500/10 rounded-2xl blur-xl" />
            <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-red-100 to-red-50 dark:from-red-900/30 dark:to-red-950 flex items-center justify-center border border-red-200/50 dark:border-red-800/50">
              <AlertCircle className="w-7 h-7 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-2">AI Assistant unavailable</h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-500 max-w-[280px] leading-relaxed">
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
          'flex gap-3 mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300',
          isUser ? 'justify-end' : 'justify-start'
        )}
      >
        {!isUser && (
          <div className={cn(
            "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
            "bg-gradient-to-br from-violet-600 to-indigo-600",
            "shadow-lg shadow-violet-500/30 ring-2 ring-white/20 dark:ring-neutral-800/50"
          )}>
            <Sparkles className="w-4 h-4 text-white" />
          </div>
        )}

        <div
          className={cn(
            'max-w-[85%] px-4 py-3 text-sm leading-relaxed',
            'transition-all duration-200',
            isUser
              ? cn(
                  'bg-gradient-to-br from-violet-600 to-violet-700 text-white rounded-2xl rounded-tr-sm',
                  'shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/30'
                )
              : cn(
                  'bg-gradient-to-br from-white to-neutral-50 dark:from-neutral-900 dark:to-neutral-950',
                  'text-neutral-900 dark:text-neutral-100 rounded-2xl rounded-tl-sm',
                  'border border-neutral-200/70 dark:border-neutral-800/70',
                  'shadow-sm hover:shadow-md',
                  'hover:border-violet-200/50 dark:hover:border-violet-800/30'
                )
          )}
        >
          {isUser ? (
            <div className="whitespace-pre-wrap break-words font-medium">{content}</div>
          ) : (
            <Streamdown components={streamdownComponents}>
              {content}
            </Streamdown>
          )}
        </div>

        {isUser && (
          <div className={cn(
            "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
            "bg-gradient-to-br from-neutral-700 to-neutral-800 dark:from-neutral-600 dark:to-neutral-700",
            "shadow-md ring-2 ring-white/20 dark:ring-neutral-800/50"
          )}>
            <span className="text-white text-xs font-semibold">You</span>
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
            <div className="flex gap-3 justify-start mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className={cn(
                "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                "bg-gradient-to-br from-violet-600 to-indigo-600",
                "shadow-lg shadow-violet-500/30 ring-2 ring-white/20 dark:ring-neutral-800/50"
              )}>
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className={cn(
                "max-w-[85%] px-4 py-3.5 rounded-2xl rounded-tl-sm text-sm shadow-sm",
                "bg-gradient-to-br from-violet-50 via-indigo-50 to-white dark:from-violet-950/60 dark:via-indigo-950/40 dark:to-neutral-950",
                "border border-violet-200/70 dark:border-violet-800/50",
                "hover:shadow-md hover:border-violet-300/50 dark:hover:border-violet-700/50 transition-all duration-200"
              )}>
                <p className="font-semibold text-violet-900 dark:text-violet-100 mb-3.5">How can I help with your email today?</p>
                <div className="space-y-2.5 text-neutral-600 dark:text-neutral-400 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-violet-500 dark:bg-violet-500 rounded-full shrink-0 shadow-sm shadow-violet-400/50" />
                    <span>"Send an email to <span className="font-mono text-violet-700 dark:text-violet-300">john@example.com</span>"</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-violet-500 dark:bg-violet-500 rounded-full shrink-0 shadow-sm shadow-violet-400/50" />
                    <span>"Show emails from Sarah"</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-violet-500 dark:bg-violet-500 rounded-full shrink-0 shadow-sm shadow-violet-400/50" />
                    <span>"Find emails about project"</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-violet-500 dark:bg-violet-500 rounded-full shrink-0 shadow-sm shadow-violet-400/50" />
                    <span>"Reply saying I'll be there"</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {messages.map(renderMessage)}

          {sendError && (
            <div className="flex gap-3 justify-start mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className={cn(
                "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                "bg-gradient-to-br from-red-500 to-red-600",
                "shadow-lg shadow-red-500/30 ring-2 ring-white/20 dark:ring-neutral-800/50"
              )}>
                <AlertCircle className="w-4 h-4 text-white" />
              </div>
              <div className={cn(
                "max-w-[85%] px-4 py-3 text-sm rounded-2xl rounded-tl-sm shadow-sm",
                "bg-gradient-to-br from-red-50 to-white dark:from-red-950/30 dark:to-neutral-950",
                "border border-red-200/70 dark:border-red-800/60",
                "text-red-700 dark:text-red-300"
              )}>
                Failed to send message. Please try again.
              </div>
            </div>
          )}

          {isLoading && (
            <div className="flex gap-3 justify-start mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className={cn(
                "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                "bg-gradient-to-br from-violet-600 to-indigo-600",
                "shadow-lg shadow-violet-500/30 ring-2 ring-white/20 dark:ring-neutral-800/50"
              )}>
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className={cn(
                "px-4 py-3.5 text-sm rounded-2xl rounded-tl-sm shadow-sm",
                "bg-gradient-to-br from-white to-neutral-50 dark:from-neutral-900 dark:to-neutral-950",
                "border border-neutral-200/70 dark:border-neutral-800/70"
              )}>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-full animate-bounce shadow-sm shadow-violet-500/30" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-full animate-bounce shadow-sm shadow-violet-500/30" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-full animate-bounce shadow-sm shadow-violet-500/30" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className={cn(
        "border-t border-neutral-200/60 dark:border-neutral-800/60 p-4",
        "bg-gradient-to-t from-neutral-50/80 via-white/40 to-white dark:from-neutral-950/80 dark:via-neutral-950/40 dark:to-neutral-950"
      )}>
        <div className="flex items-end gap-2.5">
          <div className="flex-1 relative">
            {/* Multi-layer glow effect on focus */}
            <div className={cn(
              "absolute inset-0 rounded-xl opacity-0 transition-all duration-300 -z-10",
              input.length > 0 && !isLoading && cn(
                "opacity-100",
                "bg-gradient-to-r from-violet-500/15 via-indigo-500/10 to-purple-500/15",
                "blur-md"
              )
            )} />
            <div className={cn(
              "absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 -z-10",
              input.length > 0 && !isLoading && cn(
                "opacity-100 scale-110",
                "bg-gradient-to-r from-violet-400/10 to-indigo-400/10",
                "blur-xl"
              )
            )} />
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              rows={1}
              disabled={isLoading}
              className={cn(
                'w-full resize-none rounded-xl px-4 py-3 text-sm leading-relaxed',
                'bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm',
                'border border-neutral-300 dark:border-neutral-700',
                'text-neutral-900 dark:text-neutral-100',
                'placeholder:text-neutral-400 dark:placeholder:text-neutral-600',
                'focus:outline-none',
                'focus:border-violet-400 dark:focus:border-violet-500',
                'focus:ring-2 focus:ring-violet-500/15 dark:focus:ring-violet-500/25',
                'focus:bg-white dark:focus:bg-neutral-900',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'transition-all duration-200',
                'pr-10',
                'shadow-sm focus:shadow-md'
              )}
              style={{ height: `${inputHeight}px`, fontFamily: 'inherit' }}
            />
          </div>

          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={cn(
              'flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200',
              input.trim() && !isLoading
                ? cn(
                    'bg-gradient-to-br from-violet-600 to-indigo-600 text-white',
                    'hover:from-violet-700 hover:to-indigo-700',
                    'shadow-md shadow-violet-500/20 hover:shadow-xl hover:shadow-violet-500/30',
                    'hover:scale-105 active:scale-95',
                    'ring-2 ring-violet-500/20 hover:ring-violet-500/40'
                  )
                : cn(
                    'bg-neutral-100 dark:bg-neutral-900',
                    'text-neutral-400 dark:text-neutral-600',
                    'border border-neutral-200 dark:border-neutral-800',
                    'cursor-not-allowed'
                )
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
            className={cn(
              "mt-3 text-xs flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all duration-200",
              "text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300",
              "hover:bg-neutral-100/80 dark:hover:bg-neutral-900/50",
              "focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:bg-neutral-100 dark:focus:bg-neutral-900",
              "active:scale-95"
            )}
          >
            <X className="w-3 h-3" />
            Clear chat
          </button>
        )}
      </div>
    </div>
  );
});
