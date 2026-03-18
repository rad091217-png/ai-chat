import { NextRequest } from 'next/server';
import { streamText } from 'ai';
import { claudeModel } from '@/lib/mastra';
import { CHARACTER_SYSTEM_PROMPT } from '@/lib/character';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

type ChatRequest = {
  message: string;
  history: Message[];
};

export async function POST(req: NextRequest) {
  const { message, history }: ChatRequest = await req.json();

  try {
    const result = streamText({
      model: claudeModel,
      system: CHARACTER_SYSTEM_PROMPT,
      messages: [
        ...history,
        { role: 'user', content: message },
      ],
    });

    return result.toTextStreamResponse();
  } catch (e) {
    console.error('[chat] streamText error:', e);
    return new Response('エラーが発生しました。', { status: 500 });
  }
}
