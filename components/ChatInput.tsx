'use client';

import { useState, useRef, KeyboardEvent, DragEvent, ChangeEvent } from 'react';
import { ImageContent } from '@/types/chat';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const;
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

type Props = {
  onSubmit: (message: string, images: ImageContent[]) => void;
  isLoading: boolean;
};

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // data:image/jpeg;base64,XXXX → XXXXだけ取り出す
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function isAcceptedType(type: string): type is ImageContent['mediaType'] {
  return (ACCEPTED_TYPES as readonly string[]).includes(type);
}

export default function ChatInput({ onSubmit, isLoading }: Props) {
  const [value, setValue] = useState('');
  const [images, setImages] = useState<ImageContent[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const newImages: ImageContent[] = [];

    for (const file of fileArray) {
      if (!isAcceptedType(file.type)) {
        alert(`${file.name} は対応していないファイル形式です（JPEG / PNG / GIF / WebP のみ）`);
        continue;
      }
      if (file.size > MAX_SIZE_BYTES) {
        alert(`${file.name} は5MBを超えています`);
        continue;
      }
      const data = await fileToBase64(file);
      newImages.push({ type: 'image', mediaType: file.type, data });
    }

    setImages((prev) => [...prev, ...newImages]);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(e.target.files);
    e.target.value = '';
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    const trimmed = value.trim();
    if ((!trimmed && images.length === 0) || isLoading) return;
    onSubmit(trimmed, images);
    setValue('');
    setImages([]);
  };

  return (
    <div
      className={`flex flex-col gap-2 p-4 bg-white border-t border-pink-100 transition-colors ${isDragging ? 'bg-pink-50' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((img, i) => (
            <div key={i} className="relative">
              <img
                src={`data:${img.mediaType};base64,${img.data}`}
                alt={`添付画像 ${i + 1}`}
                className="w-16 h-16 object-cover rounded-xl border-2 border-pink-200"
              />
              <button
                onClick={() => removeImage(i)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-gray-700"
                aria-label="画像を削除"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          className="flex-shrink-0 w-10 h-10 rounded-full border-2 border-pink-200 text-pink-400 flex items-center justify-center hover:bg-pink-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="画像を添付"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          multiple
          className="hidden"
          onChange={handleFileChange}
        />

        <textarea
          className={`flex-1 resize-none rounded-2xl border-2 px-4 py-3 text-sm outline-none transition-colors min-h-[48px] max-h-32 ${isDragging ? 'border-[#FF6B9D] bg-pink-50' : 'border-pink-200 focus:border-[#FF6B9D]'}`}
          placeholder={isDragging ? '画像をドロップ...' : 'メッセージを入力...（画像はドラッグ&ドロップでも添付可）'}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          rows={1}
        />

        <button
          onClick={handleSubmit}
          disabled={isLoading || (!value.trim() && images.length === 0)}
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
