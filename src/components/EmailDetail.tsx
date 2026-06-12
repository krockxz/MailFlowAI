import { useEffect, useRef, useMemo, memo, useState, useCallback } from 'react';
import { ArrowLeft, Loader2, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Email } from '@/types/email';
import { useEmails } from '@/hooks/useEmails';
import { useAppStore } from '@/store';
import { EmailDetailHeader } from '@/components/email-detail/EmailDetailHeader';
import { EmailMessageCard } from '@/components/email-detail/EmailMessageCard';
import { QuickReplyBar } from '@/components/email-detail/QuickReplyBar';

interface EmailDetailProps {
  email: Email | null;
  onBack: () => void;
  onReply?: (emailId: string) => void;
  onForward?: (emailId: string) => void;
}

const COLLAPSE_THRESHOLD = 3;

const emailProseStyles = `
  .email-body {
    font-size: 15px;
    line-height: 1.7;
    color: #27272a;
    word-wrap: break-word;
  }
  .dark .email-body {
    color: #d4d4d8;
  }
  .email-body h1,
  .email-body h2,
  .email-body h3,
  .email-body h4,
  .email-body h5,
  .email-body h6 {
    margin-top: 1.5em;
    margin-bottom: 0.75em;
    font-weight: 600;
    line-height: 1.3;
    color: #18181b;
  }
  .dark .email-body h1,
  .dark .email-body h2,
  .dark .email-body h3,
  .dark .email-body h4,
  .dark .email-body h5,
  .dark .email-body h6 {
    color: #fafafa;
  }
  .email-body h1 { font-size: 1.875rem; }
  .email-body h2 { font-size: 1.5rem; }
  .email-body h3 { font-size: 1.25rem; }
  .email-body h4 { font-size: 1.125rem; }
  .email-body p {
    margin-top: 0;
    margin-bottom: 1em;
  }
  .email-body a {
    color: #7c3aed;
    text-decoration: underline;
    text-underline-offset: 2px;
  }
  .email-body a:hover {
    color: #6d28d9;
  }
  .dark .email-body a {
    color: #a78bfa;
  }
  .dark .email-body a:hover {
    color: #c4b5fd;
  }
  .email-body strong,
  .email-body b {
    font-weight: 600;
    color: #18181b;
  }
  .dark .email-body strong,
  .dark .email-body b {
    color: #fafafa;
  }
  .email-body em,
  .email-body i {
    font-style: italic;
  }
  .email-body ul,
  .email-body ol {
    margin-top: 0;
    margin-bottom: 1em;
    padding-left: 1.625em;
  }
  .email-body li {
    margin-top: 0.375em;
    margin-bottom: 0.375em;
  }
  .email-body ul {
    list-style-type: disc;
  }
  .email-body ol {
    list-style-type: decimal;
  }
  .email-body blockquote {
    margin-top: 1.5em;
    margin-bottom: 1.5em;
    padding-left: 1em;
    border-left: 3px solid #e4e4e7;
    color: #52525b;
    font-style: italic;
  }
  .dark .email-body blockquote {
    border-left-color: #52525b;
    color: #a1a1aa;
  }
  .email-body code {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.875em;
    background: #f4f4f5;
    padding: 0.125em 0.375em;
    border-radius: 4px;
    color: #7c3aed;
  }
  .dark .email-body code {
    background: #27272a;
    color: #a78bfa;
  }
  .email-body pre {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.875em;
    background: #f4f4f5;
    padding: 1em;
    border-radius: 8px;
    overflow-x: auto;
    margin-top: 1em;
    margin-bottom: 1em;
  }
  .dark .email-body pre {
    background: #27272a;
  }
  .email-body pre code {
    background: transparent;
    padding: 0;
  }
  .email-body table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 1.5em;
    margin-bottom: 1.5em;
    font-size: 0.9375em;
  }
  .email-body table th,
  .email-body table td {
    padding: 0.5em 0.75em;
    border: 1px solid #e4e4e7;
    text-align: left;
  }
  .dark .email-body table th,
  .dark .email-body table td {
    border-color: #3f3f46;
  }
  .email-body table th {
    background: #f4f4f5;
    font-weight: 600;
  }
  .dark .email-body table th {
    background: #27272a;
  }
  .email-body img {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
    margin-top: 1em;
    margin-bottom: 1em;
  }
  .email-body hr {
    margin-top: 2em;
    margin-bottom: 2em;
    border: none;
    border-top: 1px solid #e4e4e7;
  }
  .dark .email-body hr {
    border-top-color: #3f3f46;
  }
`;

export const EmailDetail = memo(function EmailDetail({ email, onBack, onReply, onForward }: EmailDetailProps) {
  const { fetchThread } = useEmails();
  const activeThread = useAppStore((state) => state.activeThread);
  const isLoading = useAppStore((state) => state.isLoading);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (email?.threadId) {
      fetchThread(email.threadId);
    }
  }, [email?.threadId, fetchThread]);

  useEffect(() => {
    if (activeThread && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeThread]);

  const displayEmails = useMemo(() => {
    if (!activeThread || activeThread.length === 0 || activeThread[0].threadId !== email?.threadId) {
      return email ? [email] : [];
    }
    return [...activeThread].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [activeThread, email]);

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
      <div className="flex flex-col items-center justify-center h-full">
        <div className="relative mb-6">
          <div className="w-16 h-16 rounded-full border-2 border-neutral-100 dark:border-neutral-800"></div>
          <div className="absolute top-0 left-0 w-16 h-16 rounded-full border-2 border-neutral-900 dark:border-neutral-100 border-t-transparent animate-spin"></div>
          <Loader2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-neutral-400 dark:text-neutral-600 animate-pulse" />
        </div>
        <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400 animate-pulse">Loading conversation...</p>
        <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-2">Please wait while we fetch your messages</p>
      </div>
    );
  }

  if (!email) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800 flex items-center justify-center shadow-sm ring-1 ring-neutral-200/50 dark:ring-neutral-800">
            <div className="relative">
              <ArrowLeft className="w-8 h-8 text-neutral-300 dark:text-neutral-700" />
              <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-accent-500/20 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-accent-500 animate-pulse"></div>
              </div>
            </div>
          </div>
          <div className="absolute -bottom-2 -right-2 w-6 h-6 rounded-full bg-neutral-100 dark:bg-neutral-800 -z-10"></div>
          <div className="absolute -top-1 -left-3 w-4 h-4 rounded-full bg-neutral-100 dark:bg-neutral-800 -z-10"></div>
        </div>
        <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-1">No email selected</h3>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center max-w-xs">
          Choose an email from your inbox to read the full conversation
        </p>
      </div>
    );
  }

  const isThread = displayEmails.length > 1;

  return (
    <>
      <style>{emailProseStyles}</style>
      <div className="flex flex-col h-full bg-white dark:bg-neutral-950">
        <EmailDetailHeader
          email={email}
          isThread={isThread}
          displayEmails={displayEmails}
          onBack={onBack}
          onReply={onReply}
          onForward={onForward}
        />

        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-6 py-6"
        >
          <div className="max-w-4xl mx-auto">
            {visibleEmails.map((msg, index) => (
              <EmailMessageCard
                key={msg.id}
                msg={msg}
                index={index}
                onReply={onReply}
                onForward={onForward}
              />
            ))}

            {hiddenCount > 0 && (
              <div className="flex justify-center my-8">
                <button
                  onClick={toggleExpanded}
                  className={cn(
                    "group flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-full transition-all duration-200",
                    "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300",
                    "hover:bg-neutral-200 dark:hover:bg-neutral-700 hover:shadow-md",
                    "active:scale-95"
                  )}
                >
                  <ChevronDown className={cn(
                    'w-4 h-4 transition-transform duration-300',
                    isExpanded && 'rotate-180'
                  )} />
                  <span>{isExpanded ? 'Show less' : `${hiddenCount} more message${hiddenCount > 1 ? 's' : ''}`}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <QuickReplyBar
          displayEmails={displayEmails}
          onReply={onReply}
          onForward={onForward}
        />
      </div>
    </>
  );
});
