'use client';

import { useState, useRef } from 'react';

interface ImageUploaderProps {
  onImagesChange: (urls: string[]) => void;
  maxFiles?: number;
  currentImages?: string[];
}

export default function ImageUploader({ onImagesChange, maxFiles = 5, currentImages = [] }: ImageUploaderProps) {
  const [images, setImages] = useState<string[]>(currentImages);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const remainingSlots = maxFiles - images.length;
    if (remainingSlots <= 0) {
      setError(`Massimo ${maxFiles} immagini`);
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    setError(null);
    setUploading(true);

    const newUrls: string[] = [];

    for (const file of filesToUpload) {
      try {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Upload fallito');
        }

        const data = await res.json();
        newUrls.push(data.url);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Errore upload');
      }
    }

    setUploading(false);

    if (newUrls.length > 0) {
      const updated = [...images, ...newUrls];
      setImages(updated);
      onImagesChange(updated);
    }
  };

  const removeImage = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    setImages(updated);
    onImagesChange(updated);
  };

  return (
    <div className="space-y-3">
      {/* Preview grid */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((url, index) => (
            <div key={url} className="relative w-20 h-20">
              <img
                src={url}
                alt={`Immagine ${index + 1}`}
                className="w-20 h-20 object-cover rounded-lg border border-gray-200"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs font-bold flex items-center justify-center hover:bg-red-600"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload area */}
      {images.length < maxFiles && (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFileSelect(e.dataTransfer.files);
          }}
          className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-primary-400 hover:bg-gray-50 transition-colors"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files)}
          />
          {uploading ? (
            <div className="flex items-center justify-center gap-2 text-gray-500">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
              <span className="text-sm">Caricamento...</span>
            </div>
          ) : (
            <div>
              <p className="text-gray-500 text-sm">
                📷 Aggiungi foto (max {maxFiles})
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Trascina qui o clicca per selezionare
              </p>
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="text-red-500 text-xs">{error}</p>
      )}
    </div>
  );
}
