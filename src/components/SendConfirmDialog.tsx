import { Mail, User, FileText } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

/**
 * Email data for confirmation dialog
 */
export interface EmailConfirmData {
  to: string;
  subject: string;
  body: string;
  cc?: string;
  bcc?: string;
}

interface SendConfirmDialogProps {
  isOpen: boolean;
  emailData: EmailConfirmData;
  onConfirm: () => void;
  onCancel: () => void;
  isSending?: boolean;
}

/**
 * Send Confirmation Dialog Component
 *
 * Displays email preview before AI sends it.
 * Shows "AI is sending this email" header.
 */
export function SendConfirmDialog({
  isOpen,
  emailData,
  onConfirm,
  onCancel,
  isSending = false,
}: SendConfirmDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSending && onCancel()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center shadow-md shadow-accent-500/20">
              <Mail className="w-4 h-4 text-white" />
            </div>
            <div>
              <DialogTitle>AI is sending this email</DialogTitle>
              <DialogDescription>
                Please review before confirming
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Email Preview */}
        <div className="flex-1 overflow-y-auto -mx-6 px-6">
          <div className="space-y-4 py-4">
            {/* To */}
            <div className="flex items-start gap-3">
              <User className="w-4 h-4 text-neutral-500 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                  To
                </p>
                <p className="text-sm font-medium text-neutral-900 dark:text-white break-all">
                  {emailData.to}
                </p>
              </div>
            </div>

            {/* CC */}
            {emailData.cc && (
              <div className="flex items-start gap-3">
                <User className="w-4 h-4 text-neutral-500 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                    Cc
                  </p>
                  <p className="text-sm font-medium text-neutral-900 dark:text-white break-all">
                    {emailData.cc}
                  </p>
                </div>
              </div>
            )}

            {/* BCC */}
            {emailData.bcc && (
              <div className="flex items-start gap-3">
                <User className="w-4 h-4 text-neutral-500 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                    Bcc
                  </p>
                  <p className="text-sm font-medium text-neutral-900 dark:text-white break-all">
                    {emailData.bcc}
                  </p>
                </div>
              </div>
            )}

            {/* Subject */}
            <div className="flex items-start gap-3">
              <FileText className="w-4 h-4 text-neutral-500 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                  Subject
                </p>
                <p className="text-sm font-medium text-neutral-900 dark:text-white break-all">
                  {emailData.subject || '(No subject)'}
                </p>
              </div>
            </div>

            {/* Body Preview */}
            <div className="border-t border-neutral-200 dark:border-neutral-800 pt-4">
              <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-2">
                Message
              </p>
              <div className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap break-words max-h-48 overflow-y-auto">
                {emailData.body || '<Empty message body>'}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isSending}
            className="rounded-xl"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isSending}
            className="btn-accent-gradient text-white rounded-xl min-w-[120px]"
          >
            {isSending ? (
              <>
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
                Sending...
              </>
            ) : (
              'Confirm & Send'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
