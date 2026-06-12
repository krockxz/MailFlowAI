import { cn } from '@/lib/utils';

export const streamdownComponents = {
  h1: ({ children, ...props }: any) => (
    <h1 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mt-4 mb-2" {...props}>{children}</h1>
  ),
  h2: ({ children, ...props }: any) => (
    <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mt-3 mb-2" {...props}>{children}</h2>
  ),
  h3: ({ children, ...props }: any) => (
    <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mt-2 mb-1" {...props}>{children}</h3>
  ),
  p: ({ children, ...props }: any) => (
    <p className="my-1.5 text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed" {...props}>{children}</p>
  ),
  strong: ({ children, ...props }: any) => (
    <strong className="font-semibold text-neutral-900 dark:text-neutral-100" {...props}>{children}</strong>
  ),
  em: ({ children, ...props }: any) => (
    <em className="italic text-neutral-800 dark:text-neutral-200" {...props}>{children}</em>
  ),
  code: ({ children, className, ...props }: any) => {
    if (className) {
      return (
        <code className={cn(
          "text-xs font-mono px-2 py-1.5 my-2 block overflow-x-auto",
          "bg-violet-50 dark:bg-violet-950/50",
          "text-violet-800 dark:text-violet-200",
          "border border-violet-200/50 dark:border-violet-800/50",
          "rounded-md",
          className
        )} {...props}>
          {children}
        </code>
      );
    }
    return (
      <code className={cn(
        "text-xs font-mono px-1.5 py-0.5",
        "bg-violet-100 dark:bg-violet-900/50",
        "text-violet-800 dark:text-violet-200",
        "rounded"
      )} {...props}>
        {children}
      </code>
    );
  },
  a: ({ href, children, ...props }: any) => (
    <a
      href={href}
      className="text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 hover:underline transition-colors"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    >
      {children}
    </a>
  ),
  ul: ({ children, ...props }: any) => (
    <ul className="my-1.5 space-y-1" {...props}>{children}</ul>
  ),
  ol: ({ children, ...props }: any) => (
    <ol className="my-1.5 space-y-1" {...props}>{children}</ol>
  ),
  li: ({ children, ...props }: any) => (
    <li className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed" {...props}>{children}</li>
  ),
  blockquote: ({ children, ...props }: any) => (
    <blockquote className={cn(
      "border-l-2 border-violet-300 dark:border-violet-700 pl-3 my-2",
      "text-neutral-600 dark:text-neutral-400 italic"
    )} {...props}>
      {children}
    </blockquote>
  ),
  hr: (props: any) => (
    <hr className={cn("my-3 border-neutral-200 dark:border-neutral-800", "border-dashed")} {...props} />
  ),
  del: ({ children, ...props }: any) => (
    <del className="line-through text-neutral-500" {...props}>{children}</del>
  ),
};
