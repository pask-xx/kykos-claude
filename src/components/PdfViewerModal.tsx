'use client';

import { useEffect, useRef } from 'react';

interface PdfViewerModalProps {
  url: string;
  title: string;
  onClose: () => void;
}

/**
 * Modal in-page per visualizzare un PDF (Privacy, ToS, ecc.).
 *
 * Perché esiste: su mobile alcuni browser (iOS Safari senza Adobe, Samsung
 * Internet, ...) aprono i PDF con `target="_blank"` in modo scomodo — o
 * scaricano il file, o aprono un viewer fullscreen senza un chiaro tasto
 * "indietro alla pagina di registrazione". Questo modal mostra il PDF in
 * un `<iframe>` dentro la pagina stessa, con un bottone "Chiudi" sempre
 * visibile. Niente cambio di contesto, niente dipendenza dal viewer
 * nativo del browser.
 *
 * Accessibilità:
 * - Click sull'overlay chiude il modal (standard pattern).
 * - Tasto ESC chiude il modal.
 * - Lock dello scroll body mentre il modal è aperto.
 * - `<iframe>` ha `title` per screen reader.
 *
 * Su browser che non supportano PDF dentro iframe (rari: vecchi Android
 * stock), l'iframe mostrerà un errore. In tal caso l'utente può usare
 * "Scarica" o "Apri in nuova tab" come fallback.
 */
export default function PdfViewerModal({ url, title, onClose }: PdfViewerModalProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Lock scroll body
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Auto-focus sul bottone chiudi (accessibilità tastiera)
    closeRef.current?.focus();

    // ESC per chiudere
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);

    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-label="Chiudi"
      />

      {/* Modal Content */}
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col m-2 sm:m-4"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 truncate pr-2">
            {title}
          </h2>
          <button
            ref={closeRef}
            onClick={onClose}
            className="shrink-0 w-10 h-10 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition text-xl"
            aria-label="Chiudi"
          >
            ✕
          </button>
        </div>

        {/* PDF viewer */}
        <div className="flex-1 bg-gray-100 min-h-[60vh]">
          <iframe
            src={url}
            title={title}
            className="w-full h-full"
            style={{ minHeight: '60vh', border: 0 }}
          />
        </div>

        {/* Footer con azioni */}
        <div className="flex flex-col sm:flex-row gap-2 p-3 border-t bg-gray-50">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 px-4 py-2.5 text-center text-sm font-medium text-secondary-700 bg-secondary-50 border border-secondary-200 rounded-lg hover:bg-secondary-100 transition"
          >
            Apri in nuova tab
          </a>
          <a
            href={url}
            download
            className="flex-1 px-4 py-2.5 text-center text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition"
          >
            Scarica PDF
          </a>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-secondary-600 rounded-lg hover:bg-secondary-700 transition"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
}
