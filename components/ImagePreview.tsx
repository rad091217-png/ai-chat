'use client';

type Props = {
  imageUrl: string;
  onRemove: () => void;
  className?: string;
};

export default function ImagePreview({ imageUrl, onRemove, className = '' }: Props) {
  return (
    <div className={`relative inline-block ${className}`}>
      <img
        src={imageUrl}
        alt="添付画像プレビュー"
        className="max-w-[200px] max-h-[150px] rounded-lg border-2 border-pink-200 shadow-sm object-cover"
      />
      <button
        onClick={onRemove}
        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm hover:bg-red-600 transition-colors shadow-md"
        aria-label="画像を削除"
        title="画像を削除"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
          <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
        </svg>
      </button>
    </div>
  );
}