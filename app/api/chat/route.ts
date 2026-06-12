import { streamText } from 'ai';
import { createGroq } from '@ai-sdk/groq';

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

const DEFAULT_SYSTEM = `You are an AI email assistant integrated into a Gmail client. Help users manage emails through natural language.

Be concise and helpful. Never use emojis in responses.

When you need to perform an action on the user's email, you will receive a structured "context" object containing the current app state. Use this context to answer questions accurately.

Available information in context:
- currentView: which view the user is on (inbox, sent, trash, etc.)
- selectedEmailId: the currently open email
- emails: list of emails in the current view (id, subject, from, to, date, snippet, isUnread)
- filters: active search filters
- userEmail: the authenticated user's email address

You can help the user:
- Search and find emails
- Summarize email threads
- Draft replies
- Explain what an email is about
- Navigate between views
- Provide email management tips

Always reference specific emails by their subject and sender when possible.`;

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

    console.warn('Chat request received', {
      messageCount: messages.length,
      hasContext: !!context,
      lastMessage: messages[messages.length - 1],
    });

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
