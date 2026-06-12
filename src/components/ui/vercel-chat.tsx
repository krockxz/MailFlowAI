import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { Send, Loader2, Sparkles, AlertCircle } from 'lucide-react';
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
    target.style.height = 'auto';
    const newHeight = Math.min(120, Math.max(36, target.scrollHeight));
    target.style.height = `${newHeight}px`;
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
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    setSendError(null);

    try {
      await sendMessage(trimmed);
    } catch (error) {
      setSendError(error instanceof Error ? error.message : 'Failed to send message');
      setInput(trimmed);
    }
  }, [input, isLoading, sendMessage]);

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
    <Avatar className="w-7 h-7 shrink-0">
      <AvatarFallback className="bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs">
        <Sparkles className="w-3.5 h-3.5" />
      </AvatarFallback>
    </Avatar>
  );

  const UserAvatar = () => (
    <Avatar className="w-7 h-7 shrink-0">
      <AvatarFallback className="bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-xs font-semibold">
        Y
      </AvatarFallback>
    </Avatar>
  );

  return (
    <div className={cn('flex flex-col h-full bg-white dark:bg-neutral-950', className)}>
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="px-4 py-4 space-y-4">
          {showWelcome && (
            <div className="flex gap-3">
              <BotAvatar />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                  How can I help with your email?
                </p>
                <div className="text-xs text-neutral-500 dark:text-neutral-500 space-y-1.5">
                  <p>&quot;Send an email to john@example.com&quot;</p>
                  <p>&quot;Show emails from Sarah&quot;</p>
                  <p>&quot;Find emails about the project&quot;</p>
                  <p>&quot;Reply saying I&apos;ll be there&quot;</p>
                </div>
              </div>
            </div>
          )}

          {messages.map((msg: any) => {
            const content = extractContent(msg);
            if (!content) return null;

            const isUser = msg.role === 'user';

            return (
              <div key={msg.id} className="flex gap-3">
                {isUser ? <UserAvatar /> : <BotAvatar />}
                <div className="flex-1 min-w-0 text-sm leading-relaxed">
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
              </div>
            );
          })}

          {(sendError || chatError) && (
            <div className="flex gap-3">
              <Avatar className="w-7 h-7 shrink-0">
                <AvatarFallback className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs">
                  <AlertCircle className="w-3.5 h-3.5" />
                </AvatarFallback>
              </Avatar>
              <div className="text-sm text-red-600 dark:text-red-400 py-1">
                {sendError || 'Failed to send message. Please try again.'}
              </div>
            </div>
          )}

          {isLoading && (
            <div className="flex gap-3">
              <BotAvatar />
              <div className="flex items-center gap-1.5 py-2">
                <span className="w-1.5 h-1.5 bg-neutral-400 dark:bg-neutral-600 rounded-full animate-pulse" />
                <span className="w-1.5 h-1.5 bg-neutral-400 dark:bg-neutral-600 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-neutral-400 dark:bg-neutral-600 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="border-t border-neutral-200 dark:border-neutral-800 p-3">
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

        {messages.length > 0 && (
          <button
            onClick={() => chat.setMessages([])}
            className="mt-2 text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-400 transition-colors"
          >
            Clear chat
          </button>
        )}
      </div>
    </div>
  );
});
