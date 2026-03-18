import { Message, MessageContent, TextContent, ImageContent } from '@/types/chat';

type Props = {
  message: Message;
};

function renderContent(content: MessageContent): React.ReactNode {
  // Handle legacy string content
  if (typeof content === 'string') {
    return content;
  }

  // Handle single content items
  if (!Array.isArray(content)) {
    if (content.type === 'text') {
      return content.text;
    } else if (content.type === 'image') {
      return (
        <img
          src={`data:${content.mediaType};base64,${content.data}`}
          alt="添付画像"
          className="max-w-full rounded-lg mt-2"
          loading="lazy"
        />
      );
    }
  }

  // Handle array of content items
  return content.map((item, index) => (
    <div key={index} className={index > 0 ? 'mt-2' : ''}>
      {item.type === 'text' ? (
        <span className="whitespace-pre-wrap break-words">{item.text}</span>
      ) : item.type === 'image' ? (
        <img
          src={`data:${item.mediaType};base64,${item.data}`}
          alt="添付画像"
          className="max-w-full rounded-lg"
          loading="lazy"
        />
      ) : null}
    </div>
  ));
}

export default function MessageBubble({ message }: Props) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`max-w-[75%] px-4 py-3 rounded-2xl shadow-md text-sm leading-relaxed ${
          isUser
            ? 'bg-[#FF6B9D] text-white rounded-br-sm'
            : 'bg-yellow-50 text-gray-800 rounded-bl-sm border border-yellow-100'
        }`}
      >
        {renderContent(message.content)}
      </div>
    </div>
  );
}
