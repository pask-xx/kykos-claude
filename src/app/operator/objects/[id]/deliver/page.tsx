'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface ObjectDetail {
  id: string;
  title: string;
  status: string;
  imageUrls: string[];
  donor: { id: string; name: string };
  recipient?: { id: string; name: string };
}

export default function DeliverObjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [object, setObject] = useState<ObjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

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

  const handleDeliver = async () => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/operator/deliver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objectId: id }),
      });

      if (res.ok) {
        router.push('/operator/objects');
      } else {
        const data = await res.json();
        alert(data.error || 'Errore');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Errore di connessione');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Caricamento...</div>;
  }

  if (!object) {
    return (
      <div className="p-8 text-center">
        <p>Oggetto non trovato</p>
        <Link href="/operator/objects" className="text-primary-600 hover:underline">
          ← Torna alle disponibilità
        </Link>
      </div>
    );
  }

  if (object.status !== 'DEPOSITED') {
    return (
      <div className="p-8 text-center">
        <p>Questo oggetto non e&apos; in stato di deposito</p>
        <Link href="/operator/objects" className="text-primary-600 hover:underline">
          ← Torna alle disponibilità
        </Link>
      </div>
    );
  }

  const images = object.imageUrls && object.imageUrls.length > 0 ? object.imageUrls : [];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/operator/objects" className="text-sm text-gray-500 hover:text-primary-600 mb-2 inline-flex items-center gap-1">
          ← Tutte le disponibilità
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Conferma consegna</h1>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <div className="flex gap-6">
          <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
            {images.length > 0 ? (
              <img src={images[0]} alt={object.title} className="w-full h-full object-contain" />
            ) : (
              <span className="text-5xl">📦</span>
            )}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{object.title}</h2>
            <p className="text-sm text-gray-500 mt-1">Donatore: {object.donor.name}</p>
            <div className="mt-3">
              <span className="px-3 py-1 bg-amber-100 text-amber-700 text-sm rounded-full">
                Ritirato - in attesa di consegna finale
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-green-50 p-6 rounded-xl border border-green-200">
        <h3 className="font-semibold text-green-800 mb-2">Conferma la consegna definitiva</h3>
        <p className="text-sm text-green-700 mb-4">
          Stai per registrare la consegna definitiva dell&apos;oggetto al beneficiario.
          Questa azione marcera&apos; l&apos;oggetto come completamente donato.
        </p>
        <button
          onClick={handleDeliver}
          disabled={submitting}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50"
        >
          {submitting ? 'Elaborazione...' : 'Conferma consegna'}
        </button>
      </div>
    </div>
  );
}
