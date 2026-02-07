import { useState, useRef, useEffect } from 'react';
import { X, Minus, Maximize2, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

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
      'fixed bottom-0 right-4 bg-white rounded-t-lg shadow-2xl border border-gray-200 z-50 transition-all',
      isMinimized ? 'w-96 h-12' : 'w-[600px] h-[500px]'
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 text-white rounded-t-lg">
        <span className="font-medium">New Message</span>
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleMinimize}
            className="p-1 hover:bg-gray-700 rounded transition-colors"
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-700 rounded transition-colors"
            title="Discard"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <div className="flex flex-col h-[calc(100%-48px)]">
          {/* Form */}
          <div className="flex-1 flex flex-col">
            <div className="border-b border-gray-200">
              <input
                type="email"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="To"
                className="w-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {showCc && (
              <div className="border-b border-gray-200">
                <input
                  type="email"
                  value={cc}
                  onChange={(e) => setCc(e.target.value)}
                  placeholder="Cc"
                  className="w-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            <div className="border-b border-gray-200">
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject"
                className="w-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex-1 p-2">
              <textarea
                ref={bodyRef}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your message..."
                className="w-full h-full resize-none focus:outline-none"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <button
              onClick={() => setShowCc(!showCc)}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              {showCc ? 'Hide Cc' : 'Add Cc'}
            </button>

            <button
              onClick={handleSend}
              disabled={isSending || !to.trim() || !subject.trim()}
              className={cn(
                'flex items-center gap-2 px-6 py-2 rounded-full transition-colors',
                'bg-blue-600 text-white hover:bg-blue-700',
                'disabled:bg-gray-300 disabled:cursor-not-allowed'
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
