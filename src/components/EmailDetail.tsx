import { useEffect, useRef } from 'react';
import { ArrowLeft, Reply, Forward, Star, MoreVertical, Loader2 } from 'lucide-react';
import { formatFullDate, getInitials } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { Email } from '@/types/email';
import { useEmails } from '@/hooks/useEmails';
import { useAppStore } from '@/store';

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
  const darkMode = useAppStore((state) => state.darkMode);
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
    <div className={`flex flex-col h-full ${darkMode ? 'bg-zinc-900' : 'bg-white'}`}>
      {/* Header */}
      <header className={`border-b ${darkMode ? 'border-zinc-800' : 'border-zinc-200'} p-6 shrink-0 animate-slide-up`}>
        <div className="flex items-center justify-between mb-5">
          <button
            onClick={onBack}
            className={`flex items-center gap-2 text-sm font-medium transition-smooth
              ${darkMode ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-zinc-900'}`}
          >
            <ArrowLeft className="w-4.5 h-4.5" />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onReply?.(email.id)}
              className={`p-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-smooth`}
              title="Reply"
            >
              <Reply className={`w-4.5 h-4.5 ${darkMode ? 'text-zinc-400' : 'text-zinc-500'}`} />
            </button>
            <button
              onClick={() => onForward?.(email.id)}
              className={`p-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-smooth`}
              title="Forward"
            >
              <Forward className={`w-4.5 h-4.5 ${darkMode ? 'text-zinc-400' : 'text-zinc-500'}`} />
            </button>
            <button
              className={`p-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-smooth`}
              title="Star"
            >
              <Star className={`w-4.5 h-4.5 ${darkMode ? 'text-zinc-600' : 'text-zinc-300'}`} />
            </button>
            <button
              className={`p-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-smooth`}
              title="More"
            >
              <MoreVertical className={`w-4.5 h-4.5 ${darkMode ? 'text-zinc-400' : 'text-zinc-500'}`} />
            </button>
          </div>
        </div>

        <h1 className={cn(
          'text-2xl font-semibold mb-2 tracking-tight',
          darkMode ? 'text-white' : 'text-zinc-900'
        )}>
          {email.subject}
        </h1>

        {activeThread && activeThread.length > 1 && (
          <span className={`text-sm ${darkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
            {activeThread.length} messages in this conversation
          </span>
        )}
      </header>

      {/* Messages List */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-8"
      >
        {displayEmails.map((msg, index) => (
          <div
            key={msg.id}
            className={cn(
              "relative animate-slide-up",
              index !== displayEmails.length - 1 && `border-b ${darkMode ? 'border-zinc-800' : 'border-zinc-100'} pb-8`
            )}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {/* Message Header */}
            <div className="flex items-start gap-4 mb-5">
              <div className={`w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center text-sm font-semibold shrink-0 shadow-lg shadow-blue-500/25`}>
                {getInitials(msg.from.name || msg.from.email)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-4">
                  <span className={`font-semibold ${darkMode ? 'text-white' : 'text-zinc-900'}`}>
                    {msg.from.name || msg.from.email}
                  </span>
                  <span className={`text-xs shrink-0 ${darkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    {formatFullDate(msg.date)}
                  </span>
                </div>

                <div className={`text-sm mt-0.5 ${darkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  &lt;{msg.from.email}&gt; to {msg.to.map(t => t.name || t.email).join(', ')}
                </div>
              </div>
            </div>

            {/* Message Body */}
            <div className="pl-[3.25rem]">
              <pre className={`whitespace-pre-wrap font-sans text-sm leading-relaxed ${darkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>
                {msg.body}
              </pre>
            </div>
          </div>
        ))}
      </div>

      {/* Quick reply */}
      {onReply && (
        <div className={`border-t ${darkMode ? 'border-zinc-800 bg-zinc-900/50' : 'border-zinc-200 bg-zinc-50'} p-4 shrink-0`}>
          <button
            onClick={() => onReply(displayEmails[displayEmails.length - 1].id)}
            className={`w-full py-3.5 px-4 rounded-xl text-left transition-smooth flex items-center gap-3
              ${darkMode
                ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-300'
                : 'bg-white text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700'
              } border ${darkMode ? 'border-zinc-800' : 'border-zinc-200'}`}
          >
            <Reply className="w-4.5 h-4.5" />
            <span className="text-sm">Reply to {displayEmails[displayEmails.length - 1].from.name || 'sender'}...</span>
          </button>
        </div>
      )}
    </div>
  );
}
