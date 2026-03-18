export type Role = 'user' | 'assistant';

export type TextContent = {
  type: 'text';
  text: string;
};

export type ImageContent = {
  type: 'image';
  mediaType: string;
  data: string; // Base64 encoded
};

export type MessageContent = TextContent | ImageContent | (TextContent | ImageContent)[];

export type Message = {
  id: string;
  role: Role;
  content: MessageContent;
};

// Legacy type for backward compatibility during transition
export type LegacyMessage = {
  id: string;
  role: Role;
  content: string;
};
