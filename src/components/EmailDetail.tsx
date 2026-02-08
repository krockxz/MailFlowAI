import { useEffect, useRef } from 'react';
import { ArrowLeft, Reply, Forward, Star, MoreVertical, Loader2 } from 'lucide-react';
import { formatFullDate, getInitials } from '@/lib/utils';
import type { Email } from '@/types/email';
import { useEmails } from '@/hooks/useEmails';
import { useAppStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

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
      <div className="flex flex-col items-center justify-center h-full text-zinc-400 dark:text-zinc-600 animate-fade-in">
        <Loader2 className="w-8 h-8 animate-spin mb-3 text-blue-500" />
        <p className="text-sm font-medium">Loading conversation...</p>
      </div>
    );
  }

  if (!email) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-zinc-400 dark:text-zinc-600 p-8 animate-fade-in">
        <p className="text-lg font-medium text-zinc-600 dark:text-zinc-400">Select an email to read</p>
      </div>
    );
  }

  // Use thread if available and matches current email, otherwise show single email
  const displayEmails = activeThread && activeThread.length > 0 && activeThread[0].threadId === email.threadId
    ? activeThread.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    : [email];

  return (
    <div className="flex flex-col h-full bg-neutral-50 dark:bg-neutral-950">
      {/* Header */}
      <header className="border-b border-neutral-200 dark:border-neutral-800 px-8 py-6 shrink-0 animate-slide-up">
        <div className="flex items-center justify-between mb-5">
          <Button
            variant="ghost"
            onClick={onBack}
            className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
          >
            <ArrowLeft className="w-4.5 h-4.5 mr-2" />
            <span>Back</span>
          </Button>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onReply?.(email.id)}
              title="Reply"
            >
              <Reply className="w-4.5 h-4.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onForward?.(email.id)}
              title="Forward"
            >
              <Forward className="w-4.5 h-4.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              title="Star"
            >
              <Star className="w-4.5 h-4.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              title="More"
            >
              <MoreVertical className="w-4.5 h-4.5" />
            </Button>
          </div>
        </div>

        <h1 className="text-2xl font-semibold mb-2 tracking-tight text-zinc-900 dark:text-white">
          {email.subject}
        </h1>

        {activeThread && activeThread.length > 1 && (
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            {activeThread.length} messages in this conversation
          </span>
        )}
      </header>

      {/* Messages List */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-8 py-6 space-y-8"
      >
        <div className="max-w-[800px] mx-auto">
        {displayEmails.map((msg, index) => (
          <div
            key={msg.id}
            className="relative animate-slide-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {index !== displayEmails.length - 1 && (
              <Separator className="mb-8 bg-neutral-100 dark:bg-neutral-800" />
            )}

            {/* Message Header */}
            <div className="flex items-start gap-4 mb-5">
              <Avatar className="w-11 h-11 shadow-lg shadow-blue-500/25 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                <AvatarFallback className="bg-transparent text-white">
                  {getInitials(msg.from.name || msg.from.email)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="font-semibold text-zinc-900 dark:text-white">
                    {msg.from.name || msg.from.email}
                  </span>
                  <span className="text-xs shrink-0 text-zinc-400 dark:text-zinc-500">
                    {formatFullDate(msg.date)}
                  </span>
                </div>

                <div className="text-sm mt-0.5 text-zinc-500 dark:text-zinc-400">
                  &lt;{msg.from.email}&gt; to {msg.to.map(t => t.name || t.email).join(', ')}
                </div>
              </div>
            </div>

            {/* Message Body */}
            <div className="pl-[3.25rem]">
              <pre className="whitespace-pre-wrap font-sans text-[15px] leading-relaxed text-zinc-700 dark:text-zinc-300">
                {msg.body}
              </pre>
            </div>
          </div>
        ))}
        </div>
      </div>

      {/* Quick reply */}
      {onReply && (
        <div className="border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/50 p-4 shrink-0">
          <Button
            variant="outline"
            onClick={() => onReply(displayEmails[displayEmails.length - 1].id)}
            className="w-full justify-start"
          >
            <Reply className="w-4.5 h-4.5 mr-3" />
            <span className="text-sm">Reply to {displayEmails[displayEmails.length - 1].from.name || 'sender'}...</span>
          </Button>
        </div>
      )}
    </div>
  );
}
