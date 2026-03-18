'use client';

import { useState, useRef, DragEvent, ChangeEvent } from 'react';

type Props = {
  onImageSelect: (file: File) => void;
  disabled?: boolean;
};

const SUPPORTED_FORMATS = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export default function ImageUpload({ onImageSelect, disabled }: Props) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!SUPPORTED_FORMATS.includes(file.type)) {
      return 'サポートされていないファイル形式です。JPEG、PNG、GIF、WebPのみ対応しています。';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'ファイルサイズが大きすぎます。5MB以下のファイルを選択してください。';
    }
    return null;
  };

  const handleFileSelect = (file: File) => {
    const error = validateFile(file);
    if (error) {
      alert(error);
      return;
    }
    onImageSelect(file);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    // Reset input value so same file can be selected again
    e.target.value = '';
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (disabled) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleButtonClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        accept={SUPPORTED_FORMATS.join(',')}
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />
      
      <button
        onClick={handleButtonClick}
        disabled={disabled}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          flex items-center justify-center w-10 h-10 rounded-full transition-all
          ${disabled 
            ? 'bg-gray-200 cursor-not-allowed opacity-50' 
            : isDragOver
              ? 'bg-pink-200 scale-105'
              : 'bg-pink-100 hover:bg-pink-200 active:scale-95'
          }
        `}
        title="画像を添付"
        aria-label="画像を添付"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" 
          fill="currentColor" 
          className={`w-5 h-5 ${disabled ? 'text-gray-400' : 'text-[#FF6B9D]'}`}
        >
          <path d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
        </svg>
      </button>
      
      {isDragOver && !disabled && (
        <div className="absolute inset-0 bg-pink-200/50 rounded-full flex items-center justify-center pointer-events-none">
          <span className="text-xs text-[#FF6B9D] font-medium">放す</span>
        </div>
      )}
    </div>
  );
}