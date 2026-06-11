'use client';

import { X } from 'lucide-react';

export interface DonorImageLightboxProps {
  image: { url: string; title: string; index: number } | null;
  onClose: () => void;
}

/**
 * Lightbox inline per gallery oggetti donor.
 *
 * Pattern riusato da /recipient/objects/page.tsx:310-334. Inline (NON
 * estratto in src/components/ui/) perche' attualmente ha 1 call site
 * donor. Quando arrivera' un terzo call site totale (recipient +
 * donor), promuovere a src/components/ui/ImageLightbox.tsx.
 *
 * Accessibilita' (regola 01-core-principles):
 * - Bottone "Chiudi galleria" con `aria-label` esplicito.
 * - `X` icon `aria-hidden="true"` (decorazione).
 * - Click sull'overlay chiude; click sull'immagine no (stopPropagation).
 */
export function DonorImageLightbox({ image, onClose }: DonorImageLightboxProps) {
  if (!image) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      onClick={onClose}
    >
      <button
        type="button"
        aria-label="Chiudi galleria"
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center text-white hover:bg-white/20 rounded-full transition"
      >
        <X className="w-5 h-5" aria-hidden="true" />
      </button>
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white text-sm">
        {image.index + 1}
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image.url}
        alt={image.title}
        className="max-w-[90vw] max-h-[85vh] object-contain"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}
