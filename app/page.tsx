'use client';

import { useState } from 'react';
import { Message } from '@/types/chat';
import ChatWindow from '@/components/ChatWindow';
import ChatInput from '@/components/ChatInput';
import { CHARACTER_NAME } from '@/lib/character';

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = async (text: string) => {
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
    };

    const history = messages.map(({ role, content }) => ({ role, content }));

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    const aiMessageId = crypto.randomUUID();
    const aiMessage: Message = { id: aiMessageId, role: 'assistant', content: '' };
    setMessages((prev) => [...prev, aiMessage]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history }),
      });

      if (!res.ok || !res.body) throw new Error('API error');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMessageId ? { ...m, content: m.content + chunk } : m
          )
        );
      }
    } catch (e) {
      console.error(e);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiMessageId
            ? { ...m, content: 'エラーが発生しました。もう一度お試しください。' }
            : m
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // モバイル：全画面。PC：背景グラデーション + カード中央配置
    <div className="flex flex-col h-screen bg-gradient-to-br from-pink-50 to-yellow-50 md:items-center md:justify-center md:p-8">
      <div className="flex flex-col w-full max-w-2xl h-full md:h-[85vh] md:rounded-3xl md:shadow-2xl md:overflow-hidden bg-white">
        <header className="flex items-center justify-center py-4 bg-white border-b border-pink-100">
          <h1 className="text-xl text-[#FF6B9D] font-[family-name:var(--font-pacifico)]">{CHARACTER_NAME} とおしゃべり 💬</h1>
        </header>
        <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-b from-pink-50/30 to-yellow-50/30">
          <ChatWindow messages={messages} isLoading={isLoading} />
          <ChatInput onSubmit={handleSubmit} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}
