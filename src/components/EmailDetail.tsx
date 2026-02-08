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
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin mb-2" />
        <p>Loading conversation...</p>
      </div>
    );
  }

  if (!email) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
        <p className="text-lg">Select an email to read</p>
      </div>
    );
  }

  // Use thread if available and matches current email, otherwise show single email
  const displayEmails = activeThread && activeThread.length > 0 && activeThread[0].threadId === email.threadId
    ? activeThread.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    : [email];

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 p-4 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onReply?.(email.id)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="Reply"
            >
              <Reply className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={() => onForward?.(email.id)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="Forward"
            >
              <Forward className="w-5 h-5 text-gray-600" />
            </button>
            <button
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="Star"
            >
              <Star className="w-5 h-5 text-gray-400" />
            </button>
            <button
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="More"
            >
              <MoreVertical className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        <h1 className={cn(
          'text-xl font-semibold mb-1',
          !email.isUnread && 'font-normal'
        )}>
          {email.subject}
        </h1>

        {activeThread && activeThread.length > 1 && (
          <span className="text-sm text-gray-500">
            {activeThread.length} messages in this conversation
          </span>
        )}
      </div>

      {/* Messages List */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-8"
      >
        {displayEmails.map((msg, index) => (
          <div
            key={msg.id}
            className={cn(
              "relative group transition-all",
              index !== displayEmails.length - 1 && "border-b border-gray-100 pb-8"
            )}
          >
            {/* Message Header */}
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-medium shrink-0">
                {getInitials(msg.from.name || msg.from.email)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between">
                  <span className="font-semibold text-gray-900">
                    {msg.from.name || msg.from.email}
                  </span>
                  <span className="text-sm text-gray-500">
                    {formatFullDate(msg.date)}
                  </span>
                </div>

                <div className="text-sm text-gray-500">
                  &lt;{msg.from.email}&gt; to {msg.to.map(t => t.name || t.email).join(', ')}
                </div>
              </div>
            </div>

            {/* Message Body */}
            <div className="pl-14 prose max-w-none text-gray-800">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                {msg.body}
              </pre>
            </div>
          </div>
        ))}
      </div>

      {/* Quick reply (always replies to latest) */}
      {onReply && (
        <div className="border-t border-gray-200 p-4 shrink-0 bg-gray-50">
          <button
            onClick={() => onReply(displayEmails[displayEmails.length - 1].id)}
            className="w-full py-3 px-4 border border-gray-300 rounded-lg text-left text-gray-500 hover:bg-white hover:shadow-sm transition-all flex items-center gap-3 bg-white"
          >
            <Reply className="w-5 h-5" />
            <span>Reply to {displayEmails[displayEmails.length - 1].from.name || 'sender'}...</span>
          </button>
        </div>
      )}
    </div>
  );
}
