import { useRef, useEffect, useState, useCallback, memo } from 'react';
import { X, Send, Loader2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { showSendSuccess, showSendError } from '@/lib/toast';

// Gradient background utilities
const gradientBg = 'bg-gradient-to-r from-accent-500 to-accent-600';
const gradientBgHover = 'hover:from-accent-600 hover:to-accent-700';

// Character count thresholds
const CHAR_WARNING_THRESHOLD = 45000;
const CHAR_DANGER_THRESHOLD = 48000;

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
  const charCountRatio = bodyLength / MAX_BODY_LENGTH;
  const isNearLimit = bodyLength > CHAR_WARNING_THRESHOLD;
  const isAtDanger = bodyLength > CHAR_DANGER_THRESHOLD;

  return (
    <div
      className={cn(
        'fixed bottom-0 right-4 z-50 transition-all duration-300 ease-out',
        'w-[580px] h-[540px] rounded-xl border border-neutral-200/80 dark:border-neutral-800/80',
        'bg-white/95 dark:bg-neutral-950/95 backdrop-blur-sm',
        'shadow-xl dark:shadow-dark-xl',
        // Enhanced slide up + scale animation for premium feel
        'animate-in slide-in-from-bottom-4 fade-in zoom-in-95 duration-300 ease-out'
      )}
      role="dialog"
      aria-modal="true"
      aria-label="Compose email"
    >
      {/* Header with subtle top gradient accent */}
      <div className="relative flex items-center justify-between px-5 py-4 border-b border-neutral-200/80 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-neutral-900/30">
        {/* Top accent line */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-500/30 to-transparent" />

        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-neutral-900 dark:text-white tracking-tight">New Message</span>
          {isAIComposed && (
            <span className="inline-flex items-center gap-1.5 ml-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-accent-500/10 to-accent-600/10 text-accent-600 dark:text-accent-400 border border-accent-500/20 shadow-[0_0_20px_rgba(139,92,246,0.15)] dark:shadow-[0_0_30px_rgba(139,92,246,0.3)] animate-pulse">
              <Sparkles className="w-3 h-3" />
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
            className="hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50 hover:scale-105 transition-all duration-200"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-[calc(100%-61px)]">
        <div className="border-b border-neutral-200/80 dark:border-neutral-800/80 group relative">
          {/* Enhanced gradient border on focus with glow */}
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-accent-500 via-accent-400 to-accent-500 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
          {/* Subtle glow effect */}
          <div className="absolute inset-x-0 -bottom-px h-0.5 bg-accent-400/50 blur-sm opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
          <Input
            {...register('to')}
            type="email"
            placeholder="To"
            className="border-none rounded-none px-5 py-3 h-11 focus:ring-0 bg-transparent text-sm transition-all duration-200 focus:bg-neutral-50/50 dark:focus:bg-neutral-900/30 placeholder:text-neutral-400 dark:placeholder:text-neutral-600 focus:placeholder:text-neutral-500/70"
          />
          {errors.to && <span className="text-error text-xs px-5 block mt-1 animate-in fade-in slide-in-from-top-1 duration-200">{errors.to.message}</span>}
        </div>

        {showCc && (
          <div className="border-b border-neutral-200/80 dark:border-neutral-800/80 group relative">
            {/* Enhanced gradient border on focus with glow */}
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-accent-500 via-accent-400 to-accent-500 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
            <div className="absolute inset-x-0 -bottom-px h-0.5 bg-accent-400/50 blur-sm opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
            <Input
              {...register('cc')}
              type="email"
              placeholder="Cc"
              className="border-none rounded-none px-5 py-3 h-11 focus:ring-0 bg-transparent text-sm transition-all duration-200 focus:bg-neutral-50/50 dark:focus:bg-neutral-900/30 placeholder:text-neutral-400 dark:placeholder:text-neutral-600 focus:placeholder:text-neutral-500/70"
            />
            {errors.cc && <span className="text-error text-xs px-5 block mt-1 animate-in fade-in slide-in-from-top-1 duration-200">{errors.cc.message}</span>}
          </div>
        )}

        {showBcc && (
          <div className="border-b border-neutral-200/80 dark:border-neutral-800/80 group relative">
            {/* Enhanced gradient border on focus with glow */}
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-accent-500 via-accent-400 to-accent-500 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
            <div className="absolute inset-x-0 -bottom-px h-0.5 bg-accent-400/50 blur-sm opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
            <Input
              {...register('bcc')}
              type="email"
              placeholder="Bcc"
              className="border-none rounded-none px-5 py-3 h-11 focus:ring-0 bg-transparent text-sm transition-all duration-200 focus:bg-neutral-50/50 dark:focus:bg-neutral-900/30 placeholder:text-neutral-400 dark:placeholder:text-neutral-600 focus:placeholder:text-neutral-500/70"
            />
            {errors.bcc && <span className="text-error text-xs px-5 block mt-1 animate-in fade-in slide-in-from-top-1 duration-200">{errors.bcc.message}</span>}
          </div>
        )}

        <div className="border-b border-neutral-200/80 dark:border-neutral-800/80 group relative">
          {/* Enhanced gradient border on focus with glow */}
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-accent-500 via-accent-400 to-accent-500 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
          <div className="absolute inset-x-0 -bottom-px h-0.5 bg-accent-400/50 blur-sm opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
          <Input
            {...register('subject')}
            type="text"
            placeholder="Subject"
            className="border-none rounded-none px-5 py-3 font-medium h-11 focus:ring-0 bg-transparent text-sm transition-all duration-200 focus:bg-neutral-50/50 dark:focus:bg-neutral-900/30 placeholder:text-neutral-400 dark:placeholder:text-neutral-600 focus:placeholder:text-neutral-500/70"
          />
          {errors.subject && <span className="text-error text-xs px-5 block mt-1 animate-in fade-in slide-in-from-top-1 duration-200">{errors.subject.message}</span>}
        </div>

        <div className="flex-1 min-h-0 relative group">
          {/* Enhanced focus glow for textarea */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-x-5 bottom-0 h-px bg-gradient-to-r from-accent-500 via-accent-400 to-accent-500 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
            <div className="absolute inset-x-5 -bottom-px h-0.5 bg-accent-400/50 blur-sm opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
          </div>
          <Textarea
            {...register('body')}
            ref={bodyRef}
            placeholder="Write your message..."
            className="w-full h-full resize-none border-none focus:ring-0 shadow-none bg-transparent px-5 py-4 text-sm transition-all duration-200 focus:bg-neutral-50/50 dark:focus:bg-neutral-900/30 placeholder:text-neutral-400 dark:placeholder:text-neutral-600 leading-relaxed focus:placeholder:text-neutral-500/70"
          />
          {/* Enhanced character count with visual feedback */}
          <div className={cn(
            'absolute bottom-4 right-5 text-xs font-medium transition-all duration-200 flex items-center gap-1.5',
            'group-focus-within:opacity-100 opacity-60 group-hover:opacity-80',
            isNearLimit && !isAtDanger && 'text-amber-500 dark:text-amber-400',
            isAtDanger && 'text-error dark:text-error/80'
          )}>
            <span>{bodyLength.toLocaleString()}</span>
            <span className="text-neutral-300 dark:text-neutral-600">/</span>
            <span>{MAX_BODY_LENGTH.toLocaleString()}</span>
            {/* Progress indicator */}
            <div className="w-12 h-1 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden ml-1">
              <div
                className={cn(
                  'h-full transition-all duration-300 rounded-full',
                  charCountRatio < 0.5 && 'bg-neutral-400',
                  charCountRatio >= 0.5 && charCountRatio < 0.9 && 'bg-accent-500',
                  charCountRatio >= 0.9 && !isAtDanger && 'bg-amber-500',
                  isAtDanger && 'bg-error'
                )}
                style={{ width: `${Math.min(charCountRatio * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Enhanced footer with better button hierarchy */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-neutral-200/80 dark:border-neutral-800/80 shrink-0 bg-neutral-50/50 dark:bg-neutral-900/30">
          {/* Secondary actions - more subtle */}
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowCc(!showCc)}
              className={cn(
                'h-8 px-3 text-xs font-medium transition-all duration-200',
                'hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50',
                'focus-visible:bg-neutral-200/70 dark:focus-visible:bg-neutral-800/70',
                'rounded-lg',
                showCc && 'bg-neutral-200/30 dark:bg-neutral-800/30'
              )}
            >
              {showCc ? 'Hide Cc' : 'Add Cc'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowBcc(!showBcc)}
              className={cn(
                'h-8 px-3 text-xs font-medium transition-all duration-200',
                'hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50',
                'focus-visible:bg-neutral-200/70 dark:focus-visible:bg-neutral-800/70',
                'rounded-lg',
                showBcc && 'bg-neutral-200/30 dark:bg-neutral-800/30'
              )}
            >
              {showBcc ? 'Hide Bcc' : 'Add Bcc'}
            </Button>
          </div>

          {/* Primary action area with enhanced loading state */}
          <div className="flex items-center gap-3">
            {(isSubmitting || externalIsSending) && (
              <span className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5 animate-in fade-in slide-in-from-right-2 duration-300">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-accent-500" />
                <span className="font-medium">Sending...</span>
              </span>
            )}
            <Button
              type="submit"
              disabled={isSubmitting || externalIsSending}
              className={cn(
                'h-9 px-5 text-sm font-medium transition-all duration-200',
                'rounded-lg',
                // Enhanced shadow with ambient glow
                'shadow-[0_4px_12px_rgba(139,92,246,0.25)] hover:shadow-[0_6px_20px_rgba(139,92,246,0.35)]',
                'dark:shadow-[0_4px_12px_rgba(139,92,246,0.4)] dark:hover:shadow-[0_6px_20px_rgba(139,92,246,0.5)]',
                // Subtle inner glow on hover
                'hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]',
                gradientBg, gradientBgHover,
                'text-white hover:scale-[1.02] active:scale-[0.98]',
                // Disabled state
                'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none'
              )}
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
