import { useEffect } from 'react';
import type { Email } from '@/types/email';

interface UseKeyboardShortcutsOptions {
  emails: Email[];
  selectedEmailId: string | null;
  onSelectEmail: (email: Email) => void;
  onStar: (emailId: string) => void;
  onArchive: (emailId: string) => void;
  onDelete: (emailId: string) => void;
}

export function useKeyboardShortcuts({
  emails,
  selectedEmailId,
  onSelectEmail,
  onStar,
  onArchive,
  onDelete,
}: UseKeyboardShortcutsOptions) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      const tag = e.key;

      if (tag === 'j' || tag === 'k') {
        e.preventDefault();
        if (emails.length === 0) return;
        const currentIndex = selectedEmailId
          ? emails.findIndex((em) => em.id === selectedEmailId)
          : -1;
        const nextIndex = tag === 'j'
          ? Math.min(currentIndex + 1, emails.length - 1)
          : Math.max(currentIndex - 1, 0);
        if (nextIndex >= 0 && nextIndex < emails.length) {
          onSelectEmail(emails[nextIndex]);
        }
        return;
      }

      if (!selectedEmailId) return;

      if (tag === 'e') {
        e.preventDefault();
        onArchive(selectedEmailId);
      } else if (tag === 's') {
        e.preventDefault();
        onStar(selectedEmailId);
      } else if (tag === '#') {
        e.preventDefault();
        onDelete(selectedEmailId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [emails, selectedEmailId, onSelectEmail, onStar, onArchive, onDelete]);
}
