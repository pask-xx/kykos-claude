'use client';

import { useState } from 'react';

interface QRCodeCardProps {
  type: 'deliver' | 'pickup';
  data: string;
  imageUrl: string;
  label: string;
  description: string;
  objectTitle: string;
}

export default function QRCodeCard({
  type,
  data,
  imageUrl,
  label,
  description,
  objectTitle,
}: QRCodeCardProps) {
  const [sharing, setSharing] = useState(false);

  const handleWebShare = async () => {
    if (!navigator.share) {
      alert('La condivisione non è supportata su questo dispositivo');
      return;
    }

    setSharing(true);
    try {
      const blob = await fetch(imageUrl).then(r => r.blob());
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

  const handleEmailShare = () => {
    const subject = encodeURIComponent(`KYKOS - QR Code ${label}`);
    const body = encodeURIComponent(
      `Ecco il QR code per la ${label.toLowerCase()} dell'oggetto "${objectTitle}".\n\n` +
      `QR Code: ${data}\n\n` +
      `Puoi visualizzare il QR code nella tua dashboard KYKOS.`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  const handleWhatsAppShare = () => {
    const message = `Ecco il QR code per la ${label.toLowerCase()} dell'oggetto "${objectTitle}".\n\nQR Code: ${data}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleDownload = () => {
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

        <div className="flex justify-center mb-4">
          <img src={imageUrl} alt={`QR Code per ${label}`} className="w-48 h-48" />
        </div>

        <p className="text-xs text-gray-400 text-center font-mono truncate mb-4">
          {data}
        </p>

        <div className="space-y-2">
          <button
            onClick={handleWebShare}
            disabled={sharing}
            className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 text-sm font-medium"
          >
            {sharing ? 'Condivisione...' : 'Condividi'}
          </button>

          <div className="flex gap-2">
            <button
              onClick={handleEmailShare}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
            >
              Email
            </button>
            <button
              onClick={handleWhatsAppShare}
              className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm"
            >
              WhatsApp
            </button>
            <button
              onClick={handleDownload}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
            >
              Download
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
