import { streamText } from 'ai';
import { createGroq } from '@ai-sdk/groq';

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

const DEFAULT_SYSTEM = `You are an AI email assistant in a Gmail client. Help users manage emails.

When the user asks you to perform an action, respond with a JSON action block at the end of your message, like this:

<action>{"action":"openEmail","emailId":"abc123"}</action>

Available actions:
- openEmail: {"action":"openEmail","emailId":"<email id>"}
- navigateView: {"action":"navigateView","view":"<inbox|sent|drafts>"}
- composeEmail: {"action":"composeEmail","to":"<email>","subject":"<text>","body":"<text>"}
- replyToEmail: {"action":"replyToEmail","emailId":"<id>","body":"<reply text>"}

Be concise. Never use emojis.

Current app context (provided per request):
- currentView: which view is shown
- selectedEmailId: currently open email ID (null if none)
- userEmail: authenticated user's email
- recentEmails: list of recent emails with id, subject, from, date, snippet

Use email IDs from the context exactly as they appear. Do not make up IDs.`;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages } = body;
    const context = body.context;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return Response.json(
        { error: 'Missing or empty messages array' },
        { status: 400 }
      );
    }

    const systemMessage = context
      ? `${DEFAULT_SYSTEM}\n\nCurrent app context:\n${JSON.stringify(context, null, 2)}`
      : DEFAULT_SYSTEM;

    const result = streamText({
      model: groq('llama-3.3-70b-versatile'),
      system: systemMessage,
      messages: messages.map((m: { role: string; content: string; parts?: Array<{ type: string; text?: string }> }) => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content || m.parts?.map((p) => p.text || '').join(' ') || '',
      })),
      temperature: 0.7,
    });

    return result.toUIMessageStreamResponse({
      sendReasoning: true,
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return Response.json(
      { error: 'Failed to process chat request', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
