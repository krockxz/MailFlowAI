import { useCallback } from 'react';
import { useAppStore } from '@/store';
import { createGmailService } from '@/services/gmail';
import { getValidAccessToken } from '@/services/auth';
import type { Email } from '@/types/email';
import type { GmailMessage } from '@/types/email';

/**
 * Hook for fetching and managing emails
 */
export function useEmails() {
  const {
    emails,
    setEmails,
    isLoading,
    setIsLoading,
    setLastSyncTime,
  } = useAppStore();

  /**
   * Fetch inbox emails
   */
  const fetchInbox = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = await getValidAccessToken();
      const gmail = createGmailService(token);

      // List messages
      const { messages } = await gmail.listMessages(['INBOX'], 50);

      // Fetch full message details
      const fullMessages = await gmail.getBatchMessages(
        messages.slice(0, 30).map((m) => m.id)
      );

      // Parse messages
      const parsedEmails = fullMessages.map((msg: GmailMessage) =>
        gmail.parseMessage(msg)
      );

      setEmails('inbox', parsedEmails);
      setLastSyncTime(new Date());
    } catch (error) {
      console.error('Failed to fetch inbox:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [setEmails, setIsLoading, setLastSyncTime]);

  /**
   * Fetch sent emails
   */
  const fetchSent = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = await getValidAccessToken();
      const gmail = createGmailService(token);

      // List messages
      const { messages } = await gmail.listMessages(['SENT'], 50);

      // Fetch full message details
      const fullMessages = await gmail.getBatchMessages(
        messages.slice(0, 30).map((m) => m.id)
      );

      // Parse messages
      const parsedEmails = fullMessages.map((msg: GmailMessage) =>
        gmail.parseMessage(msg)
      );

      setEmails('sent', parsedEmails);
      setLastSyncTime(new Date());
    } catch (error) {
      console.error('Failed to fetch sent:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [setEmails, setIsLoading, setLastSyncTime]);

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
        const token = await getValidAccessToken();
        const gmail = createGmailService(token);

        const result = await gmail.sendEmail(options);

        // Refresh sent folder
        await fetchSent();

        return result;
      } catch (error) {
        console.error('Failed to send email:', error);
        throw error;
      }
    },
    [fetchSent]
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
   * Search emails
   */
  const searchEmails = useCallback(async (query: string): Promise<Email[]> => {
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
      return fullMessages.map((msg: GmailMessage) =>
        gmail.parseMessage(msg)
      );
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

  return {
    emails,
    isLoading,
    fetchInbox,
    fetchSent,
    sendEmail,
    replyToEmail,
    markAsRead,
    searchEmails,
    fetchEmail,
  };
}
