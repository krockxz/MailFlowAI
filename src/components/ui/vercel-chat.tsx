import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { Send, Loader2, Mail, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAIChat } from '@/hooks/useAIChat';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import ReactMarkdown from 'react-markdown';

interface VercelChatProps {
  placeholder?: string;
  className?: string;
}

const suggestions = [
  '"Find emails from yesterday"',
  '"Show unread emails"',
  '"Search for invoices"',
  '"Compose to team@company.com"',
];

export const VercelChat = memo(function VercelChatInternal({
  placeholder = 'Ask to compose, search, or manage emails...',
  className,
}: VercelChatProps) {
  const chat = useAIChat();
  const { messages, sendMessage, status, error: chatError } = chat;

  const isLoading = status === 'submitted' || status === 'streaming';

  const [input, setInput] = useState('');
  const [sendError, setSendError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(true);
  const inputRef = useRef(input);
  inputRef.current = input;

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? 'smooth' : 'auto',
    });
  }, []);

  useEffect(() => {
    if (isScrolledToBottom) scrollToBottom();
  }, [messages, isScrolledToBottom, scrollToBottom]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      setIsScrolledToBottom(scrollHeight - scrollTop - clientHeight < 80);
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  const doSend = useCallback(async (text: string) => {
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setSendError(null);

    try {
      await sendMessage(text);
    } catch (error) {
      setSendError(error instanceof Error ? error.message : 'Failed to send message');
      setInput(text);
    }
  }, [sendMessage]);

  const handleSend = useCallback(() => {
    const trimmed = inputRef.current.trim();
    if (!trimmed || isLoading) return;
    doSend(trimmed);
  }, [isLoading, doSend]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const trimmed = inputRef.current.trim();
      if (!trimmed || isLoading) return;
      doSend(trimmed);
    }
  }, [isLoading, doSend]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { value } = e.target;
    setInput(value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(120, Math.max(36, e.target.scrollHeight))}px`;
  }, []);

  const showWelcome = messages.length === 0;

  const cleanContent = (text: string) => text.replace(/<action>[\s\S]*?<\/action>/g, '').trim();

  const extractContent = (msg: any): string => {
    if (msg.parts && Array.isArray(msg.parts)) {
      const text = msg.parts
        .filter((part: any) => part.type === 'text')
        .map((part: any) => part.text)
        .join('');
      return cleanContent(text);
    }
    if (typeof msg.content === 'string') return cleanContent(msg.content);
    return cleanContent(String(msg.content ?? ''));
  };

  const BotAvatar = () => (
    <Avatar className="w-6 h-6 shrink-0 ring-1 ring-neutral-200 dark:ring-neutral-800">
      <AvatarFallback className="bg-neutral-900 dark:bg-white text-white dark:text-neutral-900">
        <Mail className="w-3 h-3" />
      </AvatarFallback>
    </Avatar>
  );

  const UserAvatar = () => (
    <Avatar className="w-6 h-6 shrink-0 ring-1 ring-neutral-200 dark:ring-neutral-800">
      <AvatarFallback className="bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 text-[10px] font-semibold">
        Y
      </AvatarFallback>
    </Avatar>
  );

  return (
    <div className={cn('flex flex-col h-full bg-white dark:bg-neutral-950', className)}>
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="px-4 py-4 space-y-5">
          {showWelcome && (
            <div>
              <div className="flex gap-2.5 mb-4">
                <BotAvatar />
                <div>
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    How can I help with your email?
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      const text = s.slice(1, -1);
                      if (text.trim() && !isLoading) doSend(text);
                    }}
                    disabled={isLoading}
                    className={cn(
                      'text-xs px-3 py-1.5 rounded-full border border-neutral-200 dark:border-neutral-800',
                      'text-neutral-600 dark:text-neutral-400',
                      'hover:bg-neutral-100 dark:hover:bg-neutral-900',
                      'hover:border-neutral-300 dark:hover:border-neutral-700',
                      'transition-colors disabled:opacity-50'
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg: any) => {
            const content = extractContent(msg);
            if (!content) return null;

            const isUser = msg.role === 'user';

            return (
              <div key={msg.id} className={cn('flex gap-2.5', isUser && 'justify-end')}>
                {!isUser && <BotAvatar />}
                <div
                  className={cn(
                    'max-w-[85%] min-w-0 text-sm leading-relaxed',
                    isUser && 'bg-neutral-100 dark:bg-neutral-900 rounded-2xl rounded-br-md px-3.5 py-2'
                  )}
                >
                  {isUser ? (
                    <div className="text-neutral-900 dark:text-neutral-100 whitespace-pre-wrap break-words">
                      {content}
                    </div>
                  ) : (
                    <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1">
                      <ReactMarkdown>{content}</ReactMarkdown>
                    </div>
                  )}
                </div>
                {isUser && <UserAvatar />}
              </div>
            );
          })}

          {(sendError || chatError) && (
            <div className="flex gap-2.5">
              <Avatar className="w-6 h-6 shrink-0">
                <AvatarFallback className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                  <AlertCircle className="w-3 h-3" />
                </AvatarFallback>
              </Avatar>
              <div className="text-xs text-red-600 dark:text-red-400 py-0.5">
                {sendError || 'Failed to send message. Please try again.'}
              </div>
            </div>
          )}

          {isLoading && (
            <div className="flex gap-2.5">
              <BotAvatar />
              <div className="flex items-center gap-1 py-1.5">
                <span className="w-1.5 h-1.5 bg-neutral-300 dark:bg-neutral-600 rounded-full animate-bounce [animation-duration:0.8s]" />
                <span className="w-1.5 h-1.5 bg-neutral-300 dark:bg-neutral-600 rounded-full animate-bounce [animation-duration:0.8s]" style={{ animationDelay: '0.15s' }} />
                <span className="w-1.5 h-1.5 bg-neutral-300 dark:bg-neutral-600 rounded-full animate-bounce [animation-duration:0.8s]" style={{ animationDelay: '0.3s' }} />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="border-t border-neutral-200 dark:border-neutral-800 p-3 space-y-2">
        <div className="flex items-end gap-2">
          <Textarea
            ref={textareaRef as any}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={1}
            disabled={isLoading}
            className="min-h-[36px] max-h-[120px] resize-none text-sm"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="h-9 w-9 shrink-0"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>

        <span className="text-[10px] text-neutral-400 select-none">
          ↵ to send &middot; Shift + ↵ for newline
        </span>
      </div>
    </div>
  );
});
