'use client';

import { useState } from 'react';
import { toast } from '@/components/ui/Toast';
import { openPrintWindow, type PrintSize } from './print-window';

export interface UseQrActionsInput {
  /** Stringa raw del QR (es. "kykos:object:pickup:...") */
  qrData: string;
  /** URL immagine PNG del QR (già su Supabase o data URL) */
  qrImageUrl?: string;
  /** Titolo da usare nei dialog/oggetti di share (es. "QR Code per la donazione") */
  title: string;
  /** Sottotitolo/contesto (es. titolo oggetto / richiesta) */
  subtitle?: string;
  /** ID request (per filename download / print) */
  requestId: string;
  /** Tipo QR per naming/print (es. "deliver", "pickup", "object", "goods") */
  type?: string;
  /** Size del foglio per stampa. Default: 'A4'. */
  printSize?: PrintSize;
}

export interface UseQrActionsResult {
  sharing: boolean;
  handleWebShare: () => Promise<void>;
  handleEmailShare: () => void;
  handleWhatsAppShare: () => void;
  handleDownload: () => void;
  handlePrint: () => void;
}

/**
 * useQrActions — hook che incapsula le 5 azioni standard per un QR code:
 *  1. Web Share (navigator.share con File immagine PNG)
 *  2. Email (mailto: con subject + body + link immagine)
 *  3. WhatsApp (wa.me con messaggio precompilato)
 *  4. Download (programmatic <a download>)
 *  5. Stampa (window.open con documento A4/etichetta)
 *
 * Coerente con il pattern di `src/app/operator/street-to-deliver/page.tsx:69-194`
 * e con `src/components/qr/QRCodeCard.tsx:24-93`. Centralizzato qui per evitare
 * duplicazione tra <QrPage> e <QrDialog>.
 *
 * Comportamento errori:
 *  - navigator.share non supportato → `toast.warning` (mai `alert`, anti-pattern §9.2)
 *  - share abortito dall'utente (AbortError) → silenzioso
 *  - errori generici → loggati in console (no toast.error per non essere invasivi
 *    durante un'azione utente volontaria)
 */
export function useQrActions({
  qrData,
  qrImageUrl,
  title,
  subtitle,
  requestId,
  type = 'qr',
  printSize = 'A4',
}: UseQrActionsInput): UseQrActionsResult {
  const [sharing, setSharing] = useState(false);

  const handleWebShare = async () => {
    if (!navigator.share) {
      toast.warning('La condivisione non è supportata su questo dispositivo');
      return;
    }
    if (!qrImageUrl) {
      toast.warning('Immagine QR non disponibile');
      return;
    }

    setSharing(true);
    try {
      const blob = await fetch(qrImageUrl).then((r) => r.blob());
      const file = new File([blob], `kykos-${type}-${requestId.slice(0, 8)}.png`, {
        type: 'image/png',
      });

      await navigator.share({
        title,
        text: subtitle
          ? `${title}: "${subtitle}"`
          : title,
        files: [file],
      });
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Share error:', err);
      }
    } finally {
      setSharing(false);
    }
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent(`KYKOS - ${title}`);
    const body = encodeURIComponent(
      (subtitle ? `${title}: "${subtitle}"\n\n` : '') +
        `QR Code: ${qrData}\n\n` +
        (qrImageUrl ? `Download QR: ${qrImageUrl}\n\n` : '') +
        'Visualizza il QR code nella tua dashboard KYKOS.'
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  const handleWhatsAppShare = () => {
    const message =
      (subtitle ? `${title}: "${subtitle}"\n\n` : '') +
      `QR Code: ${qrData}\n\n` +
      (qrImageUrl ? `Download QR: ${qrImageUrl}` : '');
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleDownload = () => {
    if (!qrImageUrl) {
      toast.warning('Immagine QR non disponibile');
      return;
    }
    const link = document.createElement('a');
    link.href = qrImageUrl;
    link.download = `kykos-${type}-${requestId.slice(0, 8)}.png`;
    link.click();
  };

  const handlePrint = () => {
    if (!qrImageUrl) {
      toast.warning('Immagine QR non disponibile');
      return;
    }
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const bodyHtml = `
      <div class="header">
        <div class="logo-row">
          <img src="${origin}/albero.svg" alt="KYKOS" />
          <img src="${origin}/LogoKykosTesto.svg" alt="Kykos" />
        </div>
      </div>
      <div class="title">${escapeHtml(title)}</div>
      ${subtitle ? `<div class="subtitle">${escapeHtml(subtitle)}</div>` : ''}
      <div class="qr-container">
        <img src="${qrImageUrl}" alt="QR Code" />
      </div>
      <div class="footer">KYKOS - ${escapeHtml(title)}</div>
    `;
    openPrintWindow({ size: printSize, title, bodyHtml });
  };

  return {
    sharing,
    handleWebShare,
    handleEmailShare,
    handleWhatsAppShare,
    handleDownload,
    handlePrint,
  };
}

/**
 * Escape minimale per inserire stringhe in HTML di stampa.
 * Anche se in genere sono dati trusted, è buona prassi contro XSS accidentale.
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
