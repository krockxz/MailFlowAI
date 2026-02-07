import { ArrowLeft, Reply, Forward, Star, MoreVertical } from 'lucide-react';
import { formatFullDate, getInitials } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { Email } from '@/types/email';

interface EmailDetailProps {
  email: Email | null;
  onBack: () => void;
  onReply?: (emailId: string) => void;
  onForward?: (emailId: string) => void;
}

export function EmailDetail({ email, onBack, onReply, onForward }: EmailDetailProps) {
  if (!email) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
        <p className="text-lg">Select an email to read</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onReply?.(email.id)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="Reply"
            >
              <Reply className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={() => onForward?.(email.id)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="Forward"
            >
              <Forward className="w-5 h-5 text-gray-600" />
            </button>
            <button
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="Star"
            >
              <Star className="w-5 h-5 text-gray-400" />
            </button>
            <button
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="More"
            >
              <MoreVertical className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Subject */}
        <h1 className={cn(
          'text-xl font-semibold mb-4',
          !email.isUnread && 'font-normal'
        )}>
          {email.subject}
        </h1>

        {/* Sender info */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-medium shrink-0">
            {getInitials(email.from.name || email.from.email)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-gray-900">
                {email.from.name || email.from.email}
              </span>
              <span className="text-gray-500 text-sm">
                &lt;{email.from.email}&gt;
              </span>
            </div>
            <div className="text-sm text-gray-500">
              to {email.to.map(t => t.name || t.email).join(', ')}
              {email.cc && email.cc.length > 0 && (
                <span>, cc {email.cc.map(t => t.name || t.email).join(', ')}</span>
              )}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {formatFullDate(email.date)}
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="prose max-w-none">
          <pre className="whitespace-pre-wrap font-sans text-gray-800">
            {email.body}
          </pre>
        </div>
      </div>

      {/* Quick reply */}
      {onReply && (
        <div className="border-t border-gray-200 p-4">
          <button
            onClick={() => onReply(email.id)}
            className="w-full py-3 px-4 border border-gray-300 rounded-lg text-left text-gray-500 hover:bg-gray-50 transition-colors flex items-center gap-3"
          >
            <Reply className="w-5 h-5" />
            <span>Click to reply...</span>
          </button>
        </div>
      )}
    </div>
  );
}
