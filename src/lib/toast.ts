/**
 * Toast notification utilities
 *
 * Centralized toast functions following DRY principle.
 * Uses native browser notification for simplicity (KISS/YAGNI).
 */

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface ToastOptions {
  duration?: number;
  action?: ToastAction;
}

/**
 * Show success toast notification
 */
export function showSuccess(message: string): void {
  showToast(message, 'success');
}

/**
 * Show success toast after email is sent with action button
 */
export function showSendSuccess(_recipient: string): void {
  showToast('Email sent successfully!', 'success', {
    duration: 4000,
    action: {
      label: 'View in Sent',
      onClick: () => {
        // Navigate to sent folder via store
        const useAppStore = require('@/store').useAppStore;
        useAppStore.getState().setCurrentView('sent');
      },
    },
  });
}

/**
 * Show error toast with optional retry
 */
export function showError(message: string, onRetry?: () => void): void {
  showToast(message, 'error', {
    duration: 6000,
    action: onRetry ? { label: 'Retry', onClick: onRetry } : undefined,
  });
}

/**
 * Show error toast for send failures
 */
export function showSendError(error: unknown, onRetry?: () => void): void {
  const message = error instanceof Error ? error.message : 'Failed to send email';
  showError(message, onRetry);
}

/**
 * Show info toast
 */
export function showInfo(message: string): void {
  showToast(message, 'info');
}

/**
 * Internal toast implementation using simple DOM elements
 * Avoids external dependencies (YAGNI)
 */
function showToast(
  message: string,
  type: 'success' | 'error' | 'info',
  options?: ToastOptions
): void {
  // Remove existing toasts
  const existing = document.getElementById('toast-container');
  if (existing) existing.remove();

  // Create container
  const container = document.createElement('div');
  container.id = 'toast-container';
  container.className = [
    'fixed top-4 right-4 z-[9999] flex flex-col gap-2',
    'animate-in slide-in-from-top-2 duration-300',
  ].join(' ');

  // Create toast element
  const toast = document.createElement('div');
  const bgColor = type === 'success' ? 'bg-emerald-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';
  toast.className = [
    'min-w-[300px] max-w-md px-4 py-3 rounded-xl shadow-lg',
    'text-white text-sm font-medium flex items-center gap-3',
    bgColor,
  ].join(' ');

  // Icon
  const icon = document.createElement('span');
  icon.innerHTML = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
  icon.className = 'flex-shrink-0 w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs';
  toast.appendChild(icon);

  // Message
  const msg = document.createElement('span');
  msg.textContent = message;
  toast.appendChild(msg);

  // Action button
  if (options?.action) {
    const btn = document.createElement('button');
    btn.textContent = options.action.label;
    btn.className = 'ml-auto bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg text-xs font-medium transition-colors';
    btn.onclick = () => {
      options.action!.onClick();
      container.remove();
    };
    toast.appendChild(btn);
  }

  container.appendChild(toast);
  document.body.appendChild(container);

  // Auto dismiss after 4 seconds
  setTimeout(() => {
    container.classList.add('opacity-0');
    setTimeout(() => container.remove(), 300);
  }, options?.duration ?? 4000);
}
