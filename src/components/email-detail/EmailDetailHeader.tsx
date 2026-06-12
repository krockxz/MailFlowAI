import { ArrowLeft, Reply, Forward, MoreVertical, Star, Archive, Trash2 } from 'lucide-react';
import type { Email } from '@/types/email';
import { useEmails } from '@/hooks/useEmails';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ThreadParticipantsRow } from '@/components/ThreadParticipantsRow';
import { cn } from '@/lib/utils';

interface EmailDetailHeaderProps {
  email: Email;
  isThread: boolean;
  displayEmails: Email[];
  onBack: () => void;
  onReply?: (emailId: string) => void;
  onForward?: (emailId: string) => void;
}

export function EmailDetailHeader({ email, isThread, displayEmails, onBack, onReply, onForward }: EmailDetailHeaderProps) {
  const { starEmail, archiveEmail, deleteEmail } = useEmails();
  const isStarred = email.labels?.includes('STARRED');
  return (
    <header className="border-b border-neutral-200 dark:border-neutral-800 px-6 py-4 shrink-0 bg-white dark:bg-neutral-950 sticky top-0 z-10">
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          onClick={onBack}
          className="h-9 px-3 gap-2 text-neutral-500 hover:text-white hover:bg-neutral-900 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back</span>
        </Button>

        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onReply?.(email.id)}
            className="h-9 w-9 text-neutral-500 hover:text-white hover:bg-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-900 dark:hover:bg-neutral-200 rounded-lg transition-colors"
            title="Reply"
          >
            <Reply className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onForward?.(email.id)}
            className="h-9 w-9 text-neutral-500 hover:text-white hover:bg-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-900 dark:hover:bg-neutral-200 rounded-lg transition-colors"
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
                className="h-9 w-9 text-neutral-500 hover:text-white hover:bg-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-900 dark:hover:bg-neutral-200 rounded-lg transition-colors"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => starEmail(email.id)} className="gap-2 cursor-pointer">
                <Star className={cn('w-4 h-4', isStarred ? 'fill-amber-400 text-amber-400' : 'text-neutral-500')} />
                <span>{isStarred ? 'Unstar' : 'Star'}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => archiveEmail(email.id)} className="gap-2 cursor-pointer">
                <Archive className="w-4 h-4 text-neutral-500" />
                <span>Archive</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => deleteEmail(email.id)} className="gap-2 cursor-pointer text-error">
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="mb-3">
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-white leading-snug tracking-tight">
          {email.subject || '(no subject)'}
        </h1>
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

      {isThread && (
        <ThreadParticipantsRow messages={displayEmails} />
      )}
    </header>
  );
}
