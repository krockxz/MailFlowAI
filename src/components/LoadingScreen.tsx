import { Loader2 } from 'lucide-react';

export function LoadingScreen() {
  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-br from-neutral-50 via-neutral-50 to-neutral-100 dark:from-neutral-950 dark:via-neutral-950 dark:to-neutral-900">
      <div className="text-center animate-fade-in-up">
        <div className="relative inline-flex items-center justify-center mb-6">
          <div className="absolute inset-0 rounded-full bg-accent-500/10 blur-xl animate-pulse" />
          <Loader2 className="relative w-12 h-12 text-accent-600 dark:text-accent-400 animate-spin" />
        </div>
        <p className="text-neutral-600 dark:text-neutral-400 text-base font-medium">
          Loading MailFlowAI...
        </p>
        <p className="text-neutral-400 dark:text-neutral-500 text-sm mt-1">
          Preparing your workspace
        </p>
      </div>
    </div>
  );
}
