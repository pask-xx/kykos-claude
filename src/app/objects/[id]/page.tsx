'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { CATEGORY_LABELS, CONDITION_LABELS, Category, Condition } from '@/types';

interface Object {
  id: string;
  title: string;
  description: string | null;
  category: Category;
  condition: Condition;
  imageUrls: string[];
  status: string;
  createdAt: string;
  donor: {
    name: string;
    latitude: number | null;
    longitude: number | null;
  };
  intermediary: {
    name: string;
    latitude: number | null;
    longitude: number | null;
  };
}

export default function ObjectDetailPage() {
  const params = useParams();
  const [object, setObject] = useState<Object | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    if (params.id) {
      fetchObject();
    }
  }, [params.id]);

  const fetchObject = async () => {
    try {
      const res = await fetch(`/api/objects/${params.id}`);
      const data = await res.json();
      if (data.object) {
        setObject(data.object);
      }
    } catch (error) {
      console.error('Error fetching object:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Caricamento...</p>
      </div>
    );
  }

  if (!object) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Oggetto non trovato</h2>
          <Link href="/objects" className="text-primary-600 hover:text-primary-700">
            Torna agli oggetti
          </Link>
        </div>
      </div>
    );
  }

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
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Link href="/objects" className="text-gray-600 hover:text-primary-600 mb-6 inline-block">
          ← Torna agli oggetti
        </Link>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden">
              {object.imageUrls && object.imageUrls.length > 0 ? (
                <img
                  src={object.imageUrls[selectedImage]}
                  alt={object.title}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-8xl">📦</span>
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {object.imageUrls && object.imageUrls.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {object.imageUrls.map((url, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition ${
                      selectedImage === index
                        ? 'border-primary-600'
                        : 'border-transparent hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={url}
                      alt={`${object.title} - Immagine ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Navigation arrows */}
            {object.imageUrls && object.imageUrls.length > 1 && (
              <div className="flex justify-between">
                <button
                  onClick={() => setSelectedImage((prev) => (prev === 0 ? object.imageUrls.length - 1 : prev - 1))}
                  className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  ← Precedente
                </button>
                <span className="flex items-center">
                  {selectedImage + 1} / {object.imageUrls.length}
                </span>
                <button
                  onClick={() => setSelectedImage((prev) => (prev === object.imageUrls.length - 1 ? 0 : prev + 1))}
                  className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Successiva →
                </button>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
                {CATEGORY_LABELS[object.category]}
              </span>
              <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                {CONDITION_LABELS[object.condition]}
              </span>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-4">{object.title}</h1>

            {object.description && (
              <p className="text-gray-600 mb-6">{object.description}</p>
            )}

            <div className="border-t pt-6 space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Donatore</h3>
                <p className="text-gray-900">{object.donor.name}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">Intermediario</h3>
                <p className="text-gray-900">{object.intermediary.name}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">Stato</h3>
                <p className="text-gray-900 capitalize">{object.status.toLowerCase()}</p>
              </div>
            </div>

            <div className="mt-8">
              <Link
                href={`/auth/register?role=recipient&objectId=${object.id}`}
                className="block w-full text-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
              >
                Richiedi questo oggetto
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-gray-500">
        <p>© 2024 KYKOS. Dona con amore, ricevi con dignità</p>
      </footer>
    </div>
  );
}
