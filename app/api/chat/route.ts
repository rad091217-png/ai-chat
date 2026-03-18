import { NextRequest } from 'next/server';
import { streamText } from 'ai';
import { claudeModel } from '@/lib/mastra';
import { CHARACTER_SYSTEM_PROMPT } from '@/lib/character';
import { MessageContent, TextContent, ImageContent } from '@/types/chat';

type APIMessage = {
  role: 'user' | 'assistant';
  content: any; // AI SDK format
};

type ChatRequest = {
  message: MessageContent;
  history: APIMessage[];
};

// Convert our MessageContent to AI SDK format
function convertToAIFormat(content: MessageContent): any {
  if (typeof content === 'string') {
    // Legacy string content
    return content;
  }
  
  if (Array.isArray(content)) {
    return content.map((item) => {
      if (item.type === 'text') {
        return { type: 'text', text: item.text };
      } else if (item.type === 'image') {
        return { 
          type: 'image', 
          image: `data:${item.mediaType};base64,${item.data}`
        };
      }
      return item;
    });
  }
  
  if (content.type === 'text') {
    return content.text;
  } else if (content.type === 'image') {
    return [
      { 
        type: 'image', 
        image: `data:${content.mediaType};base64,${content.data}`
      }
    ];
  }
  
  return content;
}

export async function POST(req: NextRequest) {
  const { message, history }: ChatRequest = await req.json();

  try {
    const convertedHistory = history.map(msg => ({
      ...msg,
      content: convertToAIFormat(msg.content)
    }));

    const result = streamText({
      model: claudeModel,
      system: CHARACTER_SYSTEM_PROMPT,
      messages: [
        ...convertedHistory,
        { role: 'user', content: convertToAIFormat(message) },
      ],
    });

    return result.toTextStreamResponse();
  } catch (e) {
    console.error('[chat] streamText error:', e);
    return new Response('エラーが発生しました。', { status: 500 });
  }
}
