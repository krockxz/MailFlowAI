import { User, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

interface SenderFilterProps {
  value: string;
  onChange: (value: string) => void;
}

export function SenderFilter({ value, onChange }: SenderFilterProps) {
  return (
    <div className="space-y-3">
      <label className={cn(
        "text-xs font-bold text-neutral-600 dark:text-neutral-400 tracking-wide uppercase",
        "flex items-center gap-2"
      )}>
        <div className={cn(
          "p-1.5 rounded-lg",
          "bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-700"
        )}>
          <User className="w-3 h-3 text-neutral-600 dark:text-neutral-400" />
        </div>
        From Sender
      </label>
      <div className="relative group/sender">
        <div className={cn(
          "absolute inset-0 rounded-xl opacity-0 transition-all duration-300 pointer-events-none",
          "group-focus-within/sender:opacity-100 group-hover/sender:opacity-50",
          "bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 dark:from-neutral-700 dark:via-neutral-800 dark:to-neutral-700",
          "blur-sm -z-10"
        )} />
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="email@example.com"
          className={cn(
            "h-11 text-sm pr-10 rounded-xl",
            "bg-white/95 dark:bg-neutral-900/95 backdrop-blur-sm",
            "border-neutral-200/70 dark:border-neutral-700/50",
            "focus:ring-2 focus:ring-neutral-300/50 dark:focus:ring-neutral-600/50",
            "focus:border-neutral-400 dark:focus:border-neutral-500",
            "transition-all duration-300 shadow-sm"
          )}
        />
        {value && (
          <button
            onClick={() => onChange('')}
            className={cn(
              "absolute right-2.5 top-1/2 -translate-y-1/2",
              "text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200",
              "p-1.5 rounded-lg transition-all duration-200",
              "hover:bg-neutral-200/50 dark:hover:bg-neutral-700/50",
              "hover:scale-110 active:scale-95"
            )}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
