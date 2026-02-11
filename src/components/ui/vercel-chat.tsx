import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Loader2, X, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCopilotChat } from '@copilotkit/react-core';
import { Message, TextMessage, MessageRole } from '@copilotkit/runtime-client-gql';

interface VercelChatProps {
  instructions?: string;
  placeholder?: string;
  className?: string;
}

const DEFAULT_INSTRUCTIONS = `You are an AI email assistant integrated into a mail client. Help users manage emails through natural language.

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
- Never use emojis in responses`;

export function VercelChat({
  instructions = DEFAULT_INSTRUCTIONS,
  placeholder = 'Ask to compose, search, or manage emails...',
  className,
}: VercelChatProps) {
  // Use the simpler useCopilotChat which works without public API key
  const chatHook = useCopilotChat({
    makeSystemMessage: () => instructions,
  });

  const [input, setInput] = useState('');
  const [inputHeight, setInputHeight] = useState(44);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(true);

  // Get values from the hook return
  const messages = chatHook.visibleMessages || [];
  const isLoading = chatHook.isLoading || false;

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? 'smooth' : 'auto',
    });
  }, []);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    if (isScrolledToBottom) {
      scrollToBottom();
    }
  }, [messages, isScrolledToBottom, scrollToBottom]);

  // Handle scroll detection
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

    // Auto-resize textarea
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

    // Use TextMessage class for proper message construction
    console.log('[VercelChat] Sending message:', trimmed);
    await chatHook.appendMessage(
      new TextMessage({
        role: MessageRole.User,
        content: trimmed,
      })
    );
  };

  const formatMessageContent = (content: string) => {
    return content
      .replace(/\n/g, '<br />')
      .replace(/• /g, '<span class="inline-block w-1.5 h-1.5 bg-current rounded-full mr-2 opacity-50"></span>')
      .replace(/"([^"]+)"/g, '"<span class="font-mono text-accent-600 dark:text-accent-400">$1</span>"');
  };

  const getMessageContent = (msg: Message): string => {
    if (msg.isTextMessage()) {
      return msg.content;
    }
    return '';
  };

  const showWelcome = messages.length === 0;

  return (
    <div className={cn('flex flex-col h-full bg-white dark:bg-neutral-950', className)}>
      {/* Messages Area */}
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

          {messages.map((msg, index) => {
            const isUser = msg.isTextMessage() && msg.role === MessageRole.User;
            const isAssistant = msg.isTextMessage() && msg.role === MessageRole.Assistant;

            // Skip system messages and other types
            if (!isUser && !isAssistant) return null;

            const messageContent = getMessageContent(msg);

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
                    dangerouslySetInnerHTML={{ __html: formatMessageContent(messageContent) }}
                  />
                </div>

                {isUser && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-neutral-900 dark:bg-white flex items-center justify-center shadow-sm">
                    <span className="text-white dark:text-neutral-900 text-xs font-medium">You</span>
                  </div>
                )}
              </div>
            );
          })}

          {/* Loading Indicator - Only show when there are messages */}
          {isLoading && messages.length > 0 && (
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

      {/* Input Area */}
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

        {/* Clear Chat Button */}
        {messages.length > 0 && (
          <button
            onClick={chatHook.reset}
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
