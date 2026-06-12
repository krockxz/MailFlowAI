import { useCallback } from 'react';
import { useAppStore } from '@/store';
import { useEmails } from '@/hooks/useEmails';
import type { Email } from '@/types/email';
import { formatReplyDate } from '@/lib/utils';

export function useEmailHandlers() {
  const emails = useAppStore((s) => s.emails);
  const compose = useAppStore((s) => s.compose);
  const setCompose = useAppStore((s) => s.setCompose);
  const resetCompose = useAppStore((s) => s.resetCompose);
  const setSelectedEmailId = useAppStore((s) => s.setSelectedEmailId);

  const { sendEmail, markAsRead } = useEmails();

  const handleSelectEmail = useCallback(async (email: Email) => {
    setSelectedEmailId(email.id);
    if (email.isUnread) {
      await markAsRead(email.id, true);
    }
  }, [setSelectedEmailId, markAsRead]);

  const handleCompose = useCallback(() => {
    setCompose({
      isOpen: true,
      to: '',
      subject: '',
      body: '',
      cc: '',
      isSending: false,
      isAIComposed: false,
    });
  }, [setCompose]);

  const handleReply = useCallback((emailId: string) => {
    const email = [...emails.inbox, ...emails.sent].find((e: Email) => e.id === emailId);
    if (email) {
      setCompose({
        isOpen: true,
        to: email.from.email,
        subject: email.subject.startsWith('Re:')
          ? email.subject
          : `Re: ${email.subject}`,
        body: `\n\n----------\nOn ${formatReplyDate(email.date)}, ${email.from.name || email.from.email} wrote:\n${email.body.slice(0, 200)}...`,
        cc: '',
        isSending: false,
        isAIComposed: false,
      });
    }
  }, [emails, setCompose]);

  const handleForward = useCallback((emailId: string) => {
    const email = [...emails.inbox, ...emails.sent].find((e: Email) => e.id === emailId);
    if (email) {
      setCompose({
        isOpen: true,
        subject: `Fwd: ${email.subject}`,
        body: `\n\n----------\nForwarded message:\nFrom: ${email.from.name || email.from.email}\nSubject: ${email.subject}\n\n${email.body}`,
        to: '',
        cc: '',
        isSending: false,
        isAIComposed: false,
      });
    }
  }, [emails, setCompose]);

  const handleSendEmail = useCallback(async (data: {
    to: string;
    subject: string;
    body: string;
    cc?: string;
    bcc?: string;
  }) => {
    await sendEmail({
      to: [data.to],
      subject: data.subject,
      body: data.body,
      cc: data.cc ? [data.cc] : undefined,
    });
  }, [sendEmail]);

  const handleCloseCompose = useCallback(() => {
    setCompose({ ...compose, isOpen: false });
  }, [compose, setCompose]);

  return {
    handleSelectEmail,
    handleCompose,
    handleReply,
    handleForward,
    handleSendEmail,
    handleCloseCompose,
    resetCompose,
  };
}
