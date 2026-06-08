'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { Package, Printer, Inbox } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { CATEGORY_LABELS, CONDITION_LABELS, OBJECT_STATUS_LABELS } from '@/types';
import QRCode from 'qrcode';

const LOGO_ALBERO_BASE64 = '/alberoBase64.txt';
const LOGO_TEXT_BASE64 = '/logoKykosTestoBase64.txt';

interface ObjectDetail {
  id: string;
  title: string;
  description: string | null;
  category: string;
  condition: string;
  status: string;
  imageUrls: string[];
  createdAt: string;
  updatedAt: string;
  depositLocation: string | null;
  donor: { id: string; nickname: string | null; name: string };
  recipient: { id: string; nickname: string | null; name: string };
  intermediary: { id: string; name: string };
}

export default function ObjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [object, setObject] = useState<ObjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [backUrl, setBackUrl] = useState('/operator/deposit');
  const [logoAlberoPng, setLogoAlberoPng] = useState<string | null>(null);
  const [logoTextPng, setLogoTextPng] = useState<string | null>(null);

  // Determine back URL based on sessionStorage (set by list pages before navigation)
  useEffect(() => {
    const storedBack = sessionStorage.getItem('operatorListBackUrl');
    if (storedBack && storedBack.startsWith('/operator/')) {
      setBackUrl(storedBack);
    } else {
      setBackUrl('/operator/deposit');
    }
    // Clear the stored URL after reading it
    sessionStorage.removeItem('operatorListBackUrl');
  }, []);

  // Load logos
  useEffect(() => {
    async function preloadLogos() {
      try {
        const [alberoRes, textRes] = await Promise.all([
          fetch(LOGO_ALBERO_BASE64),
          fetch(LOGO_TEXT_BASE64),
        ]);
        const [alberoBase64, textBase64] = await Promise.all([
          alberoRes.text(),
          textRes.text(),
        ]);
        const alberoDataUri = alberoBase64.startsWith('data:') ? alberoBase64 : `data:image/png;base64,${alberoBase64}`;
        const textDataUri = textBase64.startsWith('data:') ? textBase64 : `data:image/png;base64,${textBase64}`;
        setLogoAlberoPng(alberoDataUri);
        setLogoTextPng(textDataUri);
      } catch (err) {
        console.error('Error preloading logos:', err);
      }
    }
    preloadLogos();
  }, []);

  useEffect(() => {
    fetchObject();
  }, [id]);

  const fetchObject = async () => {
    try {
      const res = await fetch(`/api/operator/objects/${id}`);
      if (res.ok) {
        const data = await res.json();
        setObject(data.object);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colorClass =
      status === 'AVAILABLE' ? 'bg-success-100 text-success-700' :
      status === 'RESERVED' ? 'bg-warning-100 text-warning-700' :
      status === 'DEPOSITED' ? 'bg-gray-100 text-gray-700' :
      status === 'DONATED' ? 'bg-info-100 text-info-700' :
      status === 'CANCELLED' ? 'bg-error-100 text-error-700' :
      status === 'BLOCKED' ? 'bg-secondary-100 text-secondary-700' :
      'bg-gray-100 text-gray-700';
    const label = OBJECT_STATUS_LABELS[status as keyof typeof OBJECT_STATUS_LABELS] ?? status;
    return <span className={`px-3 py-1 text-sm rounded-full ${colorClass}`}>{label}</span>;
  };

  const handlePrintLabel = async () => {
    if (!object || !logoAlberoPng || !logoTextPng) return;

    const qrData = `kykos:object:${object.id}`;
    const qrImage = await QRCode.toDataURL(qrData, {
      width: 100,
      margin: 0,
      color: { dark: '#000000', light: '#ffffff' },
    });

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Etichetta - ${object.title}</title>
        <style>
          @page { size: 50mm 30mm; margin: 0; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { width: 50mm; height: 30mm; font-family: Arial, sans-serif; overflow: hidden; }
          .label { width: 50mm; height: 30mm; display: flex; flex-direction: column; padding: 2mm; }
          .top { display: flex; align-items: center; gap: 2mm; flex: 1; }
          .qr-box { width: 20mm; height: 20mm; flex-shrink: 0; border: 0.5mm solid #000; display: flex; align-items: center; justify-content: center; }
          .qr-box img { width: 18mm; height: 18mm; }
          .info { flex: 1; overflow: hidden; }
          .title { font-size: 4mm; font-weight: bold; line-height: 1.1; margin-bottom: 1mm; }
          .meta { font-size: 2.5mm; color: #555; }
          .badges { display: flex; gap: 1mm; margin-top: 1mm; }
          .badge { width: 7mm; height: 7mm; border-radius: 50%; border: 0.5mm solid #000; display: flex; align-items: center; justify-content: center; font-size: 3mm; font-weight: bold; }
          .bottom { display: flex; justify-content: center; gap: 3mm; padding-top: 1mm; }
          .bottom img { height: 8mm; }
        </style>
      </head>
      <body>
        <div class="label">
          <div class="top">
            <div class="qr-box">
              <img src="${qrImage}" alt="QR" />
            </div>
            <div class="info">
              <div class="title">${object.title.substring(0, 30)}</div>
              <div class="meta">${object.intermediary.name}</div>
              <div class="badges">
                <div class="badge">S</div>
                <div class="badge">P</div>
              </div>
            </div>
          </div>
          <div class="bottom">
            <img src="${logoAlberoPng}" alt="albero" />
            <img src="${logoTextPng}" alt="kykos" />
          </div>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
    printWindow.close();
  };

  const [operatorType, setOperatorType] = useState<{ isStreetOperator: boolean; isOfficeOperator: boolean } | null>(null);

  // Check if operator is street operator
  useEffect(() => {
    async function checkOperator() {
      try {
        const res = await fetch('/api/operator/me');
        if (res.ok) {
          const data = await res.json();
          setOperatorType({
            isStreetOperator: data.operator.isStreetOperator || false,
            isOfficeOperator: data.operator.isOfficeOperator || false,
          });
        }
      } catch (err) {
        console.error('Error checking operator:', err);
      }
    }
    checkOperator();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Caricamento...</p>
      </div>
    );
  }

  if (!object) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Oggetto non trovato</p>
        <Link href="/operator/objects" className="text-primary-600 hover:underline mt-2 inline-block">
          ← Torna alla lista
        </Link>
      </div>
    );
  }

  const images = object.imageUrls && object.imageUrls.length > 0 ? object.imageUrls : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link href={backUrl} className="text-sm text-gray-500 hover:text-primary-600 mb-2 inline-flex items-center gap-1">
            ← Torna alla lista
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{object.title}</h1>
          <div className="flex items-center gap-3 mt-2">
            {getStatusBadge(object.status)}
            <span className="text-sm text-gray-500">
              Aggiunto il {formatDate(object.createdAt)}
            </span>
          </div>
        </div>
        {object.status === 'DEPOSITED' && (
          <button
            onClick={handlePrintLabel}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2 text-sm font-medium"
          >
            <Printer className="w-4 h-4" aria-hidden="true" />
            Stampa etichetta
          </button>
        )}
        {operatorType?.isStreetOperator && object.status === 'AVAILABLE' && (
          <Link
            href={`/operator/objects/${id}/request`}
            className="px-4 py-2 bg-success-600 text-white rounded-lg hover:bg-success-700 flex items-center gap-2 text-sm font-medium"
          >
            <Inbox className="w-4 h-4" aria-hidden="true" />
            Richiedi
          </Link>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Gallery */}
        <div className="space-y-4">
          {/* Main image */}
          <div className="bg-gray-100 rounded-xl overflow-hidden aspect-square flex items-center justify-center">
            {images.length > 0 ? (
              <img
                src={images[selectedImage]}
                alt={object.title}
                className="w-full h-full object-contain"
              />
            ) : (
              <Package className="w-24 h-24 text-gray-300" aria-hidden="true" />
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {images.map((url, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 transition ${
                    selectedImage === index ? 'border-primary-500' : 'border-transparent'
                  }`}
                >
                  <img src={url} alt={`Immagine ${index + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Dettagli</h2>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm text-gray-500">Categoria</dt>
                <dd className="font-medium text-gray-900">
                  {CATEGORY_LABELS[object.category as keyof typeof CATEGORY_LABELS] || object.category}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Condizione</dt>
                <dd className="font-medium text-gray-900">
                  {CONDITION_LABELS[object.condition as keyof typeof CONDITION_LABELS] || object.condition}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Ente</dt>
                <dd className="font-medium text-gray-900">{object.intermediary.name}</dd>
              </div>
              {object.depositLocation && (
                <div>
                  <dt className="text-sm text-gray-500">Posizione deposito</dt>
                  <dd className="font-medium text-gray-900">{object.depositLocation}</dd>
                </div>
              )}
              <div>
                <dt className="text-sm text-gray-500">Donatore</dt>
                <dd className="font-medium text-gray-900">{object.donor.nickname || object.donor.name}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Beneficiario</dt>
                <dd className="font-medium text-gray-900">{object.recipient?.nickname || object.recipient?.name || 'N/D'}</dd>
              </div>
              {object.description && (
                <div>
                  <dt className="text-sm text-gray-500">Descrizione</dt>
                  <dd className="text-gray-700">{object.description}</dd>
                </div>
              )}
            </dl>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Creato</dt>
                <dd className="text-gray-900">{formatDate(object.createdAt)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Ultima modifica</dt>
                <dd className="text-gray-900">{formatDate(object.updatedAt)}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
