import { NextRequest } from 'next/server';
import { streamText } from 'ai';
import { claudeModel } from '@/lib/mastra';
import { CHARACTER_SYSTEM_PROMPT } from '@/lib/character';
import { ImageContent } from '@/types/chat';

type HistoryMessage = {
  role: 'user' | 'assistant';
  content: string;
  images?: ImageContent[];
};

type ChatRequest = {
  message: string;
  images?: ImageContent[];
  history: HistoryMessage[];
};

type AiMessageContent =
  | { type: 'text'; text: string }
  | { type: 'image'; image: string; mimeType: string };

function buildUserContent(text: string, images?: ImageContent[]): string | AiMessageContent[] {
  if (!images || images.length === 0) return text;

  const parts: AiMessageContent[] = images.map((img) => ({
    type: 'image',
    image: img.data,
    mimeType: img.mediaType,
  }));

  if (text) {
    parts.push({ type: 'text', text });
  }

  return parts;
}

export async function POST(req: NextRequest) {
  const { message, images, history }: ChatRequest = await req.json();

  const historyMessages = history.map((m) => {
    if (m.role === 'user') {
      return { role: 'user' as const, content: buildUserContent(m.content, m.images) };
    }
    return { role: 'assistant' as const, content: m.content };
  });

  try {
    const result = streamText({
      model: claudeModel,
      system: CHARACTER_SYSTEM_PROMPT,
      messages: [
        ...historyMessages,
        { role: 'user', content: buildUserContent(message, images) },
      ],
    });

    return result.toTextStreamResponse();
  } catch (e) {
    console.error('[chat] streamText error:', e);
    return new Response('エラーが発生しました。', { status: 500 });
  }
}
