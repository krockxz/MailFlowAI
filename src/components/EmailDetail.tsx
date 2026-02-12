import { useEffect, useRef, useMemo, memo, useState, useCallback } from 'react';
import { ArrowLeft, Reply, Forward, Loader2, ChevronDown } from 'lucide-react';
import { formatFullDate, getInitials } from '@/lib/utils';
import type { Email } from '@/types/email';
import { useEmails } from '@/hooks/useEmails';
import { useAppStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { ThreadParticipantsRow } from '@/components/ThreadParticipantsRow';

interface EmailDetailProps {
  email: Email | null;
  onBack: () => void;
  onReply?: (emailId: string) => void;
  onForward?: (emailId: string) => void;
}

const COLLAPSE_THRESHOLD = 4;

export const EmailDetail = memo(function EmailDetail({ email, onBack, onReply, onForward }: EmailDetailProps) {
  const { fetchThread } = useEmails();
  const activeThread = useAppStore((state) => state.activeThread);
  const isLoading = useAppStore((state) => state.isLoading);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);

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

  // Memoize thread sorting to avoid re-sorting on every render
  const displayEmails = useMemo(() => {
    if (!activeThread || activeThread.length === 0 || activeThread[0].threadId !== email?.threadId) {
      return email ? [email] : [];
    }
    return [...activeThread].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [activeThread, email]);

  // Determine which messages to show based on collapse state
  const visibleEmails = useMemo(() => {
    if (displayEmails.length <= COLLAPSE_THRESHOLD || isExpanded) {
      return displayEmails;
    }
    return displayEmails.slice(0, COLLAPSE_THRESHOLD);
  }, [displayEmails, isExpanded]);

  const hiddenCount = displayEmails.length - visibleEmails.length;

  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  if (isLoading && !activeThread) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-neutral-500 dark:text-neutral-400">
        <Loader2 className="w-8 h-8 animate-spin mb-4" />
        <p className="text-sm">Loading conversation...</p>
      </div>
    );
  }

  if (!email) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-neutral-500 dark:text-neutral-400 p-8">
        <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center mb-4">
          <ArrowLeft className="w-5 h-5 text-neutral-400 dark:text-neutral-600" />
        </div>
        <p className="text-sm">Select an email to read</p>
      </div>
    );
  }

  const isThread = displayEmails.length > 1;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-neutral-950">
      {/* Header */}
      <header className="border-b border-neutral-200 dark:border-neutral-800 px-5 py-4 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            onClick={onBack}
            className="pl-0 text-neutral-600 hover:text-neutral-900 dark:text-neutral-400"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onReply?.(email.id)}
            >
              <Reply className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onForward?.(email.id)}
            >
              <Forward className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <h1 className="text-lg font-semibold text-neutral-900 dark:text-white leading-tight mb-3">
          {email.subject}
        </h1>

        {isThread && (
          <ThreadParticipantsRow messages={displayEmails} />
        )}
      </header>

      {/* Messages List */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-5 py-6"
      >
        <div className="max-w-3xl mx-auto">
          {visibleEmails.map((msg, index) => (
            <div
              key={msg.id}
              className={cn(
                'relative mb-8',
                index !== visibleEmails.length - 1 && 'pb-8 border-b border-neutral-100 dark:border-neutral-900',
                index > 0 && 'ml-6'
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
                    <span className="font-semibold text-sm text-neutral-900 dark:text-white">
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
                <div className="text-sm leading-relaxed text-neutral-800 dark:text-neutral-300 whitespace-pre-wrap">
                  {msg.body}
                </div>
              </div>
            </div>
          ))}

          {/* Collapse/Expand Button */}
          {hiddenCount > 0 && (
            <button
              onClick={toggleExpanded}
              className="flex items-center gap-1 text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors mx-auto"
            >
              <ChevronDown className={cn('w-4 h-4 transition-transform', isExpanded && 'rotate-180')} />
              {hiddenCount} more messages
            </button>
          )}
        </div>
      </div>

      {/* Quick reply */}
      {onReply && displayEmails.length > 0 && (
        <div className="border-t border-neutral-200 dark:border-neutral-800 p-4 shrink-0">
          <Button
            variant="outline"
            onClick={() => onReply(displayEmails[displayEmails.length - 1].id)}
            className="w-full justify-start h-10"
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
});
