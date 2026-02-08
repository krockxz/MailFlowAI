import { memo } from 'react';
import { Mail, MailOpen, ChevronDown, Loader2 } from 'lucide-react';
import { formatDate, truncate } from '@/lib/utils';
import type { Email } from '@/types/email';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import type { FolderPaginationState } from '@/types/email';

interface EmailListProps {
  emails: Email[];
  selectedId: string | null;
  onSelectEmail: (email: Email) => void;
  pagination?: FolderPaginationState;
  onLoadMore?: () => void;
}

const EmailItem = memo(({
  email,
  isSelected,
  onClick,
  index
}: {
  email: Email;
  isSelected: boolean;
  onClick: () => void;
  index: number;
}) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative p-4 border-b border-neutral-200 dark:border-neutral-800 cursor-pointer transition-all duration-200 animate-slide-up',
        'hover:bg-neutral-100 dark:hover:bg-neutral-800/50',
        isSelected && 'bg-accent-50/50 dark:bg-accent-950/30 border-l-2 border-l-accent-500',
        email.isUnread ? 'bg-neutral-50 dark:bg-neutral-950' : 'bg-neutral-50/30 dark:bg-neutral-950/50'
      )}
      style={{ animationDelay: `${Math.min(index * 30, 200)}ms` }}
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <Avatar className={cn(
          'w-11 h-11 shrink-0 transition-all duration-200',
          email.isUnread
            ? 'bg-gradient-to-br from-accent-500 to-accent-600 text-white shadow-lg shadow-accent-500/25'
            : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
        )}>
          <AvatarFallback className={cn(
            email.isUnread ? 'bg-transparent text-white' : undefined
          )}>
            {getInitials(email.from.name || email.from.email)}
          </AvatarFallback>
        </Avatar>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3 mb-1">
            <span className={cn(
              'font-medium truncate text-sm',
              email.isUnread ? 'text-zinc-900 dark:text-white' : 'text-zinc-600 dark:text-zinc-400 font-normal'
            )}>
              {email.from.name || email.from.email}
            </span>
            <span className={cn(
              'text-xs shrink-0 tabular-nums',
              email.isUnread ? 'text-zinc-900 dark:text-white font-medium' : 'text-zinc-400 dark:text-zinc-500'
            )}>
              {formatDate(email.date)}
            </span>
          </div>

          <div className={cn(
            'text-sm mb-1.5 truncate transition-all duration-200',
            email.isUnread ? 'font-semibold text-zinc-900 dark:text-white' : 'text-zinc-700 dark:text-zinc-300'
          )}>
            {email.subject}
          </div>

          <div className="text-sm text-zinc-500 dark:text-zinc-500 truncate flex items-center gap-1.5">
            {email.isUnread ? (
              <>
                <MailOpen className="w-3.5 h-3.5 shrink-0 opacity-60" />
                {truncate(email.snippet || email.body, 80)}
              </>
            ) : (
              truncate(email.snippet || email.body, 85)
            )}
          </div>
        </div>

        {/* Unread dot */}
        {email.isUnread && (
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0 mt-2 shadow-lg shadow-blue-500/40" />
        )}
      </div>
    </div>
  );
});

EmailItem.displayName = 'EmailItem';

export function EmailList({ emails, selectedId, onSelectEmail, pagination, onLoadMore }: EmailListProps) {
  const hasMore = pagination?.hasMore && emails.length > 0;
  const isLoading = pagination?.isLoading ?? false;

  if (emails.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-neutral-400 dark:text-neutral-600 p-8 animate-fade-in">
        <div className="w-20 h-20 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
          <Mail className="w-10 h-10" />
        </div>
        <p className="text-lg font-medium text-neutral-700 dark:text-neutral-300">No emails found</p>
        <p className="text-sm mt-1">Your inbox is empty</p>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto h-full flex flex-col">
      <div className="flex-1">
        {emails.map((email, index) => (
          <EmailItem
            key={email.id}
            email={email}
            isSelected={selectedId === email.id}
            onClick={() => onSelectEmail(email)}
            index={index}
          />
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && onLoadMore && (
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800">
          <button
            onClick={onLoadMore}
            disabled={isLoading}
            className={cn(
              'w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg',
              'font-medium text-sm transition-all duration-200',
              'bg-neutral-100 dark:bg-neutral-800',
              'text-neutral-700 dark:text-neutral-300',
              'hover:bg-neutral-200 dark:hover:bg-neutral-700',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'active:scale-[0.98]'
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading more emails...
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Load More
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
