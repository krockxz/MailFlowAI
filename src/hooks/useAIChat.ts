import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useAppStore } from '@/store';
import { useMemo, useEffect, useRef } from 'react';

interface ToolResult {
  action: string;
  [key: string]: unknown;
}

export function useAIChat() {
  const {
    currentView,
    selectedEmailId,
    emails,
    getCurrentFilters,
    user,
    compose,
    setSelectedEmailId,
    setCurrentView,
    setCompose,
  } = useAppStore();

  const processedActions = useRef(new Set<string>());

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
        date: e.date instanceof Date ? e.date.toISOString() : e.date,
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

  const handleActionResult = (result: ToolResult) => {
    switch (result.action) {
      case 'openEmail':
        if (typeof result.emailId === 'string') {
          setSelectedEmailId(result.emailId);
        }
        break;
      case 'navigateView':
        if (typeof result.view === 'string') {
          setCurrentView(result.view as 'inbox' | 'sent' | 'drafts');
        }
        break;
      case 'composeEmail':
        setCompose({
          isOpen: true,
          to: (result.to as string) || '',
          subject: (result.subject as string) || '',
          body: (result.body as string) || '',
          cc: '',
          bcc: '',
          isSending: false,
          isAIComposed: true,
        });
        break;
      case 'replyToEmail':
        if (typeof result.emailId === 'string') {
          setSelectedEmailId(result.emailId);
          setCompose({
            isOpen: true,
            to: '',
            subject: '',
            body: (result.body as string) || '',
            cc: '',
            bcc: '',
            isSending: false,
            isAIComposed: true,
          });
        }
        break;
    }
  };

  const extractActions = (text: string): string[] => {
    const matches: string[] = [];
    const regex = /<action>(.*?)<\/action>/gs;
    let match;
    while ((match = regex.exec(text)) !== null) {
      matches.push(match[1]);
    }
    return matches;
  };

  const chat = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
    }),
    onFinish: ({ message }) => {
      if (!message?.parts) return;

      for (const part of message.parts) {
        if (part.type !== 'text') continue;

        const text = (part as { text?: string }).text;
        if (!text) continue;

        const actionJsons = extractActions(text);
        for (const json of actionJsons) {
          try {
            const result = JSON.parse(json) as ToolResult;
            if (result.action) {
              const dedupeKey = `${result.action}-${JSON.stringify(result)}`;
              if (processedActions.current.has(dedupeKey)) continue;
              processedActions.current.add(dedupeKey);
              handleActionResult(result);
            }
          } catch {
            // skip malformed JSON
          }
        }
      }
    },
    onError: (error) => {
      console.error('Chat error:', error);
    },
  });

  // Clean up when messages reset
  useEffect(() => {
    if (chat.messages.length === 0) {
      processedActions.current.clear();
    }
  }, [chat.messages.length]);

  // Wrap sendMessage to include context
  const sendMessageWithContext = (text: string) => {
    return chat.sendMessage(
      { text },
      {
        body: { context },
      }
    );
  };

  return {
    ...chat,
    sendMessage: sendMessageWithContext,
  };
}
