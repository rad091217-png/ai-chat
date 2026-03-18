'use client';

import { useState, KeyboardEvent } from 'react';

type Props = {
  onSubmit: (message: string) => void;
  isLoading: boolean;
};

export default function ChatInput({ onSubmit, isLoading }: Props) {
  const [value, setValue] = useState('');

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;
    onSubmit(trimmed);
    setValue('');
  };

  return (
    <div className="flex items-end gap-2 p-4 bg-white border-t border-pink-100">
      <textarea
        className="flex-1 resize-none rounded-2xl border-2 border-pink-200 px-4 py-3 text-sm outline-none focus:border-[#FF6B9D] transition-colors min-h-[48px] max-h-32"
        placeholder="メッセージを入力..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={isLoading}
        rows={1}
      />
      <button
        onClick={handleSubmit}
        disabled={isLoading || !value.trim()}
        className="flex-shrink-0 w-12 h-12 rounded-full bg-[#FF6B9D] text-white flex items-center justify-center shadow-md transition-all hover:bg-pink-500 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="送信"
      >
        {isLoading ? (
          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
          </svg>
        )}
      </button>
    </div>
  );
}
