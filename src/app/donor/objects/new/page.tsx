'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CATEGORY_LABELS, CONDITION_LABELS, Category, Condition } from '@/types';

interface Intermediary {
  id: string;
  name: string;
  type: string;
  address: string | null;
}

const MAX_IMAGES = 5;

export default function NewObjectPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const [intermediaries, setIntermediaries] = useState<Intermediary[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>('OTHER');
  const [condition, setCondition] = useState<Condition>('GOOD');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [intermediaryId, setIntermediaryId] = useState('');

  useEffect(() => {
    fetchIntermediaries();
  }, []);

  const fetchIntermediaries = async () => {
    try {
      const res = await fetch('/api/intermediaries');
      const data = await res.json();
      setIntermediaries(data.intermediaries || []);
    } catch (err) {
      console.error('Error fetching intermediaries:', err);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = MAX_IMAGES - imageUrls.length;
    const filesToUpload = Array.from(files).slice(0, remainingSlots);

    if (filesToUpload.length === 0) {
      setError(`Puoi caricare al massimo ${MAX_IMAGES} foto`);
      return;
    }

    // Show local previews immediately
    const newPreviews: string[] = [];
    for (const file of filesToUpload) {
      const reader = new FileReader();
      await new Promise<void>((resolve) => {
        reader.onload = () => {
          newPreviews.push(reader.result as string);
          resolve();
        };
        reader.readAsDataURL(file);
      });
    }
    setPreviews((prev) => [...prev, ...newPreviews]);

    // Upload files
    setUploading(true);
    const uploadedUrls: string[] = [];

    for (const file of filesToUpload) {
      try {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || 'Errore upload');
          // Remove failed previews
          setPreviews((prev) => prev.slice(0, prev.length - newPreviews.length));
          return;
        }

        uploadedUrls.push(data.url);
      } catch {
        setError('Errore di connessione');
        setPreviews((prev) => prev.slice(0, prev.length - newPreviews.length));
        setUploading(false);
        return;
      }
    }

    setImageUrls((prev) => [...prev, ...uploadedUrls]);
    setUploading(false);

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (index: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (imageUrls.length === 0) {
      setError('Carica almeno una foto prima di pubblicare');
      return;
    }

    if (!intermediaryId) {
      setError('Seleziona un ente di riferimento');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/objects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          category,
          condition,
          imageUrls,
          intermediaryId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Errore durante la creazione');
        return;
      }

      router.push('/donor/objects');
    } catch {
      setError('Errore di connessione');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-primary-600">KYKOS</Link>
            <nav className="flex items-center gap-6">
              <Link href="/donor/dashboard" className="text-gray-600 hover:text-primary-600 font-medium">
                Dashboard
              </Link>
              <Link href="/donor/objects" className="text-gray-600 hover:text-primary-600 font-medium">
                I miei oggetti
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <Link href="/donor/objects" className="text-gray-500 hover:text-gray-700 text-sm mb-2 inline-block">
            ← I miei oggetti
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Nuovo oggetto</h1>
          <p className="text-gray-600 mt-1">Inserisci un oggetto da donare</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border space-y-6">
          {/* Photo Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Foto oggetto * ({imageUrls.length}/{MAX_IMAGES})
            </label>

            <div className="space-y-3">
              {/* Image Previews Grid */}
              {previews.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  {previews.map((preview, index) => (
                    <div key={index} className="relative aspect-square">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 text-xs"
                      >
                        ✕
                      </button>
                      {uploading && index >= imageUrls.length && (
                        <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                          <span className="text-white text-xs">...</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Add Photo Button */}
              {previews.length < MAX_IMAGES && (
                <label className="block border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-primary-400 hover:bg-gray-50 transition">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileChange}
                    multiple
                    className="hidden"
                  />
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-3xl">📷</span>
                    <span className="text-gray-600">Aggiungi foto</span>
                    <span className="text-xs text-gray-400">
                      {MAX_IMAGES - previews.length} foto ancora disponibili
                    </span>
                  </div>
                </label>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Titolo *
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              placeholder="Es: Divano 3 posti"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Descrizione
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none"
              placeholder="Descrivi l'oggetto che vuoi donare..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Categoria *
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              >
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="condition" className="block text-sm font-medium text-gray-700 mb-2">
                Condizione *
              </label>
              <select
                id="condition"
                value={condition}
                onChange={(e) => setCondition(e.target.value as Condition)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              >
                {Object.entries(CONDITION_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="intermediary" className="block text-sm font-medium text-gray-700 mb-2">
              Ente di riferimento *
            </label>
            <select
              id="intermediary"
              value={intermediaryId}
              onChange={(e) => setIntermediaryId(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            >
              <option value="">Seleziona un ente</option>
              {intermediaries.map((int) => (
                <option key={int.id} value={int.id}>
                  {int.name} ({int.type})
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              L&apos;ente gestirà il passaggio dell&apos;oggetto al ricevente
            </p>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading || uploading || imageUrls.length === 0}
              className="w-full py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Pubblicazione...' : 'Pubblica oggetto'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
