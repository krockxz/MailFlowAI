import { memo } from 'react';
import { Mail, MailOpen } from 'lucide-react';
import { formatDate, truncate, getInitials } from '@/lib/utils';
import type { Email } from '@/types/email';
import { cn } from '@/lib/utils';

interface EmailListProps {
  emails: Email[];
  selectedId: string | null;
  onSelectEmail: (email: Email) => void;
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
        'p-4 border-b border-gray-100 cursor-pointer transition-colors',
        'hover:bg-gray-50',
        isSelected ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'border-l-4 border-l-transparent',
        email.isUnread ? 'bg-white' : 'bg-gray-50/50'
      )}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium shrink-0',
          email.isUnread ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
        )}>
          {getInitials(email.from.name || email.from.email)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className={cn(
              'font-medium truncate',
              email.isUnread ? 'text-gray-900' : 'text-gray-600 font-normal'
            )}>
              {email.from.name || email.from.email}
            </span>
            <span className={cn(
              'text-xs shrink-0',
              email.isUnread ? 'text-gray-900' : 'text-gray-500'
            )}>
              {formatDate(email.date)}
            </span>
          </div>

          <div className={cn(
            'text-sm mb-1 truncate',
            email.isUnread ? 'font-semibold text-gray-900' : 'text-gray-700'
          )}>
            {email.subject}
          </div>

          <div className="text-sm text-gray-500 truncate">
            {email.isUnread ? (
              <span className="flex items-center gap-1">
                <MailOpen className="w-3 h-3" />
                {truncate(email.snippet || email.body, 80)}
              </span>
            ) : (
              truncate(email.snippet || email.body, 80)
            )}
          </div>
        </div>

        {/* Unread indicator */}
        {email.isUnread && (
          <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-2" />
        )}
      </div>
    </div>
  );
});

EmailItem.displayName = 'EmailItem';

export function EmailList({ emails, selectedId, onSelectEmail }: EmailListProps) {
  if (emails.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
        <Mail className="w-16 h-16 mb-4 text-gray-300" />
        <p className="text-lg font-medium">No emails found</p>
        <p className="text-sm">Your inbox is empty</p>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto h-full">
      {emails.map((email) => (
        <EmailItem
          key={email.id}
          email={email}
          isSelected={selectedId === email.id}
          onClick={() => onSelectEmail(email)}
        />
      ))}
    </div>
  );
}
