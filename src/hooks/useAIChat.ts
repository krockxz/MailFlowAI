import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useAppStore } from '@/store';
import { useMemo } from 'react';

export function useAIChat() {
  const {
    currentView,
    selectedEmailId,
    emails,
    getCurrentFilters,
    user,
    compose,
  } = useAppStore();

  const context = useMemo(() => ({
    currentView,
    selectedEmailId,
    filters: getCurrentFilters(),
    userEmail: user?.emailAddress,
    emailCount: {
      inbox: emails.inbox.length,
      sent: emails.sent.length,
    },
    recentEmails: [...emails.inbox, ...emails.sent]
      .slice(0, 10)
      .map((e) => ({
        id: e.id,
        subject: e.subject,
        from: e.from,
        to: e.to,
        date: e.date.toISOString(),
        isUnread: e.isUnread,
        snippet: e.snippet?.slice(0, 100),
      })),
    composeOpen: compose.isOpen,
  }), [
    currentView,
    selectedEmailId,
    getCurrentFilters,
    user?.emailAddress,
    emails.inbox,
    emails.sent,
    compose.isOpen,
  ]);

  const chat = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
    }),
    onFinish: ({ message }) => {
      console.warn('AI response:', message);
    },
    onError: (error) => {
      console.error('Chat error:', error);
    },
  });

  // Wrap sendMessage to include context
  const sendMessageWithContext = (text: string) => {
    return chat.sendMessage(
      { text },
      {
        body: {
          context,
        },
      }
    );
  };

  return {
    ...chat,
    sendMessage: sendMessageWithContext,
  };
}
