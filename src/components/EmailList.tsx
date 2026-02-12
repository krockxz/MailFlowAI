import { memo, useCallback } from 'react';
import { Mail, ChevronDown, Loader2 } from 'lucide-react';
import { cn, formatDate, getInitials, truncate } from '@/lib/utils';
import type { Email } from '@/types/email';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
  onClick
}: {
  email: Email;
  isSelected: boolean;
  onClick: () => void;
}) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative px-4 py-3 cursor-pointer transition-colors border-b',
        'border-neutral-200 dark:border-neutral-800',
        'hover:bg-neutral-50 dark:hover:bg-neutral-900/50',
        isSelected && 'bg-neutral-100 dark:bg-neutral-900',
        email.isUnread ? 'bg-white dark:bg-neutral-950' : 'bg-neutral-50/50 dark:bg-neutral-950/50'
      )}
      role="button"
      tabIndex={0}
      aria-selected={isSelected}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <Avatar className="w-8 h-8 shrink-0">
          <AvatarFallback className={cn(
            'text-xs font-medium',
            email.isUnread
              ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
              : 'bg-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
          )}>
            {getInitials(email.from.name || email.from.email)}
          </AvatarFallback>
        </Avatar>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className={cn(
              'text-sm truncate',
              email.isUnread ? 'font-semibold text-neutral-900 dark:text-white' : 'font-medium text-neutral-600 dark:text-neutral-400'
            )}>
              {email.from.name || email.from.email}
            </span>
            <span className="text-xs shrink-0 text-neutral-500 dark:text-neutral-500 tabular-nums">
              {formatDate(email.date)}
            </span>
          </div>

          <div className={cn(
            'text-sm truncate',
            email.isUnread ? 'font-medium text-neutral-900 dark:text-white' : 'text-neutral-600 dark:text-neutral-400'
          )}>
            {email.subject}
          </div>

          <div className="text-sm text-neutral-500 dark:text-neutral-500 truncate">
            {truncate(email.snippet || email.body, 85)}
          </div>
        </div>

        {/* Unread indicator */}
        {email.isUnread && (
          <div className="w-2 h-2 rounded-full bg-neutral-900 dark:bg-white shrink-0 mt-2" />
        )}
      </div>
    </div>
  );
});

EmailItem.displayName = 'EmailItem';

export const EmailList = memo(function EmailList({ emails, selectedId, onSelectEmail, pagination, onLoadMore }: EmailListProps) {
  const hasMore = pagination?.hasMore && emails.length > 0;
  const isLoading = pagination?.isLoading ?? false;

  const handleLoadMore = useCallback(() => {
    onLoadMore?.();
  }, [onLoadMore]);

  if (emails.length === 0) {
    return (
      <div className="w-full flex flex-col items-center justify-center h-full text-neutral-500 dark:text-neutral-400 p-8">
        <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center mb-4">
          <Mail className="w-5 h-5 text-neutral-400 dark:text-neutral-600" />
        </div>
        <p className="text-sm">No emails found</p>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto h-full flex flex-col bg-white dark:bg-neutral-950">
      <div className="flex-1">
        {emails.map((email) => (
          <EmailItem
            key={email.id}
            email={email}
            isSelected={selectedId === email.id}
            onClick={() => onSelectEmail(email)}
          />
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800">
          <button
            onClick={handleLoadMore}
            disabled={isLoading}
            className={cn(
              'w-full flex items-center justify-center gap-2 px-4 py-2 font-medium text-sm transition-colors',
              'bg-white dark:bg-neutral-900',
              'border border-neutral-300 dark:border-neutral-700',
              'hover:bg-neutral-50 dark:hover:bg-neutral-800',
              'text-neutral-700 dark:text-neutral-300',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading...
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
});
