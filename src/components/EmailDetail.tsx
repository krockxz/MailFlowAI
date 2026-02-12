import { useEffect, useRef } from 'react';
import { ArrowLeft, Reply, Forward, Loader2 } from 'lucide-react';
import { formatFullDate, getInitials } from '@/lib/utils';
import type { Email } from '@/types/email';
import { useEmails } from '@/hooks/useEmails';
import { useAppStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface EmailDetailProps {
  email: Email | null;
  onBack: () => void;
  onReply?: (emailId: string) => void;
  onForward?: (emailId: string) => void;
}

export function EmailDetail({ email, onBack, onReply, onForward }: EmailDetailProps) {
  const { fetchThread } = useEmails();
  const activeThread = useAppStore((state) => state.activeThread);
  const isLoading = useAppStore((state) => state.isLoading);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch thread when email changes
  useEffect(() => {
    if (email?.threadId) {
      fetchThread(email.threadId);
    }
  }, [email?.threadId, fetchThread]);

  // Scroll to bottom when thread loads
  useEffect(() => {
    if (activeThread && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeThread]);

  if (isLoading && !activeThread) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-neutral-500 dark:text-neutral-400">
        <Loader2 className="w-8 h-8 animate-spin mb-4" />
        <p className="text-sm font-medium">Loading conversation...</p>
      </div>
    );
  }

  if (!email) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-neutral-500 dark:text-neutral-400 p-8">
        <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
          <ArrowLeft className="w-6 h-6 text-neutral-400 dark:text-neutral-500" />
        </div>
        <p className="text-sm font-medium">Select an email to read</p>
      </div>
    );
  }

  // Use thread if available and matches current email, otherwise show single email
  const displayEmails = activeThread && activeThread.length > 0 && activeThread[0].threadId === email.threadId
    ? activeThread.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    : [email];

  return (
    <div className="flex flex-col h-full bg-white dark:bg-neutral-950">
      {/* Header */}
      <header className="border-b border-neutral-200 dark:border-neutral-800 px-6 py-4 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            onClick={onBack}
            className="pl-0 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-transparent"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span className="font-medium">Back</span>
          </Button>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onReply?.(email.id)}
              title="Reply"
              className="h-8 w-8 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
            >
              <Reply className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onForward?.(email.id)}
              title="Forward"
              className="h-8 w-8 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
            >
              <Forward className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <h1 className="text-xl font-semibold mb-2 text-neutral-900 dark:text-white leading-tight">
          {email.subject}
        </h1>

        {activeThread && activeThread.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
              {activeThread.length} messages
            </span>
          </div>
        )}
      </header>

      {/* Messages List */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-6 py-6"
      >
        <div className="max-w-3xl mx-auto space-y-8">
          {displayEmails.map((msg, index) => {
            return (
              <div
                key={msg.id}
                className={cn(
                  'relative',
                  index !== displayEmails.length - 1 && 'pb-8 border-b border-neutral-100 dark:border-neutral-900'
                )}
              >
                {/* Message Header */}
                <div className="flex items-start gap-4 mb-4">
                  <Avatar className="w-10 h-10 shrink-0">
                    <AvatarFallback className="bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 text-sm font-medium">
                      {getInitials(msg.from.name || msg.from.email)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="font-semibold text-neutral-900 dark:text-white text-sm">
                        {msg.from.name || msg.from.email}
                      </span>
                      <span className="text-xs shrink-0 text-neutral-500 dark:text-neutral-500 tabular-nums">
                        {formatFullDate(msg.date)}
                      </span>
                    </div>

                    <div className="text-sm mt-0.5 text-neutral-500 dark:text-neutral-400">
                      &lt;{msg.from.email}&gt; to {msg.to?.map(t => t.name || t.email).join(', ') || ' undisclosed recipients'}
                    </div>
                  </div>
                </div>

                {/* Message Body */}
                <div className="pl-14">
                  <div className="text-[15px] leading-relaxed text-neutral-800 dark:text-neutral-300 whitespace-pre-wrap font-sans">
                    {msg.body}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick reply */}
      {onReply && displayEmails.length > 0 && (
        <div className="border-t border-neutral-200 dark:border-neutral-800 p-4 shrink-0 bg-white dark:bg-neutral-950">
          <Button
            variant="outline"
            onClick={() => onReply(displayEmails[displayEmails.length - 1].id)}
            className="w-full justify-start h-10 border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-900 hover:text-neutral-900 dark:hover:text-neutral-200"
          >
            <Reply className="w-4 h-4 mr-2" />
            <span className="text-sm">
              Reply to {displayEmails[displayEmails.length - 1].from.name || 'sender'}...
            </span>
          </Button>
        </div>
      )}
    </div>
  );
}
