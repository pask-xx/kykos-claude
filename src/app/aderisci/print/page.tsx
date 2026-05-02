'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

export default function AderisciPrintPage() {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    const APP_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://kykos.it';
    QRCode.toDataURL(`${APP_URL}/aderisci`, {
      width: 280,
      margin: 2,
      color: {
        dark: '#059669',
        light: '#ffffff',
      },
    }).then(setQrDataUrl);

    setTimeout(() => {
      window.print();
    }, 500);
  }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      {/* Main content container with subtle border */}
      <div className="max-w-2xl mx-auto text-center rounded-2xl border-2 border-primary-200 p-6 shadow-sm">

        <img src="/albero.svg" alt="KYKOS" className="w-20 h-20 mx-auto mb-4" />
        <h1 className="text-5xl font-bold text-primary-600 mb-3">KYKOS</h1>
        <p className="text-xl text-gray-500 mb-6">Dona con amore, ricevi con dignità</p>
        <p className="text-gray-600 leading-relaxed mb-6 text-lg">
          La rete di solidarietà che mette in contatto chi vuole donare oggetti
          con chi ne ha bisogno. <strong>Completamente anonima</strong>:
          chi dona non sa chi riceve, e chi riceve non sa chi dona.
        </p>

        {/* Three icon cards - horizontal */}
        <div className="flex justify-center gap-8 mb-6 print-cards">
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center mb-2">
              <span className="text-2xl">🔒</span>
            </div>
            <h3 className="font-semibold text-gray-900 text-sm">Anonimato Totale</h3>
            <p className="text-xs text-gray-500">Nessuno sa chi è l&apos;altro</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center mb-2">
              <span className="text-2xl">🏢</span>
            </div>
            <h3 className="font-semibold text-gray-900 text-sm">Enti Fidati</h3>
            <p className="text-xs text-gray-500">Caritas, parrocchie, associazioni</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center mb-2">
              <span className="text-2xl">🌱</span>
            </div>
            <h3 className="font-semibold text-gray-900 text-sm">Sostenibilità</h3>
            <p className="text-xs text-gray-500">Dai nuova vita alle cose</p>
          </div>
        </div>

        {/* Call to action */}
        <div className="mb-4">
          <p className="text-gray-600 text-base">
            Se vuoi <strong>donare</strong>, registrati come donatore e inizia a donare i tuoi oggetti.<br />
            Se hai <strong>bisogno di aiuto</strong>, registrati come beneficiario, il tuo ente di riferimento ti autorizzerà.
          </p>
        </div>

        {/* QR Code - large and centered */}
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="w-64 h-64 bg-white rounded-xl shadow-lg border-4 border-gray-200 flex items-center justify-center p-3">
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrDataUrl}
                  alt="QR Code KYKOS"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-gray-400">Caricamento...</div>
              )}
            </div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-white rounded-full p-2 shadow-md">
                <img src="/albero.svg" alt="KYKOS" className="w-10 h-10" />
              </div>
            </div>
          </div>
          <p className="mt-3 text-base font-medium text-gray-700">
            Scansiona il QR Code
          </p>
          <p className="text-gray-500">
            oppure visita <span className="font-mono text-primary-600 font-bold">kykos.it/aderisci</span>
          </p>
        </div>

      </div>

      <style>{`
        @page {
          size: A4;
          margin: 3mm;
        }
        @media print {
          body { margin: 0; padding: 0; }
          .no-print { display: none !important; }
          .print-cards { flex-direction: row !important; }
        }
      `}</style>
    </div>
  );
}
