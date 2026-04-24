'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

interface Intermediary {
  id: string;
  name: string;
  type: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  verified: boolean;
  lat: number | null;
  lng: number | null;
  createdAt: string;
  user: {
    email: string;
    createdAt: string;
  };
  _count: {
    objects: number;
    requests: number;
    authorizedRecipients: number;
  };
}

export default function IntermediaryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);
  const [intermediary, setIntermediary] = useState<Intermediary | null>(null);
  const [loading, setLoading] = useState(true);
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null);

  useEffect(() => {
    params.then(p => setResolvedParams(p));
  }, [params]);

  useEffect(() => {
    if (!resolvedParams) return;

    fetch(`/api/admin/intermediaries/${resolvedParams.id}`)
      .then(res => res.json())
      .then(data => {
        setIntermediary(data.intermediary);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error:', err);
        setLoading(false);
      });
  }, [resolvedParams]);

  useEffect(() => {
    if (!intermediary || !mapRef.current || mapInstanceRef.current) return;
    if (!intermediary.lat || !intermediary.lng) return;

    // Dynamically load Leaflet CSS and JS
    const linkEl = document.createElement('link');
    linkEl.rel = 'stylesheet';
    linkEl.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(linkEl);

    const scriptEl = document.createElement('script');
    scriptEl.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    scriptEl.onload = () => {
      if (!mapRef.current || mapInstanceRef.current) return;

      const L = window.L;

      const map = L.map(mapRef.current).setView([intermediary.lat!, intermediary.lng!], 15);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map);

      L.marker([intermediary.lat!, intermediary.lng!])
        .addTo(map)
        .bindPopup(intermediary.name)
        .openPopup();

      mapInstanceRef.current = map;
    };
    document.body.appendChild(scriptEl);
  }, [intermediary]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Caricamento...</p>
      </div>
    );
  }

  if (!intermediary) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Ente non trovato</p>
      </div>
    );
  }

  const orgTypeLabels: Record<string, string> = {
    CHARITY: 'Centro Caritas',
    CHURCH: 'Parrocchia',
    ASSOCIATION: 'Associazione',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-primary-600">KYKOS</Link>
            <nav className="flex items-center gap-6">
              <Link href="/admin/dashboard" className="text-gray-600 hover:text-primary-600 font-medium">
                ← Torna agli enti
              </Link>
              <div className="flex items-center gap-3">
                <form action="/api/auth/logout" method="POST">
                  <button type="submit" className="text-sm text-red-600 hover:text-red-700">
                    Esci
                  </button>
                </form>
              </div>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{intermediary.name}</h1>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            intermediary.verified ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
          }`}>
            {intermediary.verified ? 'Verificato' : 'In attesa'}
          </span>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Info Card */}
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Informazioni</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Tipo</p>
                <p className="font-medium text-gray-900">{orgTypeLabels[intermediary.type] || intermediary.type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Indirizzo</p>
                <p className="font-medium text-gray-900">{intermediary.address || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium text-gray-900">{intermediary.email || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Telefono</p>
                <p className="font-medium text-gray-900">{intermediary.phone || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email utente</p>
                <p className="font-medium text-gray-900">{intermediary.user.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Registrato il</p>
                <p className="font-medium text-gray-900">
                  {new Date(intermediary.user.createdAt).toLocaleDateString('it-IT', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Stats & Map Card */}
          <div className="space-y-6">
            {/* Stats */}
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Statistiche</h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-3xl font-bold text-gray-900">{intermediary._count.objects}</p>
                  <p className="text-sm text-gray-500">Oggetti</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-3xl font-bold text-gray-900">{intermediary._count.requests}</p>
                  <p className="text-sm text-gray-500">Richieste</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-3xl font-bold text-gray-900">{intermediary._count.authorizedRecipients}</p>
                  <p className="text-sm text-gray-500">Riceventi</p>
                </div>
              </div>
            </div>

            {/* Map */}
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Posizione</h2>
              {intermediary.lat && intermediary.lng ? (
                <div ref={mapRef} className="h-64 rounded-lg bg-gray-100" />
              ) : (
                <div className="h-64 rounded-lg bg-gray-100 flex items-center justify-center">
                  <p className="text-gray-500">Posizione non disponibile</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
