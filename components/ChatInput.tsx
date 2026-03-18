'use client';

import { useState, KeyboardEvent } from 'react';
import { MessageContent, TextContent, ImageContent } from '@/types/chat';
import ImageUpload from './ImageUpload';
import ImagePreview from './ImagePreview';

type Props = {
  onSubmit: (message: MessageContent) => void;
  isLoading: boolean;
};

export default function ChatInput({ onSubmit, isLoading }: Props) {
  const [value, setValue] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix to get just base64
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = () => reject(new Error('ファイルの読み取りに失敗しました'));
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async () => {
    const trimmedText = value.trim();
    if ((!trimmedText && !selectedImage) || isLoading) return;

    try {
      let messageContent: MessageContent;

      if (selectedImage) {
        const base64Data = await convertFileToBase64(selectedImage);
        const imageContent: ImageContent = {
          type: 'image',
          mediaType: selectedImage.type,
          data: base64Data
        };

        if (trimmedText) {
          // Both text and image
          const textContent: TextContent = { type: 'text', text: trimmedText };
          messageContent = [textContent, imageContent];
        } else {
          // Image only
          messageContent = imageContent;
        }
      } else {
        // Text only
        messageContent = { type: 'text', text: trimmedText };
      }

      onSubmit(messageContent);
      setValue('');
      handleRemoveImage();
    } catch (error) {
      console.error('メッセージ送信エラー:', error);
      alert('メッセージの送信に失敗しました。');
    }
  };

  const handleImageSelect = (file: File) => {
    setSelectedImage(file);
    const url = URL.createObjectURL(file);
    setImagePreviewUrl(url);
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl(null);
    }
  };

  return (
    <div className="bg-white border-t border-pink-100">
      {imagePreviewUrl && (
        <div className="px-4 pt-3">
          <ImagePreview 
            imageUrl={imagePreviewUrl} 
            onRemove={handleRemoveImage} 
          />
        </div>
      )}
      <div className="flex items-end gap-2 p-4">
        <ImageUpload 
          onImageSelect={handleImageSelect} 
          disabled={isLoading}
        />
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
          disabled={isLoading || (!value.trim() && !selectedImage)}
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
    </div>
  );
}
