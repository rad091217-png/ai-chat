import { Message } from '@/types/chat';

type Props = {
  message: Message;
};

export default function MessageBubble({ message }: Props) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`max-w-[75%] px-4 py-3 rounded-2xl shadow-md text-sm leading-relaxed break-words ${
          isUser
            ? 'bg-[#FF6B9D] text-white rounded-br-sm'
            : 'bg-yellow-50 text-gray-800 rounded-bl-sm border border-yellow-100'
        }`}
      >
        {message.images && message.images.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {message.images.map((img, i) => (
              <img
                key={i}
                src={`data:${img.mediaType};base64,${img.data}`}
                alt={`添付画像 ${i + 1}`}
                className="max-w-[200px] max-h-[200px] object-contain rounded-xl"
              />
            ))}
          </div>
        )}
        {message.content && (
          <span className="whitespace-pre-wrap">{message.content}</span>
        )}
      </div>
    </div>
  );
}
