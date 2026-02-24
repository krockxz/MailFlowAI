export function EmailDetailSkeleton() {
  return (
    <div className="flex flex-col h-full bg-white dark:bg-neutral-950">
      {/* Header */}
      <header className="border-b border-neutral-200 dark:border-neutral-800 px-5 py-4 shrink-0 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          {/* Back button skeleton */}
          <div className="h-9 bg-neutral-200 dark:bg-neutral-800 rounded w-20" />

          {/* Action buttons skeleton */}
          <div className="flex items-center gap-1">
            <div className="w-9 h-9 bg-neutral-200 dark:bg-neutral-800 rounded" />
            <div className="w-9 h-9 bg-neutral-200 dark:bg-neutral-800 rounded" />
          </div>
        </div>

        {/* Subject skeleton */}
        <div className="h-6 bg-neutral-200 dark:bg-neutral-800 rounded w-3/4 mb-4" />

        {/* Thread participants skeleton */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-800" />
          <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-800" />
          <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-16" />
        </div>
      </header>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto px-5 py-6">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* First message skeleton */}
          <div className="relative pb-8 border-b border-neutral-100 dark:border-neutral-900 animate-pulse">
            <div className="flex items-start gap-4 mb-4">
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-800 shrink-0" />

              {/* Message header */}
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-baseline justify-between gap-4">
                  <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-32" />
                  <div className="h-3 bg-neutral-200 dark:bg-neutral-800 rounded w-24 shrink-0" />
                </div>
                <div className="h-3 bg-neutral-200 dark:bg-neutral-800 rounded w-48" />
              </div>
            </div>

            {/* Message Body */}
            <div className="pl-14 space-y-2">
              <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-full" />
              <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-full" />
              <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-5/6" />
              <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-4/6" />
            </div>
          </div>

          {/* Second message skeleton */}
          <div className="relative pb-8 border-b border-neutral-100 dark:border-neutral-900 ml-6 animate-pulse">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-800 shrink-0" />
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-baseline justify-between gap-4">
                  <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-32" />
                  <div className="h-3 bg-neutral-200 dark:bg-neutral-800 rounded w-24 shrink-0" />
                </div>
                <div className="h-3 bg-neutral-200 dark:bg-neutral-800 rounded w-48" />
              </div>
            </div>

            <div className="pl-14 space-y-2">
              <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-full" />
              <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-full" />
              <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-2/3" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick reply skeleton */}
      <div className="border-t border-neutral-200 dark:border-neutral-800 p-4 shrink-0 animate-pulse">
        <div className="h-10 bg-neutral-200 dark:bg-neutral-800 rounded w-full" />
      </div>
    </div>
  );
}
