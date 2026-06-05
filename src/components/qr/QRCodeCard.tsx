'use client';

import { useState } from 'react';
import { Download, Mail, MessageCircle, Printer, Share2 } from 'lucide-react';
import { Button, toast } from '@/components/ui';

interface QRCodeCardProps {
  type: 'deliver' | 'pickup';
  data: string;
  imageUrl: string;
  label: string;
  description: string;
  objectTitle: string;
  /** Callback opzionale per il bottone "Stampa". Se omessa, il bottone non viene mostrato. */
  onPrint?: () => void;
}

/**
 * QRCodeCard — card riusabile con QR + azioni di condivisione/download/stampa.
 * Usata dalle vecchie pagine QR donor/recipient (mantenuta per retrocompat).
 *
 * Le nuove pagine QR migrano al pattern uniforme `<QrPage>` (più ricco:
 * include anche orari ente, modale separata, gestione errori design system).
 * QrCodeCard resta qui per i punti di ingresso legacy fino a Fase 7.
 *
 * Esempio d'uso:
 *   <QRCodeCard
 *     type="deliver"
 *     data={qr.data}
 *     imageUrl={qr.imageUrl}
 *     label={qr.label}
 *     description={qr.description}
 *     objectTitle={objectTitle}
 *     onPrint={handlePrintA4}     // opzionale
 *   />
 */
export default function QRCodeCard({
  type,
  data,
  imageUrl,
  label,
  description,
  objectTitle,
  onPrint,
}: QRCodeCardProps) {
  const [sharing, setSharing] = useState(false);

  const handleWebShare = async () => {
    if (!navigator.share) {
      toast.warning('La condivisione non è supportata su questo dispositivo');
      return;
    }
    if (!imageUrl) {
      toast.warning('Immagine QR non disponibile');
      return;
    }

    setSharing(true);
    try {
      const response = await fetch(`/api/qr/image?data=${encodeURIComponent(data)}`);
      const { imageUrl: qrImageUrl } = await response.json();

      const blob = await fetch(qrImageUrl).then((r) => r.blob());
      const file = new File([blob], `kykos-${type}-${Date.now()}.png`, { type: 'image/png' });

      await navigator.share({
        title: `KYKOS - QR Code ${label}`,
        text: `Ecco il QR code per la ${label.toLowerCase()} dell'oggetto "${objectTitle}"`,
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

  const handleEmailShare = async () => {
    setSharing(true);
    try {
      const response = await fetch(`/api/qr/image?data=${encodeURIComponent(data)}`);
      const { imageUrl: qrImageUrl } = await response.json();

      const subject = encodeURIComponent(`KYKOS - QR Code ${label}`);
      const body = encodeURIComponent(
        `Ecco il QR code per la ${label.toLowerCase()} dell'oggetto "${objectTitle}".\n\n` +
        `QR Code: ${data}\n\n` +
        `Puoi visualizzare il QR code nella tua dashboard KYKOS.\n\n` +
        `Download QR: ${qrImageUrl}`
      );
      window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
    } catch (err) {
      console.error('Email share error:', err);
    } finally {
      setSharing(false);
    }
  };

  const handleWhatsAppShare = async () => {
    setSharing(true);
    try {
      const response = await fetch(`/api/qr/image?data=${encodeURIComponent(data)}`);
      const { imageUrl: qrImageUrl } = await response.json();

      const message =
        `Ecco il QR code per la ${label.toLowerCase()} dell'oggetto "${objectTitle}".\n\n` +
        `QR Code: ${data}\n\n` +
        `Download QR: ${qrImageUrl}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    } catch (err) {
      console.error('WhatsApp share error:', err);
    } finally {
      setSharing(false);
    }
  };

  const handleDownload = () => {
    if (!imageUrl) {
      toast.warning('Immagine QR non disponibile');
      return;
    }
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `kykos-${type}-${Date.now()}.png`;
    link.click();
  };

  const borderColor = type === 'deliver' ? 'border-blue-500' : 'border-purple-500';
  const headerBg = type === 'deliver' ? 'bg-blue-500' : 'bg-purple-500';

  return (
    <div className={`bg-white rounded-xl shadow-sm border-2 ${borderColor} overflow-hidden`}>
      <div className={`${headerBg} text-white text-center py-2 px-4`}>
        <p className="font-medium">{label}</p>
      </div>

      <div className="p-4">
        <p className="text-sm text-gray-600 mb-3">{description}</p>

        <div className="flex justify-center mb-4 relative">
          <img src={imageUrl} alt={`QR Code per ${label}`} className="w-48 h-48" />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-white rounded-full p-2 shadow-md">
              <img src="/albero.svg" alt="KYKOS" className="w-10 h-10" />
            </div>
          </div>
        </div>

        <p className="text-xs text-gray-400 text-center font-mono truncate mb-4">
          {data}
        </p>

        <div className="space-y-2">
          <Button
            type="button"
            variant="primary"
            size="md"
            leftIcon={<Share2 className="h-4 w-4" />}
            loading={sharing}
            onClick={handleWebShare}
            className="w-full"
          >
            {sharing ? 'Condivisione...' : 'Condividi'}
          </Button>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              leftIcon={<Mail className="h-4 w-4" />}
              onClick={handleEmailShare}
              disabled={sharing}
              className="flex-1"
            >
              Email
            </Button>
            <Button
              type="button"
              variant="success"
              leftIcon={<MessageCircle className="h-4 w-4" />}
              onClick={handleWhatsAppShare}
              disabled={sharing}
              className="flex-1"
            >
              WhatsApp
            </Button>
            <Button
              type="button"
              variant="secondary"
              leftIcon={<Download className="h-4 w-4" />}
              onClick={handleDownload}
              className="flex-1"
            >
              Download
            </Button>
          </div>

          {onPrint && (
            <Button
              type="button"
              variant="primary"
              leftIcon={<Printer className="h-4 w-4" />}
              onClick={onPrint}
              className="w-full"
            >
              Stampa QR
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
