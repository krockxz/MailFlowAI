import { useRef, useEffect, useState } from 'react';
import { X, Minus, Maximize2, Send, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const emailSchema = z.object({
  to: z.string().min(1, 'Recipient is required').email('Invalid email address'),
  subject: z.string().min(1, 'Subject is required'),
  body: z.string(),
  cc: z.string().email('Invalid email address').optional().or(z.literal('')),
});

type EmailForm = z.infer<typeof emailSchema>;

interface ComposeProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (data: { to: string; subject: string; body: string; cc?: string }) => Promise<void>;
  initialData?: {
    to?: string;
    subject?: string;
    body?: string;
    cc?: string;
    isSending?: boolean;
  };
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
}

export function Compose({
  isOpen,
  onClose,
  onSend,
  initialData,
  isMinimized = false,
  onToggleMinimize
}: ComposeProps) {
  const darkMode = useAppStore((state) => state.darkMode);
  const [showCc, setShowCc] = useState(!!initialData?.cc);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  // Use external isSending state if provided (from AI), otherwise use form state
  const externalIsSending = initialData?.isSending;

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      to: initialData?.to || '',
      subject: initialData?.subject || '',
      body: initialData?.body || '',
      cc: initialData?.cc || '',
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        to: initialData.to || '',
        subject: initialData.subject || '',
        body: initialData.body || '',
        cc: initialData.cc || '',
      });
      setShowCc(!!initialData.cc);
    }
  }, [initialData, reset]);

  useEffect(() => {
    if (isOpen && !isMinimized && bodyRef.current) {
      bodyRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  const onSubmit = async (data: EmailForm) => {
    try {
      await onSend({
        to: data.to,
        subject: data.subject,
        body: data.body,
        cc: data.cc || undefined,
      });
      reset();
      onClose();
    } catch (error) {
      console.error(error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={cn(
      'fixed bottom-0 right-4 z-50 shadow-2xl transition-all duration-300 ease-out animate-scale-in border border-neutral-200/60 dark:border-neutral-800/60',
      'glass-elevated',
      isMinimized ? 'w-96 h-14 rounded-t-xl' : 'w-[620px] h-[560px] rounded-t-2xl'
    )}>
      {/* Header with gradient accent */}
      <div className={cn(
        'flex items-center justify-between px-5 py-3.5 rounded-t-2xl border-b border-neutral-200/50 dark:border-neutral-800/50',
        'bg-gradient-to-r from-accent-50 to-transparent dark:from-accent-950/30'
      )}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center shadow-md shadow-accent-500/20">
            <Send className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-semibold text-sm text-neutral-900 dark:text-white">New Message</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleMinimize}
            className="h-8 w-8 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800/50 transition-all duration-200"
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800/50 transition-all duration-200"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-[calc(100%-60px)]">
          <div className="border-b border-neutral-200/50 dark:border-neutral-800/50">
            <Input
              {...register('to')}
              type="email"
              placeholder="To"
              className="border-none rounded-none px-5 py-3 focus-visible:ring-0 bg-transparent text-sm"
            />
            {errors.to && <span className="text-red-500 text-xs px-5">{errors.to.message}</span>}
          </div>

          {showCc && (
            <div className="border-b border-neutral-200/50 dark:border-neutral-800/50">
              <Input
                {...register('cc')}
                type="email"
                placeholder="Cc"
                className="border-none rounded-none px-5 py-3 focus-visible:ring-0 bg-transparent text-sm"
              />
              {errors.cc && <span className="text-red-500 text-xs px-5">{errors.cc.message}</span>}
            </div>
          )}

          <div className="border-b border-neutral-200/50 dark:border-neutral-800/50">
            <Input
              {...register('subject')}
              type="text"
              placeholder="Subject"
              className="border-none rounded-none px-5 py-3 font-medium focus-visible:ring-0 bg-transparent text-sm"
            />
            {errors.subject && <span className="text-red-500 text-xs px-5">{errors.subject.message}</span>}
          </div>

          <div className="flex-1 min-h-0 p-0">
            <Textarea
              {...register('body')}
              ref={bodyRef}
              placeholder="Write your message..."
              className="w-full h-full resize-none border-none focus-visible:ring-0 shadow-none bg-transparent px-5 py-4 text-sm"
            />
          </div>

          <div className="flex items-center justify-between px-5 py-3.5 border-t border-neutral-200/50 dark:border-neutral-800/50 shrink-0">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowCc(!showCc)}
              className="text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/50 rounded-lg h-9 px-3 transition-all duration-200"
            >
              {showCc ? 'Hide Cc' : 'Add Cc'}
            </Button>

            <div className="flex items-center gap-3">
              {(isSubmitting || externalIsSending) && (
                <span className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Sending...
                </span>
              )}
              <Button
                type="submit"
                disabled={isSubmitting || externalIsSending}
                className="btn-accent-gradient text-white rounded-xl h-9 px-5 font-medium shadow-lg shadow-accent-500/25 hover:shadow-accent-500/30 min-w-[100px] transition-all duration-300"
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
      )}
    </div>
  );
}
