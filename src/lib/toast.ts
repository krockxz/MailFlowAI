interface ToastAction {
  label: string;
  onClick: () => void;
}

interface ToastOptions {
  duration?: number;
  action?: ToastAction;
}

export function showSendSuccess(_recipient: string): void {
  showToast('Email sent successfully!', 'success', {
    duration: 4000,
    action: {
      label: 'View in Sent',
      onClick: () => {
        const useAppStore = require('@/store').useAppStore;
        useAppStore.getState().setCurrentView('sent');
      },
    },
  });
}

export function showError(message: string, onRetry?: () => void): void {
  showToast(message, 'error', {
    duration: 6000,
    action: onRetry ? { label: 'Retry', onClick: onRetry } : undefined,
  });
}

export function showSendError(error: unknown, onRetry?: () => void): void {
  const message = error instanceof Error ? error.message : 'Failed to send email';
  showError(message, onRetry);
}

function showToast(
  message: string,
  type: 'success' | 'error',
  options?: ToastOptions
): void {
  const existing = document.getElementById('toast-container');
  if (existing) existing.remove();

  const container = document.createElement('div');
  container.id = 'toast-container';
  container.className = [
    'fixed top-4 right-4 z-[9999] flex flex-col gap-2',
    'animate-in slide-in-from-top-2 duration-300',
  ].join(' ');

  const toast = document.createElement('div');
  const bgColor = type === 'success' ? 'bg-emerald-500' : 'bg-red-500';
  toast.className = [
    'min-w-[300px] max-w-md px-4 py-3 rounded-xl shadow-lg',
    'text-white text-sm font-medium flex items-center gap-3',
    bgColor,
  ].join(' ');

  const icon = document.createElement('span');
  icon.innerHTML = type === 'success' ? '✓' : '✕';
  icon.className = 'flex-shrink-0 w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs';
  toast.appendChild(icon);

  const msg = document.createElement('span');
  msg.textContent = message;
  toast.appendChild(msg);

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

  setTimeout(() => {
    container.classList.add('opacity-0');
    setTimeout(() => container.remove(), 300);
  }, options?.duration ?? 4000);
}
