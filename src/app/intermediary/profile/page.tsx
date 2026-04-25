'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import PasswordChangeForm from '@/components/profile/PasswordChangeForm';
import dynamic from 'next/dynamic';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import LinkExtension from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Underline from '@tiptap/extension-underline';
import FontSize from '@tiptap/extension-font-size';

const LocationMap = dynamic(() => import('@/components/map/LocationMap'), {
  ssr: false,
  loading: () => <div className="h-48 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center"><span className="text-gray-400">Caricamento mappa...</span></div>,
});

interface Organization {
  id: string;
  code: string;
  name: string;
  type: string;
  vatNumber: string | null;
  verified: boolean;
  address: string | null;
  houseNumber: string | null;
  cap: string | null;
  city: string | null;
  province: string | null;
  phone: string | null;
  email: string | null;
  latitude: number | null;
  longitude: number | null;
  autoApproveRequests: boolean;
  hoursInfo: string | null;
}

interface FormData {
  name: string;
  vatNumber: string;
  address: string;
  houseNumber: string;
  cap: string;
  city: string;
  province: string;
  phone: string;
  email: string;
  latitude: string;
  longitude: string;
  autoApproveRequests: boolean;
  hoursInfo: string;
}

function RichTextEditor({ value, onChange }: { value: string; onChange: (html: string) => void }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      LinkExtension.configure({
        openOnClick: false,
      }),
      TextStyle,
      Color,
      Underline,
      FontSize.configure({
        types: ['textStyle'],
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[150px] px-4 py-3 border border-gray-300 rounded-lg',
      },
    },
  });

  if (!editor) return null;

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      <div className="bg-gray-50 border-b border-gray-200 p-2 flex flex-wrap gap-1">
        {/* Text alignment */}
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={`px-2 py-1 text-sm rounded ${editor.isActive({ textAlign: 'left' }) ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-200'}`}
          title="Allinea a sinistra"
        >
          ≡
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={`px-2 py-1 text-sm rounded ${editor.isActive({ textAlign: 'center' }) ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-200'}`}
          title="Centra"
        >
          ≡̲
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={`px-2 py-1 text-sm rounded ${editor.isActive({ textAlign: 'right' }) ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-200'}`}
          title="Allinea a destra"
        >
          ≡
        </button>

        <span className="border-l border-gray-300 mx-1" />

        {/* Bold, Italic, Underline */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-3 py-1 text-sm font-medium rounded ${editor.isActive('bold') ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-200'}`}
        >
          B
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-3 py-1 text-sm font-medium rounded italic ${editor.isActive('italic') ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-200'}`}
        >
          I
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`px-3 py-1 text-sm font-medium rounded underline ${editor.isActive('underline') ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-200'}`}
        >
          U
        </button>

        <span className="border-l border-gray-300 mx-1" />

        {/* Lists */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`px-3 py-1 text-sm rounded ${editor.isActive('bulletList') ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-200'}`}
          title="Elenco puntato"
        >
          •
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`px-3 py-1 text-sm rounded ${editor.isActive('orderedList') ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-200'}`}
          title="Elenco numerato"
        >
          1.
        </button>

        <span className="border-l border-gray-300 mx-1" />

        {/* Font size */}
        <select
          className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
          onChange={(e) => {
            const size = e.target.value;
            if (size) {
              editor.chain().focus().setFontSize(size).run();
            }
          }}
          value={editor.getAttributes('textStyle').fontSize || ''}
        >
          <option value="">Size</option>
          <option value="12px">12px</option>
          <option value="14px">14px</option>
          <option value="16px">16px</option>
          <option value="18px">18px</option>
          <option value="20px">20px</option>
          <option value="24px">24px</option>
        </select>

        {/* Text color */}
        <div className="relative flex items-center">
          <span className="text-xs mr-1 text-gray-500">Col:</span>
          <input
            type="color"
            className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
            onChange={(e) => {
              editor.chain().focus().setColor(e.target.value).run();
            }}
            value={editor.getAttributes('textStyle').color || '#000000'}
          />
        </div>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}

export default function IntermediaryProfilePage() {
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>({
    name: '',
    vatNumber: '',
    address: '',
    houseNumber: '',
    cap: '',
    city: '',
    province: '',
    phone: '',
    email: '',
    latitude: '',
    longitude: '',
    autoApproveRequests: false,
    hoursInfo: '',
  });

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user?.intermediaryOrg) {
          const o = data.user.intermediaryOrg;
          setOrg(o);
          setForm({
            name: o.name || '',
            vatNumber: o.vatNumber || '',
            address: o.address || '',
            houseNumber: o.houseNumber || '',
            cap: o.cap || '',
            city: o.city || '',
            province: o.province || '',
            phone: o.phone || '',
            email: o.email || '',
            latitude: o.latitude?.toString() || '',
            longitude: o.longitude?.toString() || '',
            autoApproveRequests: o.autoApproveRequests || false,
            hoursInfo: o.hoursInfo || '',
          });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleHoursInfoChange = (html: string) => {
    setForm(prev => ({ ...prev, hoursInfo: html }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch('/api/organization/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          vatNumber: form.vatNumber || null,
          address: form.address || null,
          houseNumber: form.houseNumber || null,
          cap: form.cap || null,
          city: form.city || null,
          province: form.province || null,
          phone: form.phone || null,
          email: form.email || null,
          latitude: form.latitude || null,
          longitude: form.longitude || null,
          autoApproveRequests: form.autoApproveRequests,
          hoursInfo: form.hoursInfo || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Errore durante il salvataggio');
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore');
    } finally {
      setSaving(false);
    }
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocalizzazione non supportata');
      return;
    }

    setLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm(prev => ({
          ...prev,
          latitude: position.coords.latitude.toString(),
          longitude: position.coords.longitude.toString(),
        }));
        setLocating(false);
        setSuccess(false);
      },
      () => {
        setLocationError('Impossibile ottenere la posizione');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const geocodeAddress = async () => {
    const fullAddress = [form.address, form.houseNumber, form.cap, form.city]
      .filter(Boolean)
      .join(', ');

    if (!fullAddress) {
      setLocationError('Completa l\'indirizzo per calcolare la posizione');
      return;
    }

    setGeocoding(true);
    setLocationError(null);

    try {
      const res = await fetch('/api/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: [form.address, form.houseNumber].filter(Boolean).join(', '),
          city: form.city,
          cap: form.cap || undefined,
          province: form.province || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Errore nel calcolo della posizione');
      }

      setForm(prev => ({
        ...prev,
        latitude: data.latitude.toString(),
        longitude: data.longitude.toString(),
      }));
      setSuccess(false);
    } catch (err) {
      setLocationError(err instanceof Error ? err.message : 'Errore');
    } finally {
      setGeocoding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Caricamento...</p>
      </div>
    );
  }

  if (!org) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Dati organizzazione non trovati.</p>
      </div>
    );
  }

  const hasLocation = form.latitude && form.longitude;

  return (
    <div className="max-w-full">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-medium text-gray-900">Profilo Ente</h1>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          org.verified ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
        }`}>
          {org.verified ? 'Verificato' : 'In verifica'}
        </span>
      </div>

      {/* Organization Form */}
      <form onSubmit={handleSubmit}>
        <div className="bg-white p-6 rounded-xl shadow-sm border mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <span>🏢</span> Dati organizzazione
          </h2>

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
              ✓ Dati salvati con successo
            </div>
          )}

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ragione sociale *</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Partita IVA</label>
              <input
                type="text"
                name="vatNumber"
                value={form.vatNumber}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none uppercase"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Indirizzo</label>
              <input
                type="text"
                name="address"
                value={form.address}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Numero civico</label>
              <input
                type="text"
                name="houseNumber"
                value={form.houseNumber}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CAP</label>
              <input
                type="text"
                name="cap"
                value={form.cap}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Città *</label>
              <input
                type="text"
                name="city"
                value={form.city}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Provincia</label>
              <input
                type="text"
                name="province"
                value={form.province}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none uppercase"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefono</label>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>
          </div>

          <div className="mt-6 pt-6 border-t">
            {/* Auto-approve option */}
            <div className="mb-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="autoApproveRequests"
                  checked={form.autoApproveRequests}
                  onChange={handleChange}
                  className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <div>
                  <p className="font-medium text-gray-900">Approvazione automatica richieste</p>
                  <p className="text-sm text-gray-500">Se attivo, le richieste degli utenti vengono approvate automaticamente senza necessità di intervento manuale.</p>
                </div>
              </label>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium disabled:opacity-50"
            >
              {saving ? 'Salvataggio...' : 'Salva dati organizzazione'}
            </button>
          </div>
        </div>
      </form>

      {/* Hours Info */}
      <div className="bg-white p-6 rounded-xl shadow-sm border mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <span>🕐</span> Orari e informazioni
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Inserisci gli orari di apertura/chiusura dell&apos;ente e altre informazioni utili per chi deve consegnare o ritirare oggetti.
          Queste informazioni verranno incluse nelle email di consegna e ritiro QR code.
        </p>
        <RichTextEditor
          value={form.hoursInfo}
          onChange={handleHoursInfoChange}
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          className="mt-4 px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium disabled:opacity-50"
        >
          {saving ? 'Salvataggio...' : 'Salva orari'}
        </button>
      </div>

      {/* Geolocation */}
      <div className="bg-white p-6 rounded-xl shadow-sm border mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span>📍</span> Posizione geografica
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          {hasLocation
            ? `Posizione: ${parseFloat(form.latitude).toFixed(5)}, ${parseFloat(form.longitude).toFixed(5)}`
            : 'Nessuna posizione registrata'}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <button
            type="button"
            onClick={detectLocation}
            disabled={locating}
            className="flex-1 px-4 py-2.5 bg-secondary-600 text-white text-sm font-medium rounded-lg hover:bg-secondary-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
          >
            {locating ? (
              <><span className="animate-spin">🔄</span> Rilevamento...</>
            ) : (
              <><span>📡</span> {hasLocation ? 'Aggiorna con GPS' : 'Rileva con GPS'}</>
            )}
          </button>
          <button
            type="button"
            onClick={geocodeAddress}
            disabled={geocoding || !form.address || !form.city}
            className="flex-1 px-4 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
          >
            {geocoding ? (
              <><span className="animate-spin">🔄</span> Calcolo...</>
            ) : (
              <><span>🏠</span> Calcola da indirizzo</>
            )}
          </button>
        </div>

        {locationError && (
          <p className="text-sm text-red-600 mb-4">{locationError}</p>
        )}

        {hasLocation && (
          <div>
            <LocationMap
              latitude={parseFloat(form.latitude)}
              longitude={parseFloat(form.longitude)}
              height="250px"
            />
          </div>
        )}
      </div>

      {/* Password Change */}
      <PasswordChangeForm />
    </div>
  );
}
