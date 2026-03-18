import { Message } from '@/types/chat';

type Props = {
  message: Message;
};

export default function MessageBubble({ message }: Props) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`max-w-[75%] px-4 py-3 rounded-2xl shadow-md text-sm leading-relaxed whitespace-pre-wrap break-words ${
          isUser
            ? 'bg-[#FF6B9D] text-white rounded-br-sm'
            : 'bg-yellow-50 text-gray-800 rounded-bl-sm border border-yellow-100'
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}
