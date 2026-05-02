'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

export default function AderisciPrintPage() {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    const APP_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://kykos.it';
    QRCode.toDataURL(`${APP_URL}/aderisci`, {
      width: 240,
      margin: 2,
      color: {
        dark: '#059669',
        light: '#ffffff',
      },
    }).then(setQrDataUrl);

    // Auto-trigger print dialog
    setTimeout(() => {
      window.print();
    }, 500);
  }, []);

  return (
    <div className="min-h-screen bg-white p-8">
      {/* Header */}
      <div className="flex items-center justify-center mb-8">
        <img src="/albero.svg" alt="KYKOS" className="w-16 h-16 mr-4" />
        <div>
          <h1 className="text-4xl font-bold text-primary-600">KYKOS</h1>
          <p className="text-lg text-gray-500">Dona con amore, ricevi con dignità</p>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t-2 border-primary-200 my-8"></div>

      {/* Project Summary */}
      <div className="max-w-2xl mx-auto mb-12 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Cos'è KYKOS?
        </h2>
        <p className="text-gray-600 leading-relaxed mb-6">
          KYKOS è la rete di solidarietà che mette in contatto chi vuole donare oggetti
          con chi ne ha bisogno. La donazione è <strong>completamente anonima</strong>:
          chi dona non sa chi riceve, e chi riceve non sa chi dona. La dignità di
          ogni persona è preservata attraverso questo principio fondamentale.
        </p>
        <div className="grid md:grid-cols-3 gap-6 text-center">
          <div className="p-4 bg-primary-50 rounded-xl">
            <div className="text-3xl mb-2">🔒</div>
            <h3 className="font-semibold text-gray-900 mb-1">Anonimato Totale</h3>
            <p className="text-sm text-gray-500">Nessuno sa chi è l'altro</p>
          </div>
          <div className="p-4 bg-primary-50 rounded-xl">
            <div className="text-3xl mb-2">🏢</div>
            <h3 className="font-semibold text-gray-900 mb-1">Enti Fidati</h3>
            <p className="text-sm text-gray-500">Caritas, parrocchie, associazioni</p>
          </div>
          <div className="p-4 bg-primary-50 rounded-xl">
            <div className="text-3xl mb-2">🌱</div>
            <h3 className="font-semibold text-gray-900 mb-1">Sostenibilità</h3>
            <p className="text-sm text-gray-500">Dai nuova vita alle cose</p>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t-2 border-primary-200 my-8"></div>

      {/* Call to action */}
      <div className="max-w-2xl mx-auto text-center mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Unisciti anche tu!
        </h2>
        <p className="text-gray-600 mb-4">
          Se vuoi <strong>donare</strong>, registrati come donatore e inizia a donare i tuoi oggetti.<br />
          Se hai <strong>bisogno di aiuto</strong>, il tuo ente di riferimento ti fornirà le credenziali.
        </p>
      </div>

      {/* QR Code */}
      <div className="flex flex-col items-center mb-8">
        <div className="relative">
          {/* White square with border */}
          <div className="w-64 h-64 bg-white rounded-xl shadow-lg border-4 border-gray-200 flex items-center justify-center p-4">
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
          {/* KYKOS logo overlay in center */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-white rounded-full p-2 shadow-md">
              <img src="/albero.svg" alt="KYKOS" className="w-12 h-12" />
            </div>
          </div>
        </div>
        <p className="mt-4 text-lg font-medium text-gray-700">
          Scansiona il QR Code
        </p>
        <p className="text-gray-500">
          oppure visita <span className="font-mono text-primary-600 font-bold">kykos.it/aderisci</span>
        </p>
      </div>

      {/* Footer */}
      <div className="text-center text-gray-400 text-sm border-t pt-4">
        <p>© {new Date().getFullYear()} KYKOS. Dona con amore, ricevi con dignità.</p>
      </div>

      {/* Print-only: instruction to save as PDF */}
      <div className="hidden print:block absolute bottom-4 right-4 text-xs text-gray-400">
        Per salvare come PDF: File → Stampa → Salva come PDF
      </div>

      <style>{`
        @media print {
          body { margin: 0; padding: 20px; }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
}