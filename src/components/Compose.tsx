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
      'fixed bottom-0 right-4 z-50 shadow-xl transition-all duration-300 ease-out animate-scale-in border border-neutral-200 dark:border-neutral-800',
      darkMode ? 'bg-neutral-900' : 'bg-white',
      isMinimized ? 'w-96 h-12 rounded-t-lg' : 'w-[600px] h-[540px] rounded-t-xl'
    )}>
      <div className={cn(
        'flex items-center justify-between px-4 py-3 rounded-t-xl',
        darkMode ? 'bg-neutral-800' : 'bg-neutral-100'
      )}>
        <span className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">New Message</span>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={onToggleMinimize} className="h-8 w-8 min-h-[32px] min-w-[32px]">
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 min-h-[32px] min-w-[32px]">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-[calc(100%-52px)]">
          <div className="border-b border-neutral-200 dark:border-neutral-800">
            <Input {...register('to')} type="email" placeholder="To" className="border-none rounded-none px-4 py-3 focus-visible:ring-0 bg-transparent" />
            {errors.to && <span className="text-red-500 text-xs px-4">{errors.to.message}</span>}
          </div>

          {showCc && (
            <div className="border-b border-neutral-200 dark:border-neutral-800">
              <Input {...register('cc')} type="email" placeholder="Cc" className="border-none rounded-none px-4 py-3 focus-visible:ring-0 bg-transparent" />
              {errors.cc && <span className="text-red-500 text-xs px-4">{errors.cc.message}</span>}
            </div>
          )}

          <div className="border-b border-neutral-200 dark:border-neutral-800">
            <Input {...register('subject')} type="text" placeholder="Subject" className="border-none rounded-none px-4 py-3 font-medium focus-visible:ring-0 bg-transparent" />
            {errors.subject && <span className="text-red-500 text-xs px-4">{errors.subject.message}</span>}
          </div>

          <div className="flex-1 min-h-0 p-0">
            <Textarea
              {...register('body')}
              ref={bodyRef}
              placeholder="Write your message..."
              className="w-full h-full resize-none border-none focus-visible:ring-0 shadow-none bg-transparent px-4 py-4"
            />
          </div>

          <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-200 dark:border-neutral-800 shrink-0">
            <Button type="button" variant="ghost" onClick={() => setShowCc(!showCc)} className="text-neutral-500 hover:text-neutral-900 dark:text-neutral-400">
              {showCc ? 'Hide Cc' : 'Add Cc'}
            </Button>

            <div className="flex items-center gap-2">
              {(isSubmitting || externalIsSending) && (
                <span className="text-xs text-neutral-500 dark:text-neutral-400 animate-pulse">
                  Sending...
                </span>
              )}
              <Button
                type="submit"
                disabled={isSubmitting || externalIsSending}
                className="bg-accent-500 text-white shadow-lg shadow-accent-500/25 hover:bg-accent-600 hover:shadow-xl hover:shadow-accent-500/30 focus-visible:ring-accent-500 min-w-[100px]"
              >
                {(isSubmitting || externalIsSending) ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                Send
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
