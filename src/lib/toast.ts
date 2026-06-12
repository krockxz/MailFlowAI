import { toast } from 'sonner';
import { useAppStore } from '@/store';

export function showSendSuccess(_recipient: string): void {
  toast.success('Email sent successfully!', {
    duration: 4000,
    action: {
      label: 'View in Sent',
      onClick: () => useAppStore.getState().setCurrentView('sent'),
    },
  });
}

export function showError(message: string, onRetry?: () => void): void {
  toast.error(message, {
    duration: 6000,
    action: onRetry ? { label: 'Retry', onClick: onRetry } : undefined,
  });
}

export function showSendError(error: unknown, onRetry?: () => void): void {
  const message = error instanceof Error ? error.message : 'Failed to send email';
  showError(message, onRetry);
}
