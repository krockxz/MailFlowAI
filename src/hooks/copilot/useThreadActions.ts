/**
 * Hook that registers thread-specific AI actions
 *
 * Provides:
 * - summarizeThread: Generate a summary of the current email thread
 * - draftReplyToLast: Draft a reply to the most recent message in the thread
 */

import { useCopilotAction } from '@copilotkit/react-core';
import { useAppStore } from '@/store';
import type { Email } from '@/types/email';

export function useThreadActions() {
  const { activeThread, selectedEmailId, emails, compose } = useAppStore();

  function getCurrentThread(): Email[] | null {
    if (activeThread && activeThread.length > 0) {
      return activeThread;
    }

    if (selectedEmailId) {
      const allEmails = [...emails.inbox, ...emails.sent];
      const email = allEmails.find((e: Email) => e.id === selectedEmailId);
      if (email) {
        return [email];
      }
    }

    return null;
  }

  function buildThreadContext(thread: Email[]): string {
    if (thread.length === 0) return '';

    const participants = new Set<string>();
    const messages = thread.map((msg, idx) => {
      const sender = msg.from.name || msg.from.email;
      participants.add(sender);

      return `[${idx + 1}] ${sender} (${new Date(msg.date).toLocaleString()}):
${msg.body.trim()}`;
    }).join('\n\n');

    return `Thread: "${thread[0].subject}"
Participants: ${Array.from(participants).join(', ')}
Messages: ${thread.length}

${messages}`;
  }

  // Summarize thread action
  useCopilotAction({
    name: 'summarizeThread',
    description: 'Generate a concise summary of the current email thread conversation. Analyzes all messages to extract key points, decisions, and action items.',
    parameters: [
      {
        name: 'focus',
        type: 'string',
        description: 'Optional focus area for the summary (e.g., "decisions", "action items", "timeline", "overview")',
        required: false,
      },
    ],
    handler: async () => {
      const thread = getCurrentThread();

      if (!thread || thread.length === 0) {
        return 'No thread is currently open. Please open an email thread first by clicking on it.';
      }

      if (thread.length === 1) {
        return `This is a single message thread.

**From:** ${thread[0].from.name || thread[0].from.email}
**Date:** ${new Date(thread[0].date).toLocaleString()}

**Summary:**
${thread[0].body.trim().substring(0, 500)}${thread[0].body.length > 500 ? '...' : ''}`;
      }

      return buildThreadContext(thread);
    },
  });

  // Draft reply to last message action
  useCopilotAction({
    name: 'draftReplyToLast',
    description: 'Draft a reply to the most recent message in the current thread. Opens compose form with recipient, subject, and AI-generated reply content.',
    parameters: [
      {
        name: 'tone',
        type: 'string',
        description: 'Tone for the reply (e.g., "professional", "casual", "friendly", "formal")',
        required: false,
      },
      {
        name: 'keyPoints',
        type: 'string',
        description: 'Key points to address in the reply',
        required: false,
      },
    ],
    handler: async ({ tone = 'professional', keyPoints }) => {
      const thread = getCurrentThread();

      if (!thread || thread.length === 0) {
        return 'No thread is currently open. Please open an email thread first.';
      }

      const lastMessage = thread[thread.length - 1];

      if (!lastMessage.from || !lastMessage.from.email) {
        return 'Cannot reply to this message: sender information is missing.';
      }

      const threadContext = buildThreadContext(thread);
      const subject = lastMessage.subject.startsWith('Re:')
        ? lastMessage.subject
        : `Re: ${lastMessage.subject}`;

      const instructions = `Draft a ${tone} reply to this email thread:

${threadContext}

${keyPoints ? `Key points to address: ${keyPoints}` : ''}

Please draft a response that:
1. Acknowledges the previous conversation
2. ${keyPoints ? 'Addresses the key points mentioned' : 'Responds to the last message appropriately'}
3. Maintains a ${tone} tone
4. Is concise and clear

--- DRAFT YOUR REPLY BELOW THIS LINE ---`;

      // Open compose with reply details
      useAppStore.getState().setCompose({
        ...compose,
        to: lastMessage.from.email,
        subject: subject,
        body: instructions,
        isOpen: true,
        isAIComposed: true,
      });

      const senderName = lastMessage.from.name || lastMessage.from.email;
      return `Drafting reply to ${senderName}. Please review and edit the generated response before sending.`;
    },
  });
}
