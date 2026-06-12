import { Reply, Forward } from 'lucide-react';
import { formatFullDate, getInitials, getAvatarColor, cn } from '@/lib/utils';
import type { Email } from '@/types/email';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import DOMPurify from 'dompurify';

interface EmailMessageCardProps {
  msg: Email;
  index: number;
  onReply?: (emailId: string) => void;
  onForward?: (emailId: string) => void;
}

export function EmailMessageCard({ msg, index, onReply, onForward }: EmailMessageCardProps) {
  const avatarColor = getAvatarColor(msg.from.email);

  return (
    <div
      className={cn(
        'relative group',
        index > 0 && 'mt-8',
        index > 0 && 'pl-8',
        index > 0 && 'border-l-2 border-neutral-100 dark:border-neutral-800/50'
      )}
    >
      {index > 0 && (
        <div className="absolute left-0 top-8 w-2 h-2 -translate-x-[5px] rounded-full bg-neutral-200 dark:bg-neutral-700" />
      )}

      <div className="bg-white dark:bg-neutral-950 rounded-xl">
        <div className="flex items-start gap-4 mb-4">
          <Avatar className={cn(
            "w-10 h-10 shrink-0 ring-2 ring-white dark:ring-neutral-900"
          )}>
            <AvatarFallback className={cn(
              "text-sm font-semibold text-white",
              avatarColor
            )}>
              {getInitials(msg.from.name || msg.from.email)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0 pt-0.5">
            <div className="flex items-baseline justify-between gap-4 mb-1">
              <span className="font-semibold text-sm text-neutral-900 dark:text-white">
                {msg.from.name || msg.from.email}
              </span>
              <span className="text-xs shrink-0 text-neutral-400 dark:text-neutral-500 tabular-nums">
                {formatFullDate(msg.date)}
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
              <span className="truncate">{msg.from.email}</span>
              {msg.to && msg.to.length > 0 && (
                <>
                  <span className="shrink-0 text-neutral-300 dark:text-neutral-600">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </span>
                  <span className="truncate">{msg.to.map(t => t.name || t.email).join(', ')}</span>
                </>
              )}
            </div>

            {msg.cc && msg.cc.length > 0 && (
              <div className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
                cc: {msg.cc.map(t => t.name || t.email).join(', ')}
              </div>
            )}
          </div>
        </div>

        <div className="pl-[2.75rem]">
          {msg.bodyIsHtml ? (
            <div
              className="email-body"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(msg.body) }}
            />
          ) : (
            <div className="text-[15px] leading-7 text-neutral-800 dark:text-neutral-300 whitespace-pre-wrap font-normal">
              {msg.body}
            </div>
          )}
        </div>

        <div className="pl-[2.75rem] mt-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onReply?.(msg.id)}
            className="h-7 px-2.5 text-xs font-medium text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md"
          >
            <Reply className="w-3 h-3 mr-1" />
            Reply
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onForward?.(msg.id)}
            className="h-7 px-2.5 text-xs font-medium text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md"
          >
            <Forward className="w-3 h-3 mr-1" />
            Forward
          </Button>
        </div>
      </div>
    </div>
  );
}
