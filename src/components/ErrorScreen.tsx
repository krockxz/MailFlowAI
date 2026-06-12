import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ErrorScreenProps {
  error?: string;
  onRetry: () => void;
}

export function ErrorScreen({ error, onRetry }: ErrorScreenProps) {
  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-br from-neutral-50 via-neutral-50 to-neutral-100 dark:from-neutral-950 dark:via-neutral-950 dark:to-neutral-900 px-4">
      <div className="max-w-md w-full animate-fade-in-scale">
        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl shadow-neutral-200/50 dark:shadow-black border border-neutral-200/60 dark:border-neutral-800/60 p-8">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-error/20 rounded-full blur-xl" />
              <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-error/10 to-error/5 dark:from-error/20 dark:to-error/10 flex items-center justify-center border border-error/20">
                <svg
                  className="w-8 h-8 text-error"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="text-center mb-6">
            <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
              Initialization Failed
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
              {error || 'Failed to initialize the application. Please try again.'}
            </p>
          </div>

          <button
            onClick={() => {
              onRetry();
              window.location.reload();
            }}
            className={cn(
              'w-full inline-flex items-center justify-center gap-2 px-4 py-3',
              'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900',
              'rounded-xl font-medium shadow-lg shadow-neutral-900/10 dark:shadow-white/10',
              'hover:bg-neutral-800 dark:hover:bg-neutral-100',
              'hover:shadow-xl hover:shadow-neutral-900/20 dark:hover:shadow-white/20',
              'hover:-translate-y-0.5 active:translate-y-0',
              'transition-all duration-200'
            )}
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    </div>
  );
}
