
interface EmailListSkeletonProps {
  count?: number;
}

export function EmailListSkeleton({ count = 5 }: EmailListSkeletonProps) {
  return (
    <div className="overflow-y-auto h-full flex flex-col bg-white dark:bg-neutral-950">
      <div className="flex-1">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 animate-pulse"
          >
            <div className="flex items-start gap-3">
              {/* Avatar skeleton */}
              <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-800 shrink-0" />

              {/* Content skeleton */}
              <div className="flex-1 min-w-0 space-y-2">
                {/* Sender and date row */}
                <div className="flex items-center justify-between gap-2">
                  <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-32" />
                  <div className="h-3 bg-neutral-200 dark:bg-neutral-800 rounded w-12 shrink-0" />
                </div>

                {/* Subject */}
                <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-3/4" />

                {/* Snippet */}
                <div className="space-y-1">
                  <div className="h-3 bg-neutral-200 dark:bg-neutral-800 rounded w-full" />
                  <div className="h-3 bg-neutral-200 dark:bg-neutral-800 rounded w-2/3" />
                </div>
              </div>

              {/* Unread indicator skeleton */}
              <div className="w-2 h-2 rounded-full bg-neutral-300 dark:bg-neutral-700 shrink-0 mt-2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
