'use client';

import { useState } from 'react';

interface ImageGalleryProps {
  images: string[];
  alt?: string;
  className?: string;
  thumbnailClassName?: string;
}

export default function ImageGallery({
  images,
  alt = 'Immagine',
  className = '',
  thumbnailClassName = 'w-12 h-12',
}: ImageGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (images.length === 0) return null;

  return (
    <>
      <div className={`flex flex-wrap gap-1 ${className}`}>
        {images.map((url, i) => (
          <button
            key={i}
            onClick={() => setLightboxIndex(i)}
            className={`object-cover rounded border border-gray-200 hover:border-primary-400 transition-colors cursor-pointer ${thumbnailClassName}`}
          >
            <img src={url} alt={`${alt} ${i + 1}`} className="w-full h-full object-cover rounded" />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setLightboxIndex(null)}
        >
          {/* Close */}
          <button
            onClick={() => setLightboxIndex(null)}
            className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center text-white text-2xl font-bold"
          >
            ✕
          </button>

          {/* Prev */}
          {lightboxIndex > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex(lightboxIndex - 1);
              }}
              className="absolute left-4 w-12 h-12 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center text-white text-2xl font-bold"
            >
              ←
            </button>
          )}

          {/* Image */}
          <img
            src={images[lightboxIndex]}
            alt={`${alt} ${lightboxIndex + 1}`}
            className="max-w-[90vw] max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Counter */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-full text-sm">
            {lightboxIndex + 1} / {images.length}
          </div>

          {/* Next */}
          {lightboxIndex < images.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex(lightboxIndex + 1);
              }}
              className="absolute right-4 w-12 h-12 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center text-white text-2xl font-bold"
            >
              →
            </button>
          )}
        </div>
      )}
    </>
  );
}