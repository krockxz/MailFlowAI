import { memo } from 'react';
import { Mail, MailOpen } from 'lucide-react';
import { formatDate, truncate } from '@/lib/utils';
import type { Email } from '@/types/email';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';

interface EmailListProps {
  emails: Email[];
  selectedId: string | null;
  onSelectEmail: (email: Email) => void;
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
        'group relative p-4 border-b border-zinc-100 dark:border-zinc-800 cursor-pointer transition-all duration-200 animate-slide-up',
        'hover:bg-zinc-50 dark:hover:bg-zinc-800/50',
        isSelected && 'bg-blue-50/50 dark:bg-blue-900/10',
        email.isUnread ? 'bg-white dark:bg-zinc-900' : 'bg-zinc-50/30 dark:bg-zinc-900/50'
      )}
      style={{ animationDelay: `${Math.min(index * 30, 200)}ms` }}
    >
      {/* Selection indicator */}
      <div className={cn(
        'absolute left-0 top-0 bottom-0 w-1 transition-all duration-200',
        isSelected ? 'bg-blue-500' : 'bg-transparent group-hover:bg-blue-300'
      )} />

      <div className="flex items-start gap-4 pl-2">
        {/* Avatar */}
        <Avatar className={cn(
          'w-11 h-11 shrink-0 transition-all duration-200',
          email.isUnread
            ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25'
            : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
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

export function EmailList({ emails, selectedId, onSelectEmail }: EmailListProps) {
  if (emails.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-zinc-400 dark:text-zinc-600 p-8 animate-fade-in">
        <div className="w-20 h-20 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
          <Mail className="w-10 h-10" />
        </div>
        <p className="text-lg font-medium text-zinc-700 dark:text-zinc-300">No emails found</p>
        <p className="text-sm mt-1">Your inbox is empty</p>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto h-full">
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
  );
}
