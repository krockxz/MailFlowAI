import { useEffect, useRef } from 'react';

const DRAFT_KEY = 'ai-mail-app-compose-draft';
const AUTOSAVE_INTERVAL = 30000; // 30 seconds

interface DraftData {
  to: string;
  subject: string;
  body: string;
  cc: string;
  timestamp: number;
}

/**
 * Hook for auto-saving compose form drafts
 *
 * Saves draft to localStorage every 30 seconds (KISS: simple storage)
 * and provides recovery functionality.
 */
export function useDraftAutosave(
  isOpen: boolean,
  formState: { isDirty: boolean },
  getValues: () => DraftData
) {
  const timer = useRef<NodeJS.Timeout | null>(null);

  // Clear draft when form is explicitly closed/cleared
  const clearDraft = () => {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch (e) {
      console.warn('Failed to clear draft:', e);
    }
  };

  // Load saved draft on mount
  const loadDraft = (): DraftData | null => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (!saved) return null;

      const draft = JSON.parse(saved) as DraftData;
      // Only restore if draft is less than 24 hours old
      const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
      if (draft.timestamp < dayAgo) {
        clearDraft();
        return null;
      }
      return draft;
    } catch (e) {
      console.warn('Failed to load draft:', e);
      return null;
    }
  };

  // Auto-save effect
  useEffect(() => {
    if (!isOpen || !formState.isDirty) {
      // Don't save if form is closed or pristine
      if (timer.current) {
        clearTimeout(timer.current);
        timer.current = null;
      }
      return;
    }

    // Set up autosave timer
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      try {
        const draft = {
          ...getValues(),
          timestamp: Date.now(),
        };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      } catch (e) {
        console.warn('Failed to save draft:', e);
      }
    }, AUTOSAVE_INTERVAL);

    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    };
  }, [isOpen, formState.isDirty, getValues]);

  return {
    clearDraft,
    loadDraft,
    hasDraft: () => !!localStorage.getItem(DRAFT_KEY),
  };
}
