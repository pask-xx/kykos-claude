'use client';

import { useState, useRef } from 'react';

interface ProfilePhotoUploaderProps {
  currentUrl?: string | null;
  onUploadComplete?: (url: string) => void;
  disabled?: boolean;
}

export default function ProfilePhotoUploader({
  currentUrl,
  onUploadComplete,
  disabled = false,
}: ProfilePhotoUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    setError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/profile-photo', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Upload fallito');
      }

      const data = await res.json();
      onUploadComplete?.(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore upload');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      {/* Current photo */}
      <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
        {currentUrl ? (
          <img
            src={currentUrl}
            alt="Foto profilo"
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-3xl">👤</span>
        )}
      </div>

      {/* Upload button */}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
          disabled={disabled || uploading}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading}
          className="px-3 py-1.5 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 font-medium text-sm disabled:opacity-50"
        >
          {uploading ? 'Caricamento...' : 'Cambia foto'}
        </button>
        <p className="text-xs text-gray-400 mt-1">max 2MB, JPG/PNG/WebP</p>
      </div>

      {error && <p className="text-red-500 text-xs">{error}</p>}
    </div>
  );
}