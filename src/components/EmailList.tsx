import { memo } from 'react';
import { Mail, ChevronDown, Loader2 } from 'lucide-react';
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
  const gradientClass = getAvatarGradient(email.from.name || email.from.email);

  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative px-5 py-4 cursor-pointer transition-all duration-300 animate-slide-up min-h-[76px]',
        'border-b border-neutral-200/50 dark:border-neutral-800/50',
        'hover:bg-white/60 dark:hover:bg-neutral-900/60',
        isSelected && 'bg-accent-50/60 dark:bg-accent-950/30 border-l-2 border-l-accent-500',
        email.isUnread ? 'bg-white dark:bg-neutral-950/50' : 'bg-neutral-50/50 dark:bg-neutral-950/30'
      )}
      style={{ animationDelay: `${Math.min(index * 35, 250)}ms` }}
    >
      <div className="flex items-start gap-4">
        {/* Avatar with unique gradient */}
        <Avatar className={cn(
          'w-11 h-11 shrink-0 transition-all duration-300 shadow-md',
          email.isUnread
            ? `bg-gradient-to-br ${gradientClass} text-white shadow-lg shadow-accent-500/20`
            : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
        )}>
          <AvatarFallback className={cn(
            'font-semibold text-sm',
            email.isUnread ? 'bg-transparent text-white' : undefined
          )}>
            {getInitials(email.from.name || email.from.email)}
          </AvatarFallback>
        </Avatar>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3 mb-1">
            <span className={cn(
              'font-medium truncate text-sm transition-colors duration-200',
              email.isUnread ? 'text-neutral-900 dark:text-white' : 'text-neutral-600 dark:text-neutral-400 font-normal'
            )}>
              {email.from.name || email.from.email}
            </span>
            <span className={cn(
              'text-xs shrink-0 tabular-nums transition-colors duration-200',
              email.isUnread ? 'text-accent-600 dark:text-accent-400 font-medium' : 'text-neutral-400 dark:text-neutral-500'
            )}>
              {formatDate(email.date)}
            </span>
          </div>

          <div className={cn(
            'text-sm mb-1.5 truncate transition-all duration-200',
            email.isUnread ? 'font-semibold text-neutral-900 dark:text-white' : 'text-neutral-700 dark:text-neutral-300'
          )}>
            {email.subject}
          </div>

          <div className="text-sm text-neutral-500 dark:text-neutral-500 truncate flex items-center gap-1.5">
            {truncate(email.snippet || email.body, 85)}
          </div>
        </div>

        {/* Unread indicator */}
        {email.isUnread && (
          <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-accent-500 to-accent-600 shrink-0 mt-2 shadow-md shadow-accent-500/30 animate-pulse-soft" />
        )}
      </div>

      {/* Hover effect - subtle gradient shimmer */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-accent-500/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none animate-shimmer" />
    </div>
  );
});

EmailItem.displayName = 'EmailItem';

export function EmailList({ emails, selectedId, onSelectEmail, pagination, onLoadMore }: EmailListProps) {
  const hasMore = pagination?.hasMore && emails.length > 0;
  const isLoading = pagination?.isLoading ?? false;

  if (emails.length === 0) {
    return (
      <div className="w-full flex flex-col items-center justify-center h-full text-neutral-400 dark:text-neutral-600 p-8 animate-fade-in">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-900 flex items-center justify-center mb-5 shadow-inner">
          <Mail className="w-10 h-10 text-neutral-400 dark:text-neutral-600" />
        </div>
        <p className="text-lg font-semibold text-neutral-700 dark:text-neutral-300">No emails found</p>
        <p className="text-sm mt-2 text-neutral-500 dark:text-neutral-500">Your inbox is empty</p>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto h-full flex flex-col bg-white/30 dark:bg-neutral-950/30 backdrop-blur-sm">
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
        <div className="p-4 border-t border-neutral-200/50 dark:border-neutral-800/50">
          <button
            onClick={onLoadMore}
            disabled={isLoading}
            className={cn(
              'w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl',
              'font-medium text-sm transition-all duration-300',
              'bg-neutral-100 dark:bg-neutral-800/50',
              'text-neutral-700 dark:text-neutral-300',
              'hover:bg-neutral-200 dark:hover:bg-neutral-700/50',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'active:scale-[0.98]',
              'border border-neutral-200/50 dark:border-neutral-700/50'
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
