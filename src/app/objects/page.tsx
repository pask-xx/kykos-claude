'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CATEGORY_LABELS, DonorLevel, DONOR_LEVEL_LABELS, Category } from '@/types';
import { formatDistance } from '@/lib/geo';
import { Check, Lock, Package, MapPin } from 'lucide-react';

interface Object {
  id: string;
  title: string;
  description: string | null;
  category: Category;
  condition: string;
  imageUrls: string[] | null;
  createdAt: string;
  distance: number | null;
  donor: {
    donorProfile: { level: DonorLevel };
  };
  intermediary: {
    name: string;
  };
}

const LEVEL_LABELS: Record<DonorLevel, string> = DONOR_LEVEL_LABELS;

export default function BrowsePage() {
  const router = useRouter();
  const [objects, setObjects] = useState<Object[]>([]);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [category, setCategory] = useState<string>('ALL');
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [radius, setRadius] = useState<number>(10);
  const [locationRequested, setLocationRequested] = useState(false);

  useEffect(() => {
    requestGeolocation();
  }, []);

  useEffect(() => {
    fetchObjects();
  }, [category, userLocation, radius]);

  const requestGeolocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocalizzazione non supportata dal browser');
      return;
    }

    setLocationRequested(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
        setLocationError(null);
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('Permesso geolocalizzazione negato');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError('Posizione non disponibile');
            break;
          case error.TIMEOUT:
            setLocationError('Timeout geolocalizzazione');
            break;
          default:
            setLocationError('Errore geolocalizzazione');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  };

  const fetchObjects = async () => {
    try {
      const params = new URLSearchParams();
      if (category !== 'ALL') params.set('category', category);
      if (userLocation) {
        params.set('latitude', userLocation.lat.toString());
        params.set('longitude', userLocation.lon.toString());
        params.set('radius', radius.toString());
      }
      const url = `/api/objects${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await fetch(url);

      if (res.status === 401) {
        setUnauthorized(true);
        setLoading(false);
        return;
      }

      const data = await res.json();
      setObjects(data.objects || []);
    } catch (error) {
      console.error('Error fetching objects:', error);
    } finally {
      setLoading(false);
    }
  };

  const radiusOptions = [5, 10, 25, 50];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-primary-600">KYKOS</Link>
            <nav className="flex items-center gap-6">
              <Link href="/objects" className="text-primary-600 font-medium">
                Sfoglia
              </Link>
              <Link href="/auth/login" className="text-gray-600 hover:text-primary-600 font-medium">
                Accedi
              </Link>
              <Link
                href="/auth/register"
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
              >
                Registrati
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Sfoglia oggetti</h1>
          <Link
            href="/auth/register?role=recipient"
            className="px-4 py-2 text-primary-600 border border-primary-600 rounded-lg hover:bg-primary-50 font-medium"
          >
            Richiedi un oggetto
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl shadow-sm border mb-8">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setCategory('ALL')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  category === 'ALL'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Tutti
              </button>
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setCategory(key)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    category === key
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4 ml-auto">
              {/* Location status */}
              <div className="flex items-center gap-2">
                {userLocation ? (
                  <>
                    <span className="w-2 h-2 bg-success-500 rounded-full"></span>
                    <span className="text-sm text-gray-600 inline-flex items-center gap-1">
                      Posizione:
                      <Check className="w-3 h-3 text-success-600" aria-hidden="true" />
                    </span>
                  </>
                ) : locationRequested ? (
                  <>
                    <span className="w-2 h-2 bg-warning-500 rounded-full"></span>
                    <span className="text-sm text-gray-600">{locationError || 'Localizzazione...'}</span>
                  </>
                ) : (
                  <span className="text-sm text-gray-400">Posizione: non richiesta</span>
                )}
              </div>

              {/* Radius selector */}
              {userLocation && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Raggio:</span>
                  {radiusOptions.map((r) => (
                    <button
                      key={r}
                      onClick={() => setRadius(r)}
                      className={`px-3 py-1 rounded text-sm font-medium transition ${
                        radius === r
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {r}km
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Objects Grid */}
        {unauthorized ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border">
            <Lock className="w-12 h-12 mx-auto mb-4 text-gray-400" aria-hidden="true" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Accesso richiesto</h2>
            <p className="text-gray-500 mb-6">Devi effettuare l'accesso per visualizzare gli oggetti disponibili.</p>
            <Link
              href="/auth/login"
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
            >
              Accedi
            </Link>
          </div>
        ) : loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Caricamento...</p>
          </div>
        ) : objects.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border">
            <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" aria-hidden="true" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Nessun oggetto disponibile</h2>
            <p className="text-gray-500 mb-6">Al momento non ci sono oggetti in questa categoria.</p>
            <Link
              href="/auth/register?role=donor"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Sii il primo a donare un oggetto →
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
            {objects.map((obj) => (
              <div key={obj.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="aspect-square bg-gray-100 flex items-center justify-center relative">
                  {obj.imageUrls && obj.imageUrls.length > 0 ? (
                    <>
                      <img src={obj.imageUrls[0]} alt={obj.title} className="object-cover w-full h-full" />
                      {obj.imageUrls.length > 1 && (
                        <span className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                          +{obj.imageUrls.length - 1}
                        </span>
                      )}
                    </>
                  ) : (
                    <Package className="w-12 h-12 text-gray-400" aria-hidden="true" />
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                      {CATEGORY_LABELS[obj.category]}
                    </span>
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                      {obj.condition.replace('_', ' ')}
                    </span>
                    {obj.distance !== null && (
                      <span className="px-2 py-1 bg-success-100 text-success-700 text-xs rounded inline-flex items-center gap-1">
                        <MapPin className="w-3 h-3" aria-hidden="true" />
                        {formatDistance(obj.distance)}
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{obj.title}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                    {obj.description || 'Nessuna descrizione'}
                  </p>
                  <div className="text-xs text-gray-400 mb-3">
                    Livello donatore: {LEVEL_LABELS[obj.donor.donorProfile.level]} · Intermediario: {obj.intermediary.name}
                  </div>
                  <Link
                    href={`/objects/${obj.id}`}
                    className="block text-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium text-sm"
                  >
                    Dettaglio
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-gray-500">
        <p>© 2024 KYKOS. Dona con amore, ricevi con dignità</p>
      </footer>
    </div>
  );
}
