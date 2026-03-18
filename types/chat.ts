export type Role = 'user' | 'assistant';

export type ImageContent = {
  type: 'image';
  mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
  data: string; // base64
};

export type Message = {
  id: string;
  role: Role;
  content: string;
  images?: ImageContent[];
};
