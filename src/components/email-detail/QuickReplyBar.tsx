import { Send, Reply, Forward } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Email } from '@/types/email';
import { Button } from '@/components/ui/button';

interface QuickReplyBarProps {
  displayEmails: Email[];
  onReply?: (emailId: string) => void;
  onForward?: (emailId: string) => void;
}

export function QuickReplyBar({ displayEmails, onReply, onForward }: QuickReplyBarProps) {
  if (!onReply || displayEmails.length === 0) return null;

  const lastEmail = displayEmails[displayEmails.length - 1];

  return (
    <div className="border-t border-neutral-200/60 dark:border-neutral-800/60 p-5 shrink-0 backdrop-blur-xl bg-white/80 dark:bg-neutral-950/80">
      <div className="max-w-4xl mx-auto">
        <Button
          onClick={() => onReply(lastEmail.id)}
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
              {lastEmail.from.name || 'sender'}
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

        <div className="flex items-center justify-center gap-6 mt-4">
          <button
            onClick={() => onReply?.(lastEmail.id)}
            className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors duration-200"
          >
            <Reply className="w-3.5 h-3.5" />
            <span>Reply</span>
          </button>
          <button
            onClick={() => onForward?.(lastEmail.id)}
            className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors duration-200"
          >
            <Forward className="w-3.5 h-3.5" />
            <span>Forward</span>
          </button>
        </div>
      </div>
    </div>
  );
}
