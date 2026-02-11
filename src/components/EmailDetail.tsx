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

// Helper function to generate avatar gradient based on name
function getAvatarGradient(name: string) {
  const gradients = [
    'from-violet-500 to-purple-600',
    'from-indigo-500 to-blue-600',
    'from-purple-500 to-pink-600',
    'from-blue-500 to-cyan-600',
    'from-emerald-500 to-teal-600',
    'from-amber-500 to-orange-600',
  ];
  const index = name.charCodeAt(0) % gradients.length;
  return gradients[index];
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
      <div className="flex flex-col items-center justify-center h-full text-neutral-400 dark:text-neutral-600 animate-fade-in">
        <div className="relative">
          <div className="absolute inset-0 bg-accent-500/20 rounded-full blur-xl animate-pulse" />
          <Loader2 className="w-10 h-10 animate-spin text-accent-500 relative" />
        </div>
        <p className="text-sm font-medium mt-4 text-neutral-600 dark:text-neutral-400">Loading conversation...</p>
      </div>
    );
  }

  if (!email) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-neutral-400 dark:text-neutral-600 p-8 animate-fade-in">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-900 flex items-center justify-center mb-4 shadow-inner">
          <ArrowLeft className="w-10 h-10 text-neutral-400 dark:text-neutral-600" />
        </div>
        <p className="text-lg font-semibold text-neutral-700 dark:text-neutral-300">Select an email to read</p>
      </div>
    );
  }

  // Use thread if available and matches current email, otherwise show single email
  const displayEmails = activeThread && activeThread.length > 0 && activeThread[0].threadId === email.threadId
    ? activeThread.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    : [email];

  return (
    <div className="flex flex-col h-full bg-white/40 dark:bg-neutral-950/40 backdrop-blur-sm">
      {/* Header */}
      <header className="glass-elevated border-b border-neutral-200/50 dark:border-neutral-800/50 px-6 py-4 shrink-0 animate-slide-up">
        <div className="flex items-center justify-between mb-5">
          <Button
            variant="ghost"
            onClick={onBack}
            className="text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800/50 rounded-xl h-9 transition-all duration-200"
          >
            <ArrowLeft className="w-4.5 h-4.5 mr-2" />
            <span className="font-medium">Back</span>
          </Button>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onReply?.(email.id)}
              title="Reply"
              className="h-9 w-9 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800/50 transition-all duration-200"
            >
              <Reply className="w-4.5 h-4.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onForward?.(email.id)}
              title="Forward"
              className="h-9 w-9 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800/50 transition-all duration-200"
            >
              <Forward className="w-4.5 h-4.5" />
            </Button>
          </div>
        </div>

        <h1 className="text-2xl font-semibold mb-2 tracking-tight text-neutral-900 dark:text-white">
          {email.subject}
        </h1>

        {activeThread && activeThread.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-500 dark:text-neutral-400">
              {activeThread.length} messages in this conversation
            </span>
            <div className="h-1 w-1 rounded-full bg-accent-500" />
          </div>
        )}
      </header>

      {/* Messages List */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-6 py-5"
      >
        <div className="max-w-[780px] mx-auto space-y-8">
        {displayEmails.map((msg, index) => {
          const gradientClass = getAvatarGradient(msg.from.name || msg.from.email);
          return (
            <div
              key={msg.id}
              className={cn(
                'relative animate-slide-up',
                index !== displayEmails.length - 1 && 'pb-8'
              )}
              style={{ animationDelay: `${Math.min(index * 60, 200)}ms` }}
            >
              {index !== displayEmails.length - 1 && (
                <div className="absolute left-[3.25rem] bottom-0 w-px h-8 bg-gradient-to-b from-neutral-200 to-transparent dark:from-neutral-800" />
              )}

              {/* Message Header */}
              <div className="flex items-start gap-4 mb-4">
                <Avatar className={cn(
                  'w-11 h-11 shadow-md bg-gradient-to-br text-white',
                  gradientClass
                )}>
                  <AvatarFallback className="bg-transparent text-white font-semibold text-sm">
                    {getInitials(msg.from.name || msg.from.email)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="font-semibold text-neutral-900 dark:text-white text-sm">
                      {msg.from.name || msg.from.email}
                    </span>
                    <span className="text-xs shrink-0 text-neutral-400 dark:text-neutral-500 font-medium">
                      {formatFullDate(msg.date)}
                    </span>
                  </div>

                  <div className="text-sm mt-0.5 text-neutral-500 dark:text-neutral-400">
                    &lt;{msg.from.email}&gt; to {msg.to.map(t => t.name || t.email).join(', ')}
                  </div>
                </div>
              </div>

              {/* Message Body */}
              <div className="pl-[3.25rem]">
                <div className="bg-white dark:bg-neutral-900/50 rounded-2xl p-5 shadow-sm border border-neutral-200/50 dark:border-neutral-800/50">
                  <pre className="whitespace-pre-wrap font-sans text-[15px] leading-relaxed text-neutral-700 dark:text-neutral-300">
                    {msg.body}
                  </pre>
                </div>
              </div>
            </div>
          );
        })}
        </div>
      </div>

      {/* Quick reply */}
      {onReply && (
        <div className="border-t border-neutral-200/50 dark:border-neutral-800/50 bg-white/50 dark:bg-neutral-950/50 backdrop-blur-sm p-4 shrink-0">
          <Button
            variant="outline"
            onClick={() => onReply(displayEmails[displayEmails.length - 1].id)}
            className="w-full justify-start rounded-xl h-11 border-neutral-200/60 dark:border-neutral-800/60 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-all duration-300 font-medium"
          >
            <Reply className="w-4.5 h-4.5 mr-3 text-accent-500" />
            <span className="text-sm text-neutral-600 dark:text-neutral-400">
              Reply to {displayEmails[displayEmails.length - 1].from.name || 'sender'}...
            </span>
          </Button>
        </div>
      )}
    </div>
  );
}
