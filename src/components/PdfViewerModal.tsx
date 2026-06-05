'use client';

import { ReactNode } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

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
 * Filename del download: NON specifichiamo noi un nome. Il file nel bucket
 * Supabase è già nominato correttamente all'origine
 * (es. `documents/kykos-privacy-v1.1.pdf`) — il browser userà quel nome
 * automaticamente quando l'utente clicca "Scarica PDF". Vedi
 * `getStoragePath()` in `src/lib/legal.ts` per la convenzione.
 *
 * Accessibilità (Fase 8.1, delegate al primitive Modal):
 * - Click sull'overlay chiude il modal (standard pattern).
 * - Tasto ESC chiude il modal.
 * - Lock dello scroll body mentre il modal è aperto (counter di modali aperti).
 * - Focus restoration al trigger dopo chiusura.
 * - Auto-focus sul bottone chiudi via [data-autofocus] del primitive.
 * - role="dialog" + aria-modal="true" + aria-label="title" automatici.
 *
 * Su browser che non supportano PDF dentro iframe (rari: vecchi Android
 * stock), l'iframe mostrerà un errore. In tal caso l'utente può usare
 * "Scarica" o "Apri in nuova tab" come fallback.
 */
export default function PdfViewerModal({ url, title, onClose }: PdfViewerModalProps) {
  // Footer: 3 azioni (Apri in nuova tab / Scarica / Chiudi).
  // `download` (senza valore) dice al browser di scaricare invece di
  // navigare. Il filename viene dal Content-Disposition del bucket Supabase.
  const footerContent: ReactNode = (
    <div className="flex flex-col sm:flex-row gap-2 p-3 bg-gray-50">
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
      <Button
        type="button"
        onClick={onClose}
        className="flex-1 bg-secondary-600 hover:bg-secondary-700 text-white font-semibold"
      >
        Chiudi
      </Button>
    </div>
  );

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={title}
      zIndex={100}
      size="full"
      overlayClassName="bg-black/60"
      contentClassName="rounded-2xl shadow-2xl max-h-[95vh] m-2 sm:m-4"
      ariaLabel={title}
      footer={footerContent}
    >
      {/* PDF viewer: riempie lo spazio verticale tra header e footer */}
      <div className="flex-1 bg-gray-100 min-h-[60vh]">
        <iframe
          src={url}
          title={title}
          className="w-full h-full"
          style={{ minHeight: '60vh', border: 0 }}
        />
      </div>
    </Modal>
  );
}
