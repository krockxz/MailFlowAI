import { useState, useRef, useEffect } from 'react';
import { X, Minus, Maximize2, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store';

interface ComposeProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (data: { to: string; subject: string; body: string; cc?: string }) => Promise<void>;
  isSending?: boolean;
  initialData?: {
    to?: string;
    subject?: string;
    body?: string;
    cc?: string;
  };
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
}

export function Compose({
  isOpen,
  onClose,
  onSend,
  isSending = false,
  initialData,
  isMinimized = false,
  onToggleMinimize
}: ComposeProps) {
  const darkMode = useAppStore((state) => state.darkMode);
  const [to, setTo] = useState(initialData?.to || '');
  const [subject, setSubject] = useState(initialData?.subject || '');
  const [body, setBody] = useState(initialData?.body || '');
  const [cc, setCc] = useState(initialData?.cc || '');
  const [showCc, setShowCc] = useState(!!initialData?.cc);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (initialData) {
      setTo(initialData.to || '');
      setSubject(initialData.subject || '');
      setBody(initialData.body || '');
      setCc(initialData.cc || '');
      setShowCc(!!initialData.cc);
    }
  }, [initialData]);

  useEffect(() => {
    if (isOpen && !isMinimized && bodyRef.current) {
      bodyRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  const handleSend = async () => {
    if (!to.trim()) {
      alert('Please enter a recipient');
      return;
    }

    if (!subject.trim()) {
      alert('Please enter a subject');
      return;
    }

    try {
      await onSend({
        to: to.trim(),
        subject: subject.trim(),
        body: body.trim(),
        cc: cc.trim() || undefined,
      });

      // Reset form
      setTo('');
      setSubject('');
      setBody('');
      setCc('');
      onClose();
    } catch (error) {
      alert('Failed to send email. Please try again.');
      console.error(error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={cn(
      'fixed bottom-0 right-4 z-50 shadow-2xl transition-all duration-300 ease-out animate-scale-in',
      darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200',
      isMinimized ? 'w-96 h-12 rounded-t-lg' : 'w-[600px] h-[540px] rounded-t-xl'
    )}>
      {/* Header */}
      <div className={cn(
        'flex items-center justify-between px-4 py-3 rounded-t-xl',
        darkMode ? 'bg-zinc-800' : 'bg-zinc-100'
      )}>
        <span className="font-semibold text-sm">New Message</span>
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleMinimize}
            className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-smooth"
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            {isMinimized ? <Maximize2 className="w-4 h-4 text-zinc-500" /> : <Minus className="w-4 h-4 text-zinc-500" />}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-smooth"
            title="Discard"
          >
            <X className="w-4 h-4 text-zinc-500" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <div className="flex flex-col h-[calc(100%-52px)]">
          {/* Form */}
          <div className="flex-1 flex flex-col">
            <div className={cn('border-b', darkMode ? 'border-zinc-800' : 'border-zinc-200')}>
              <input
                type="email"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="To"
                className={cn(
                  'w-full px-4 py-3 text-sm focus:outline-none bg-transparent transition-smooth',
                  darkMode ? 'placeholder:text-zinc-600' : 'placeholder:text-zinc-400'
                )}
              />
            </div>

            {showCc && (
              <div className={cn('border-b', darkMode ? 'border-zinc-800' : 'border-zinc-200')}>
                <input
                  type="email"
                  value={cc}
                  onChange={(e) => setCc(e.target.value)}
                  placeholder="Cc"
                  className={cn(
                    'w-full px-4 py-3 text-sm focus:outline-none bg-transparent transition-smooth',
                    darkMode ? 'placeholder:text-zinc-600' : 'placeholder:text-zinc-400'
                  )}
                />
              </div>
            )}

            <div className={cn('border-b', darkMode ? 'border-zinc-800' : 'border-zinc-200')}>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject"
                className={cn(
                  'w-full px-4 py-3 text-sm focus:outline-none bg-transparent font-medium transition-smooth',
                  darkMode ? 'placeholder:text-zinc-600' : 'placeholder:text-zinc-400'
                )}
              />
            </div>

            <div className="flex-1 p-4">
              <textarea
                ref={bodyRef}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your message..."
                className={cn(
                  'w-full h-full resize-none focus:outline-none text-sm leading-relaxed bg-transparent',
                  darkMode ? 'placeholder:text-zinc-600' : 'placeholder:text-zinc-400'
                )}
              />
            </div>
          </div>

          {/* Footer */}
          <div className={cn(
            'flex items-center justify-between px-4 py-3 border-t',
            darkMode ? 'border-zinc-800' : 'border-zinc-200'
          )}>
            <button
              onClick={() => setShowCc(!showCc)}
              className={cn(
                'text-sm font-medium transition-smooth px-3 py-1.5 rounded-lg',
                darkMode
                  ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                  : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100'
              )}
            >
              {showCc ? 'Hide Cc' : 'Add Cc'}
            </button>

            <button
              onClick={handleSend}
              disabled={isSending || !to.trim() || !subject.trim()}
              className={cn(
                'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-smooth',
                'bg-blue-500 text-white hover:bg-blue-600 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30',
                'disabled:bg-zinc-300 disabled:shadow-none disabled:cursor-not-allowed dark:disabled:bg-zinc-800'
              )}
            >
              {isSending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
