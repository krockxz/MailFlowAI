import { useCallback } from 'react';
import { useAppStore } from '@/store';
import { createGmailService } from '@/services/gmail';
import { getValidAccessToken } from '@/services/auth';
import type { Email } from '@/types/email';
import type { GmailMessage } from '@/types/email';

const PAGE_SIZE = 30;

/**
 * Hook for fetching and managing emails
 */
export function useEmails() {
  const {
    emails,
    setEmails,
    isLoading,
    setIsLoading,
    setIsSending,
    setLastSyncTime,
    pagination,
    setPagination,
    resetAllPagination,
  } = useAppStore();

  /**
   * Fetch inbox emails with pagination support
   */
  const fetchInbox = useCallback(async () => {
    try {
      setIsLoading(true);
      setPagination('inbox', { status: 'loading' });

      const token = await getValidAccessToken();
      const gmail = createGmailService(token);

      // Get current page token from pagination state
      const currentPageToken = pagination.inbox.pageToken;

      // List messages
      const response = await gmail.listMessages(['INBOX'], PAGE_SIZE, currentPageToken || undefined);

      // Fetch full message details
      const fullMessages = await gmail.getBatchMessages(
        response.messages.map((m) => m.id)
      );

      // Parse messages
      const parsedEmails = fullMessages.map((msg: GmailMessage) =>
        gmail.parseMessage(msg)
      );

      // Append or replace emails based on whether we're paginating
      if (currentPageToken) {
        // Appending - add to existing emails
        setEmails('inbox', [...emails.inbox, ...parsedEmails]);
      } else {
        // Initial fetch - replace emails
        setEmails('inbox', parsedEmails);
      }

      // Update pagination state with next page token and timestamp
      setPagination('inbox', {
        nextPageToken: response.nextPageToken || null,
        hasMore: !!response.nextPageToken,
        pageToken: response.nextPageToken || null,
        status: 'success',
        lastLoadedAt: Date.now(),
      });

      setLastSyncTime(new Date());
    } catch (error) {
      console.error('Failed to fetch inbox:', error);
      setPagination('inbox', { status: 'error' });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [emails.inbox, pagination.inbox.pageToken, setEmails, setIsLoading, setLastSyncTime, setPagination]);

  /**
   * Fetch sent emails with pagination support
   */
  const fetchSent = useCallback(async () => {
    try {
      setIsLoading(true);
      setPagination('sent', { status: 'loading' });

      const token = await getValidAccessToken();
      const gmail = createGmailService(token);

      // Get current page token from pagination state
      const currentPageToken = pagination.sent.pageToken;

      // List messages
      const response = await gmail.listMessages(['SENT'], PAGE_SIZE, currentPageToken || undefined);

      // Fetch full message details
      const fullMessages = await gmail.getBatchMessages(
        response.messages.map((m) => m.id)
      );

      // Parse messages
      const parsedEmails = fullMessages.map((msg: GmailMessage) =>
        gmail.parseMessage(msg)
      );

      // Append or replace emails based on whether we're paginating
      if (currentPageToken) {
        // Appending - add to existing emails
        setEmails('sent', [...emails.sent, ...parsedEmails]);
      } else {
        // Initial fetch - replace emails
        setEmails('sent', parsedEmails);
      }

      // Update pagination state with next page token and timestamp
      setPagination('sent', {
        nextPageToken: response.nextPageToken || null,
        hasMore: !!response.nextPageToken,
        pageToken: response.nextPageToken || null,
        status: 'success',
        lastLoadedAt: Date.now(),
      });

      setLastSyncTime(new Date());
    } catch (error) {
      console.error('Failed to fetch sent:', error);
      setPagination('sent', { status: 'error' });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [emails.sent, pagination.sent.pageToken, setEmails, setIsLoading, setLastSyncTime, setPagination]);

  /**
   * Load more emails for a specific folder
   */
  const loadMore = useCallback(async (type: 'inbox' | 'sent') => {
    const paginationState = pagination[type];

    // Don't load if already loading or no more emails
    if (paginationState.status === 'loading' || !paginationState.hasMore || !paginationState.nextPageToken) {
      return;
    }

    try {
      // Set loading state for pagination
      setPagination(type, { status: 'loading' });

      // Update page token to fetch next page
      setPagination(type, { pageToken: paginationState.nextPageToken });

      const token = await getValidAccessToken();
      const gmail = createGmailService(token);

      const labelIds = type === 'inbox' ? ['INBOX'] : ['SENT'];
      const response = await gmail.listMessages(labelIds, PAGE_SIZE, paginationState.nextPageToken);

      // Fetch full message details
      const fullMessages = await gmail.getBatchMessages(
        response.messages.map((m) => m.id)
      );

      // Parse messages
      const parsedEmails = fullMessages.map((msg: GmailMessage) =>
        gmail.parseMessage(msg)
      );

      // Append to existing emails
      setEmails(type, [...emails[type], ...parsedEmails]);

      // Update pagination state
      setPagination(type, {
        nextPageToken: response.nextPageToken || null,
        hasMore: !!response.nextPageToken,
        pageToken: response.nextPageToken || null,
        status: 'success',
        lastLoadedAt: Date.now(),
      });

      setLastSyncTime(new Date());
    } catch (error) {
      console.error(`Failed to load more ${type} emails:`, error);
      // Reset loading state on error
      setPagination(type, { status: 'error' });
      throw error;
    }
  }, [pagination, emails, setEmails, setLastSyncTime, setPagination]);

  /**
   * Send an email
   */
  const sendEmail = useCallback(
    async (options: {
      to: string[];
      subject: string;
      body: string;
      cc?: string[];
      bcc?: string[];
    }) => {
      try {
        // Set sending state
        setIsSending(true);

        const token = await getValidAccessToken();
        const gmail = createGmailService(token);

        const result = await gmail.sendEmail(options);

        // Refresh sent folder
        await fetchSent();

        return result;
      } catch (error) {
        console.error('Failed to send email:', error);
        throw error;
      } finally {
        setIsSending(false);
      }
    },
    [fetchSent, setIsSending]
  );

  /**
   * Reply to an email
   */
  const replyToEmail = useCallback(
    async (emailId: string, body: string) => {
      try {
        const token = await getValidAccessToken();
        const gmail = createGmailService(token);

        // Find the email in our store
        const email = [...emails.inbox, ...emails.sent].find(
          (e) => e.id === emailId
        );

        if (!email) {
          throw new Error('Email not found');
        }

        // Reply to sender
        const to = [email.from.email];

        const result = await gmail.sendEmail({
          to,
          subject: email.subject.startsWith('Re:')
            ? email.subject
            : `Re: ${email.subject}`,
          body,
          threadId: email.threadId,
        });

        // Refresh
        await fetchSent();

        return result;
      } catch (error) {
        console.error('Failed to reply:', error);
        throw error;
      }
    },
    [emails, fetchSent]
  );

  /**
   * Mark as read/unread
   */
  const markAsRead = useCallback(async (emailId: string, isRead = true) => {
    try {
      const token = await getValidAccessToken();
      const gmail = createGmailService(token);

      if (isRead) {
        await gmail.markAsRead(emailId);
      } else {
        await gmail.markAsUnread(emailId);
      }

      // Update local state
      useAppStore.getState().updateEmail(emailId, { isUnread: !isRead });
    } catch (error) {
      console.error('Failed to mark email:', error);
      throw error;
    }
  }, []);

  /**
   * Search emails with caching (60-second cache)
   */
  const searchEmails = useCallback(async (query: string): Promise<Email[]> => {
    const state = useAppStore.getState();
    const SEARCH_CACHE_DURATION = 60000; // 60 seconds

    // Check if we have cached results for this query
    if (
      state.search.isSearchMode &&
      state.search.query === query &&
      state.search.timestamp &&
      Date.now() - state.search.timestamp < SEARCH_CACHE_DURATION
    ) {
      return state.search.results;
    }

    try {
      setIsLoading(true);
      const token = await getValidAccessToken();
      const gmail = createGmailService(token);

      const { messages } = await gmail.searchMessages(query, 50);

      // Fetch full message details
      const fullMessages = await gmail.getBatchMessages(
        messages.map((m) => m.id)
      );

      // Parse messages
      const results = fullMessages.map((msg: GmailMessage) =>
        gmail.parseMessage(msg)
      );

      // Store results in cache and enter search mode
      state.setSearchResults(results, query);

      return results;
    } catch (error) {
      console.error('Failed to search emails:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [setIsLoading]);

  /**
   * Fetch a single email
   */
  const fetchEmail = useCallback(async (emailId: string): Promise<Email> => {
    try {
      const token = await getValidAccessToken();
      const gmail = createGmailService(token);

      const message = await gmail.getMessage(emailId);
      return gmail.parseMessage(message);
    } catch (error) {
      console.error('Failed to fetch email:', error);
      throw error;
    }
  }, []);

  /**
   * Fetch a full thread
   */
  const fetchThread = useCallback(async (threadId: string): Promise<Email[]> => {
    try {
      const token = await getValidAccessToken();
      const gmail = createGmailService(token);

      const thread = await gmail.getThread(threadId);

      // Update active thread in store
      useAppStore.getState().setActiveThread(thread);

      return thread;
    } catch (error) {
      console.error('Failed to fetch thread:', error);
      throw error;
    }
  }, []);

  return {
    emails,
    isLoading,
    pagination,
    fetchInbox,
    fetchSent,
    loadMore,
    resetAllPagination,
    sendEmail,
    replyToEmail,
    markAsRead,
    searchEmails,
    fetchEmail,
    fetchThread,
  };
}
