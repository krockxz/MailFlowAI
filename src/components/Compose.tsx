import { useRef, useEffect, useState, useCallback, memo } from 'react';
import { X, Send, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { showSendSuccess, showSendError } from '@/lib/toast';

const emailSchema = z.object({
  to: z.string().min(1, 'Recipient is required').email('Invalid email address'),
  subject: z.string().min(1, 'Subject is required'),
  body: z.string(),
  cc: z.string().email('Invalid email address').optional().or(z.literal('')),
  bcc: z.string().email('Invalid email address').optional().or(z.literal('')),
});

type EmailForm = z.infer<typeof emailSchema>;

interface ComposeProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (data: { to: string; subject: string; body: string; cc?: string; bcc?: string }) => Promise<void>;
  initialData?: {
    to?: string;
    subject?: string;
    body?: string;
    cc?: string;
    bcc?: string;
    isSending?: boolean;
    isAIComposed?: boolean;
  };
}

const MAX_BODY_LENGTH = 50000; // Gmail limit

export const Compose = memo(function Compose({
  isOpen,
  onClose,
  onSend,
  initialData
}: ComposeProps) {
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  // Track user edits to preserve AI badge until user types
  const [userHasEdited, setUserHasEdited] = useState(false);

  // Track previous initial data to detect actual changes
  const prevInitialDataRef = useRef<typeof initialData>(null);

  // Use external isSending state if provided (from AI), otherwise use form state
  const externalIsSending = initialData?.isSending;
  const isAIComposed = initialData?.isAIComposed && !userHasEdited;

  const { register, handleSubmit, reset, formState: { errors, isSubmitting }, watch } = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      to: initialData?.to || '',
      subject: initialData?.subject || '',
      body: initialData?.body || '',
      cc: initialData?.cc || '',
      bcc: initialData?.bcc || '',
    },
  });

  // Track user edits - monitor ALL form fields
  const watchedValues = watch();

  // Sync initial data when content actually changes (not just reference)
  // Only reset when the dialog opens with new data, not on every render
  useEffect(() => {
    if (!initialData) return;

    const prev = prevInitialDataRef.current;

    // Check if content actually changed (not just object reference)
    const contentChanged =
      !prev ||
      initialData.to !== prev.to ||
      initialData.subject !== prev.subject ||
      initialData.body !== prev.body ||
      initialData.cc !== prev.cc ||
      initialData.bcc !== prev.bcc;

    if (contentChanged && !userHasEdited) {
      reset({
        to: initialData.to || '',
        subject: initialData.subject || '',
        body: initialData.body || '',
        cc: initialData.cc || '',
        bcc: initialData.bcc || '',
      });
      setShowCc(!!initialData.cc);
      setShowBcc(!!initialData.bcc);
    }

    prevInitialDataRef.current = initialData;
  }, [initialData, reset, userHasEdited]);

  // Focus body on open
  useEffect(() => {
    if (isOpen && bodyRef.current) {
      bodyRef.current.focus();
    }
  }, [isOpen]);

  // Mark user as having edited when they type in ANY field
  useEffect(() => {
    if (initialData?.isAIComposed && !userHasEdited) {
      const hasUserEdited = (
        watchedValues.to !== initialData.to ||
        watchedValues.subject !== initialData.subject ||
        watchedValues.body !== initialData.body ||
        watchedValues.cc !== (initialData.cc || '') ||
        watchedValues.bcc !== (initialData.bcc || '')
      );
      if (hasUserEdited) {
        setUserHasEdited(true);
      }
    }
  }, [watchedValues, initialData, userHasEdited]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      // Ctrl/Cmd + Enter to send
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSubmit(onSubmit)();
      }
      // Escape to close
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleSubmit, onClose]);

  const onSubmit = useCallback(async (data: EmailForm) => {
    try {
      await onSend({
        to: data.to,
        subject: data.subject,
        body: data.body,
        cc: data.cc || undefined,
        bcc: data.bcc || undefined,
      });

      // Show success toast
      showSendSuccess(data.to);

      // Only reset and close on success
      reset();
      setUserHasEdited(false);
      onClose();
    } catch (error) {
      // Show error with retry - DON'T close form (preserves draft)
      showSendError(error, () => {
        handleSubmit(onSubmit)();
      });
    }
  }, [onSend, reset, onClose, handleSubmit]);

  if (!isOpen) return null;

  const bodyLength = watchedValues.body?.length || 0;

  return (
    <div
      className={cn(
        'fixed bottom-0 right-4 z-50 shadow-lg transition-all duration-200',
        'w-[580px] h-[540px] rounded-lg border border-neutral-200 dark:border-neutral-800',
        'bg-white dark:bg-neutral-950'
      )}
      role="dialog"
      aria-modal="true"
      aria-label="Compose email"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-neutral-900 dark:text-white">New Message</span>
          {isAIComposed && (
            <span className="inline-flex items-center gap-1.5 ml-2 px-2 py-0.5 rounded text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
              AI Composed
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close (Esc)"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-[calc(100%-53px)]">
        <div className="border-b border-neutral-200 dark:border-neutral-800">
          <Input
            {...register('to')}
            type="email"
            placeholder="To"
            className="border-none rounded-none px-4 py-2.5 h-10 focus:ring-0 bg-transparent text-sm"
          />
          {errors.to && <span className="text-error text-xs px-4 block mt-1">{errors.to.message}</span>}
        </div>

        {showCc && (
          <div className="border-b border-neutral-200 dark:border-neutral-800">
            <Input
              {...register('cc')}
              type="email"
              placeholder="Cc"
              className="border-none rounded-none px-4 py-2.5 h-10 focus:ring-0 bg-transparent text-sm"
            />
            {errors.cc && <span className="text-error text-xs px-4 block mt-1">{errors.cc.message}</span>}
          </div>
        )}

        {showBcc && (
          <div className="border-b border-neutral-200 dark:border-neutral-800">
            <Input
              {...register('bcc')}
              type="email"
              placeholder="Bcc"
              className="border-none rounded-none px-4 py-2.5 h-10 focus:ring-0 bg-transparent text-sm"
            />
            {errors.bcc && <span className="text-error text-xs px-4 block mt-1">{errors.bcc.message}</span>}
          </div>
        )}

        <div className="border-b border-neutral-200 dark:border-neutral-800">
          <Input
            {...register('subject')}
            type="text"
            placeholder="Subject"
            className="border-none rounded-none px-4 py-2.5 font-medium h-10 focus:ring-0 bg-transparent text-sm"
          />
          {errors.subject && <span className="text-error text-xs px-4 block mt-1">{errors.subject.message}</span>}
        </div>

        <div className="flex-1 min-h-0 relative">
          <Textarea
            {...register('body')}
            ref={bodyRef}
            placeholder="Write your message..."
            className="w-full h-full resize-none border-none focus:ring-0 shadow-none bg-transparent px-4 py-3 text-sm"
          />
          {/* Character count */}
          <div className="absolute bottom-3 right-4 text-xs text-neutral-400 dark:text-neutral-500">
            {bodyLength.toLocaleString()} / {MAX_BODY_LENGTH.toLocaleString()}
          </div>
        </div>

        <div className="flex items-center justify-between px-4 py-2.5 border-t border-neutral-200 dark:border-neutral-800 shrink-0">
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowCc(!showCc)}
              className="h-8 px-2 text-xs"
            >
              {showCc ? 'Hide Cc' : 'Add Cc'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowBcc(!showBcc)}
              className="h-8 px-2 text-xs"
            >
              {showBcc ? 'Hide Bcc' : 'Add Bcc'}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {(isSubmitting || externalIsSending) && (
              <span className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                <Loader2 className="w-3 h-3 animate-spin" />
                Sending...
              </span>
            )}
            <Button
              type="submit"
              disabled={isSubmitting || externalIsSending}
              className="bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 h-8 px-4 text-sm"
              title="Ctrl+Enter to send"
            >
              {(isSubmitting || externalIsSending) ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
});
