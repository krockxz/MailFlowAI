import { memo, useCallback } from 'react';
import { ChevronDown, Inbox } from 'lucide-react';
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
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className={cn(
        'group relative px-5 py-4 cursor-pointer transition-all duration-300 ease-out border-b',
        'border-neutral-100 dark:border-neutral-800/50',
        // Base states
        email.isUnread
          ? 'bg-white dark:bg-neutral-950'
          : 'bg-neutral-50/30 dark:bg-neutral-950/30',
        // Hover states - enhanced lift effect
        'hover:bg-gradient-to-r hover:from-neutral-50 hover:to-white dark:hover:from-neutral-900/40 dark:hover:to-neutral-950/60',
        'hover:shadow-lg hover:shadow-neutral-200/50 dark:hover:shadow-black',
        'hover:-translate-y-0.5 hover:scale-[1.005]',
        'hover:z-10',
        // Selected states - premium feedback
        isSelected && 'bg-gradient-to-r from-neutral-100 to-neutral-50 dark:from-neutral-900/70 dark:to-neutral-800/40',
        isSelected && 'shadow-xl shadow-neutral-300/40 dark:shadow-black',
        isSelected && 'translate-y-px scale-[1.005] z-10',
        isSelected && 'border-l-2 border-l-neutral-400 dark:border-l-neutral-600'
      )}
      role="button"
      tabIndex={0}
      aria-selected={isSelected}
    >
      <div className="flex items-start gap-4">
        {/* Avatar with enhanced hover effects */}
        <div className="relative shrink-0">
          <Avatar className={cn(
            'w-10 h-10 transition-all duration-300 ease-out',
            'group-hover:shadow-xl group-hover:shadow-neutral-400/20 dark:group-hover:shadow-white/10',
            'group-hover:scale-110 group-hover:rotate-3'
          )}>
            <AvatarFallback className={cn(
              'text-xs font-semibold transition-all duration-300',
              'shadow-inner',
              email.isUnread
                ? 'bg-gradient-to-br from-neutral-800 via-neutral-700 to-neutral-900 text-white dark:from-neutral-100 dark:via-white dark:to-neutral-200 dark:text-neutral-900'
                : 'bg-gradient-to-br from-neutral-200 via-neutral-100 to-neutral-300 text-neutral-600 dark:from-neutral-800 dark:via-neutral-700 dark:to-neutral-900 dark:text-neutral-400',
              'group-hover:bg-gradient-to-br group-hover:from-neutral-700 group-hover:to-neutral-800 dark:group-hover:from-white dark:group-hover:to-neutral-100'
            )}>
              {getInitials(email.from.name || email.from.email)}
            </AvatarFallback>
          </Avatar>
          {/* Subtle ring on hover */}
          <div className={cn(
            'absolute -inset-0.5 rounded-full opacity-0 transition-opacity duration-300',
            'bg-gradient-to-br from-neutral-400/20 to-neutral-600/20 dark:from-white/10 dark:to-neutral-400/10',
            'group-hover:opacity-100'
          )} />
        </div>

        {/* Content with refined typography */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3 mb-1">
            <span className={cn(
              'text-sm truncate transition-all duration-200',
              email.isUnread
                ? 'font-bold text-neutral-900 dark:text-white tracking-tight'
                : 'font-medium text-neutral-600 dark:text-neutral-400'
            )}>
              {email.from.name || email.from.email}
            </span>
            <span className="text-xs shrink-0 text-neutral-400 dark:text-neutral-500 tabular-nums font-medium">
              {formatDate(email.date)}
            </span>
          </div>

          <div className={cn(
            'text-sm truncate mb-1 transition-all duration-200',
            email.isUnread
              ? 'font-semibold text-neutral-800 dark:text-neutral-100'
              : 'text-neutral-600 dark:text-neutral-400 font-medium'
          )}>
            {email.subject}
          </div>

          <div className="text-sm text-neutral-500 dark:text-neutral-500 truncate leading-relaxed">
            {truncate(email.snippet || email.body, 75)}
          </div>
        </div>

        {/* Enhanced unread indicator */}
        {email.isUnread && (
          <div className="shrink-0 mt-2 relative">
            <div className={cn(
              'w-2 h-2 rounded-full transition-all duration-300 ease-out',
              'bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500',
              'shadow-md shadow-blue-500/30 dark:shadow-blue-400/40',
              'group-hover:scale-125 group-hover:shadow-lg group-hover:shadow-blue-500/50'
            )} />
            {/* Animated pulse glow */}
            <div className={cn(
              'absolute inset-0 w-2 h-2 rounded-full bg-blue-500 dark:bg-blue-400',
              'animate-ping opacity-20'
            )} />
          </div>
        )}
      </div>

      {/* Premium selection indicator with gradient */}
      {isSelected && (
        <>
          <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-neutral-900 via-neutral-700 to-neutral-900 dark:from-white dark:via-neutral-300 dark:to-white" />
          {/* Glow effect */}
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-neutral-900/20 to-neutral-900/20 dark:from-white/20 dark:to-white/20 blur-sm" />
        </>
      )}
    </div>
  );
});

EmailItem.displayName = 'EmailItem';

// Premium Skeleton Loader
const EmailSkeleton = memo(() => (
  <div className="px-5 py-4 border-b border-neutral-100 dark:border-neutral-800/50 animate-pulse">
    <div className="flex items-start gap-4">
      {/* Avatar skeleton */}
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neutral-200 to-neutral-100 dark:from-neutral-800 dark:to-neutral-700" />

      {/* Content skeleton */}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center justify-between gap-3">
          <div className="h-4 w-32 bg-neutral-200 dark:bg-neutral-800 rounded-sm" />
          <div className="h-3 w-16 bg-neutral-200 dark:bg-neutral-800 rounded-sm shrink-0" />
        </div>
        <div className="h-4 w-3/4 bg-neutral-200 dark:bg-neutral-800 rounded-sm" />
        <div className="h-3 w-full bg-neutral-100 dark:bg-neutral-800/50 rounded-sm" />
      </div>

      {/* Unread dot skeleton */}
      <div className="w-2 h-2 rounded-full bg-neutral-200 dark:bg-neutral-800" />
    </div>
  </div>
));

EmailSkeleton.displayName = 'EmailSkeleton';

export const EmailList = memo(function EmailList({ emails, selectedId, onSelectEmail, pagination, onLoadMore }: EmailListProps) {
  const hasMore = pagination?.hasMore && emails.length > 0;
  const isLoading = pagination?.status === 'loading';
  const isInitialLoading = isLoading && emails.length === 0;

  const handleLoadMore = useCallback(() => {
    onLoadMore?.();
  }, [onLoadMore]);

  if (isInitialLoading) {
    return (
      <div className="w-full h-full flex flex-col bg-white dark:bg-neutral-950">
        {/* Skeleton items */}
        {[...Array(8)].map((_, i) => (
          <EmailSkeleton key={`skeleton-${i}`} />
        ))}
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <div className="w-full flex flex-col items-center justify-center h-full px-8 bg-white dark:bg-neutral-950">
        {/* Animated icon container */}
        <div className="relative mb-6">
          {/* Floating background circles */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-neutral-100 dark:bg-neutral-900 animate-pulse" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-18 h-18 rounded-full bg-neutral-50 dark:bg-neutral-800/50 animate-ping opacity-20" />
          </div>

          {/* Main icon */}
          <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-900 dark:to-neutral-800 flex items-center justify-center shadow-lg shadow-neutral-200/50 dark:shadow-black">
            <Inbox className="w-9 h-9 text-neutral-400 dark:text-neutral-500" />
          </div>

          {/* Decorative dots */}
          <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-neutral-300 dark:bg-neutral-700 animate-bounce" style={{ animationDelay: '0s' }} />
          <div className="absolute -bottom-1 -left-1 w-2 h-2 rounded-full bg-neutral-300 dark:bg-neutral-700 animate-bounce" style={{ animationDelay: '0.2s' }} />
        </div>

        {/* Typography hierarchy */}
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            No emails found
          </h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-[200px]">
            Your inbox is empty or no emails match your filters
          </p>
        </div>
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

      {/* Load More Button - Premium styling */}
      {hasMore && (
        <div className="p-5 border-t border-neutral-100 dark:border-neutral-800/50 bg-neutral-50/50 dark:bg-neutral-900/30">
          <button
            onClick={handleLoadMore}
            disabled={isLoading}
            className={cn(
              'group relative w-full flex items-center justify-center gap-2.5 px-5 py-3 font-medium text-sm',
              'transition-all duration-300 ease-out',
              // Base styling
              'bg-white dark:bg-neutral-900',
              'border border-neutral-200 dark:border-neutral-700',
              'rounded-xl shadow-sm shadow-neutral-200/50 dark:shadow-black',
              // Hover states
              'hover:bg-gradient-to-r hover:from-white hover:to-neutral-50',
              'dark:hover:from-neutral-900 dark:hover:to-neutral-800',
              'hover:shadow-lg hover:shadow-neutral-300/50 dark:hover:shadow-neutral-700/30',
              'hover:-translate-y-0.5',
              'hover:border-neutral-300 dark:hover:border-neutral-600',
              // Active states
              'active:translate-y-0 active:shadow-md',
              // Disabled states
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'disabled:hover:translate-y-0 disabled:hover:shadow-sm',
              'text-neutral-700 dark:text-neutral-300'
            )}
          >
            {/* Subtle gradient overlay on hover */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-neutral-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>Loading more emails...</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 transition-transform duration-300 group-hover:translate-y-0.5" />
                <span>Load More</span>
                <span className="text-neutral-400 dark:text-neutral-500 text-xs font-normal">
                  ({pagination?.total ?? emails.length} total)
                </span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
});
