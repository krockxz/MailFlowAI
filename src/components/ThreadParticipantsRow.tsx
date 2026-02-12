import { EmailAddress } from '@/types/email';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';

interface ThreadParticipantsRowProps {
  messages: Array<{ from: EmailAddress; to?: EmailAddress[] }>;
}

interface Participant {
  email: string;
  name?: string;
}

export function ThreadParticipantsRow({ messages }: ThreadParticipantsRowProps) {
  // Extract unique participants from all messages
  const participants: Participant[] = (() => {
    const seen = new Set<string>();
    const result: Participant[] = [];

    for (const msg of messages) {
      // Add sender
      const senderEmail = msg.from.email.toLowerCase();
      if (!seen.has(senderEmail)) {
        seen.add(senderEmail);
        result.push({
          email: msg.from.email,
          name: msg.from.name,
        });
      }

      // Add recipients
      if (msg.to) {
        for (const recipient of msg.to) {
          const recipientEmail = recipient.email.toLowerCase();
          if (!seen.has(recipientEmail)) {
            seen.add(recipientEmail);
            result.push({
              email: recipient.email,
              name: recipient.name,
            });
          }
        }
      }
    }

    return result;
  })();

  const visibleCount = Math.min(5, participants.length);
  const hiddenCount = Math.max(0, participants.length - 5);

  return (
    <div className="flex items-center gap-1">
      {participants.slice(0, visibleCount).map((participant) => (
        <Avatar
          key={participant.email}
          className="w-6 h-6 border-2 border-white dark:border-neutral-950 -ml-1 first:ml-0"
          title={participant.name || participant.email}
        >
          <AvatarFallback className="bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 text-xs">
            {getInitials(participant.name || participant.email)}
          </AvatarFallback>
        </Avatar>
      ))}
      {hiddenCount > 0 && (
        <div className="ml-1 text-xs text-neutral-500 dark:text-neutral-400">
          +{hiddenCount} more
        </div>
      )}
    </div>
  );
}
