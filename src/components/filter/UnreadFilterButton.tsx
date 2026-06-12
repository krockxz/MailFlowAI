import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface UnreadFilterButtonProps {
  isUnread: boolean | undefined;
  onToggle: () => void;
}

export function UnreadFilterButton({ isUnread, onToggle }: UnreadFilterButtonProps) {
  return (
    <Button
      onClick={onToggle}
      size="sm"
      className={cn(
        "h-11 px-4 rounded-xl font-medium transition-all duration-300 ease-out relative overflow-hidden",
        isUnread
          ? "bg-gradient-to-br from-neutral-900 to-neutral-800 text-white dark:from-white dark:to-neutral-100 dark:text-neutral-900 shadow-lg shadow-neutral-900/20 dark:shadow-white/10 hover:shadow-xl hover:shadow-neutral-900/30 dark:hover:shadow-white/20 hover:scale-[1.02] active:scale-[0.98]"
          : "bg-white/80 dark:bg-neutral-900/80 text-neutral-700 dark:text-neutral-300 border border-neutral-200/70 dark:border-neutral-700/50 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-600 backdrop-blur-sm"
      )}
    >
      {isUnread && (
        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer_2.5s_infinite]" />
      )}
      <Sparkles className={cn(
        "w-3.5 h-3.5 mr-1.5 transition-all duration-500 ease-out relative z-10",
        isUnread ? "rotate-12 scale-110" : "rotate-0 scale-100"
      )} />
      <span className="relative z-10">Unread</span>
      {isUnread && (
        <span className="ml-2 w-2 h-2 bg-white/90 dark:bg-neutral-900 rounded-full animate-[pulse-glow_2s_ease-in-out_infinite] relative z-10" />
      )}
    </Button>
  );
}
