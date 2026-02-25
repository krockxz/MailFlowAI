import { useEffect, useRef, useMemo, memo, useState, useCallback } from 'react';
import { ArrowLeft, Reply, Forward, Loader2, ChevronDown, Send, MoreVertical, Star, Archive, Trash2 } from 'lucide-react';
import { formatFullDate, getInitials, getAvatarColor } from '@/lib/utils';
import type { Email } from '@/types/email';
import { useEmails } from '@/hooks/useEmails';
import { useAppStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { ThreadParticipantsRow } from '@/components/ThreadParticipantsRow';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface EmailDetailProps {
  email: Email | null;
  onBack: () => void;
  onReply?: (emailId: string) => void;
  onForward?: (emailId: string) => void;
}

const COLLAPSE_THRESHOLD = 3;

// Custom prose styles for HTML email rendering (Tailwind typography plugin not installed)
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
      <div className="flex flex-col items-center justify-center h-full">
        {/* Animated loading ring */}
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
        {/* Empty state illustration */}
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800 flex items-center justify-center shadow-sm ring-1 ring-neutral-200/50 dark:ring-neutral-800">
            <div className="relative">
              <ArrowLeft className="w-8 h-8 text-neutral-300 dark:text-neutral-700" />
              <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-accent-500/20 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-accent-500 animate-pulse"></div>
              </div>
            </div>
          </div>
          {/* Decorative elements */}
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
        {/* Premium Header with Glass Effect */}
        <header className="border-b border-neutral-200/60 dark:border-neutral-800/60 px-6 py-4 shrink-0 backdrop-blur-xl bg-white/80 dark:bg-neutral-950/80 sticky top-0 z-10">
          {/* Top action bar */}
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              onClick={onBack}
              className="h-9 px-3 gap-2 text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all duration-200 rounded-lg"
            >
              <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
              <span className="text-sm font-medium">Back</span>
            </Button>

            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onReply?.(email.id)}
                className="h-9 w-9 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all duration-200 rounded-lg"
                title="Reply"
              >
                <Reply className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onForward?.(email.id)}
                className="h-9 w-9 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all duration-200 rounded-lg"
                title="Forward"
              >
                <Forward className="w-4 h-4" />
              </Button>

              <div className="w-px h-5 bg-neutral-200 dark:bg-neutral-700 mx-1"></div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all duration-200 rounded-lg"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem className="gap-2 cursor-pointer">
                    <Star className="w-4 h-4 text-neutral-500" />
                    <span>Star</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2 cursor-pointer">
                    <Archive className="w-4 h-4 text-neutral-500" />
                    <span>Archive</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2 cursor-pointer text-error">
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Subject with labels */}
          <div className="mb-3">
            <h1 className="text-xl font-semibold text-neutral-900 dark:text-white leading-snug tracking-tight">
              {email.subject || '(no subject)'}
            </h1>
            {/* Labels/Tags */}
            <div className="flex items-center gap-2 mt-2">
              {email.labels?.filter(l => l !== 'INBOX' && l !== 'SENT').map(label => (
                <span
                  key={label}
                  className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                >
                  {label.toLowerCase()}
                </span>
              ))}
              {email.isUnread && (
                <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-accent-500/10 text-accent-600 dark:text-accent-400 border border-accent-500/20">
                  Unread
                </span>
              )}
            </div>
          </div>

          {/* Thread Participants */}
          {isThread && (
            <ThreadParticipantsRow messages={displayEmails} />
          )}
        </header>

        {/* Messages List */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-6 py-6"
        >
          <div className="max-w-4xl mx-auto">
            {visibleEmails.map((msg, index) => {
              const avatarColor = getAvatarColor(msg.from.email);

              return (
                <div
                  key={msg.id}
                  className={cn(
                    'relative group transition-all duration-300',
                    // Thread styling for nested messages
                    index > 0 && 'mt-8',
                    index > 0 && 'pl-8',
                    index > 0 && 'border-l-2 border-neutral-100 dark:border-neutral-800/50',
                    index > 0 && 'hover:border-neutral-200 dark:hover:border-neutral-700'
                  )}
                >
                  {/* Connection dot for thread */}
                  {index > 0 && (
                    <div className="absolute left-0 top-8 w-2 h-2 -translate-x-[5px] rounded-full bg-neutral-200 dark:bg-neutral-700 group-hover:bg-accent-500 transition-colors duration-200"></div>
                  )}

                  {/* Message Card */}
                  <div className={cn(
                    'bg-white dark:bg-neutral-950 rounded-xl transition-all duration-200',
                    index > 0 && 'hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30'
                  )}>
                    {/* Message Header */}
                    <div className="flex items-start gap-4 mb-5">
                      {/* Avatar with gradient */}
                      <Avatar className={cn(
                        "w-11 h-11 shrink-0 ring-2 ring-white dark:ring-neutral-900 shadow-sm transition-transform duration-200",
                        "group-hover:scale-105"
                      )}>
                        <AvatarFallback className={cn(
                          "text-sm font-semibold text-white",
                          avatarColor
                        )}>
                          {getInitials(msg.from.name || msg.from.email)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex items-baseline justify-between gap-4 mb-1.5">
                          <span className="font-semibold text-sm text-neutral-900 dark:text-white tracking-tight">
                            {msg.from.name || msg.from.email}
                          </span>
                          <span className="text-xs shrink-0 text-neutral-500 dark:text-neutral-500 tabular-nums font-medium">
                            {formatFullDate(msg.date)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
                          <span className="truncate">{msg.from.email}</span>
                          <span className="shrink-0 text-neutral-300 dark:text-neutral-600">
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M5 12h14M12 5l7 7-7 7"/>
                            </svg>
                          </span>
                          <span className="truncate text-neutral-600 dark:text-neutral-400">
                            {msg.to?.map(t => t.name || t.email).join(', ') || 'undisclosed recipients'}
                          </span>
                        </div>

                        {/* CC display if exists */}
                        {msg.cc && msg.cc.length > 0 && (
                          <div className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
                            cc: {msg.cc.map(t => t.name || t.email).join(', ')}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Message Body */}
                    <div className="pl-[3.25rem]">
                      {msg.bodyIsHtml ? (
                        <div
                          className="email-body"
                          dangerouslySetInnerHTML={{ __html: msg.body }}
                        />
                      ) : (
                        <div className="text-[15px] leading-7 text-neutral-800 dark:text-neutral-300 whitespace-pre-wrap font-normal">
                          {msg.body}
                        </div>
                      )}
                    </div>

                    {/* Message Actions - Show on Hover */}
                    <div className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1.5 -mt-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onReply?.(msg.id)}
                        className="h-8 px-3 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-all duration-200"
                      >
                        <Reply className="w-3.5 h-3.5 mr-1.5" />
                        Reply
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onForward?.(msg.id)}
                        className="h-8 px-3 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-all duration-200"
                      >
                        <Forward className="w-3.5 h-3.5 mr-1.5" />
                        Forward
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Collapse/Expand Button */}
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

        {/* Premium Quick Reply Bar */}
        {onReply && displayEmails.length > 0 && (
          <div className="border-t border-neutral-200/60 dark:border-neutral-800/60 p-5 shrink-0 backdrop-blur-xl bg-white/80 dark:bg-neutral-950/80">
            <div className="max-w-4xl mx-auto">
              <Button
                onClick={() => onReply(displayEmails[displayEmails.length - 1].id)}
                className={cn(
                  "w-full justify-start h-12 px-5 rounded-xl transition-all duration-200",
                  "bg-gradient-to-r from-neutral-100 to-neutral-50 dark:from-neutral-800 dark:to-neutral-900",
                  "text-neutral-700 dark:text-neutral-300",
                  "hover:from-neutral-200 hover:to-neutral-100 dark:hover:from-neutral-700 dark:hover:to-neutral-800",
                  "border border-neutral-200 dark:border-neutral-700",
                  "shadow-sm hover:shadow-md",
                  "active:scale-[0.99]"
                )}
              >
                <Send className="w-4 h-4 mr-3 text-neutral-500 dark:text-neutral-400" />
                <span className="text-sm">
                  Reply to <span className="font-medium text-neutral-900 dark:text-neutral-100">
                    {displayEmails[displayEmails.length - 1].from.name || 'sender'}
                  </span>...
                </span>
                <span className="ml-auto text-xs text-neutral-400 dark:text-neutral-500 flex items-center gap-1">
                  Press
                  <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 font-mono text-[10px]">
                    R
                  </kbd>
                  to reply
                </span>
              </Button>

              {/* Quick action shortcuts */}
              <div className="flex items-center justify-center gap-6 mt-4">
                <button
                  onClick={() => onReply?.(displayEmails[displayEmails.length - 1].id)}
                  className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors duration-200"
                >
                  <Reply className="w-3.5 h-3.5" />
                  <span>Reply</span>
                </button>
                <button
                  onClick={() => onForward?.(displayEmails[displayEmails.length - 1].id)}
                  className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors duration-200"
                >
                  <Forward className="w-3.5 h-3.5" />
                  <span>Forward</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
});
