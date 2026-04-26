'use client';

import { useState, useEffect } from 'react';
import { OPERATOR_ROLE_LABELS } from '@/types';
import OperatorPasswordChangeForm from '@/components/operator/OperatorPasswordChangeForm';
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

interface OrganizationData {
  id: string;
  name: string;
  type: string;
  address: string | null;
  houseNumber: string | null;
  cap: string | null;
  city: string | null;
  province: string | null;
  phone: string | null;
  email: string | null;
  verified: boolean;
  autoApproveRequests: boolean;
  hoursInfo: string | null;
}

interface OperatorData {
  id: string;
  username: string;
  email: string | null;
  phone: string | null;
  firstName: string;
  lastName: string;
  role: string;
  permissions: string[];
  organization: {
    id: string;
    name: string;
    type: string;
    code: string;
  };
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

export default function OperatorProfilePage() {
  const [operator, setOperator] = useState<OperatorData | null>(null);
  const [organization, setOrganization] = useState<OrganizationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hoursInfo, setHoursInfo] = useState('');
  const [autoApproveRequests, setAutoApproveRequests] = useState(false);
  const [locating, setLocating] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);
  const [form, setForm] = useState({
    address: '',
    houseNumber: '',
    cap: '',
    city: '',
    province: '',
    latitude: '',
    longitude: '',
  });

  const isAdmin = operator?.role === 'ADMIN' || operator?.permissions.includes('ORGANIZATION_ADMIN');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const opRes = await fetch('/api/operator/me');
      const opData = await opRes.json();

      if (opData.operator) {
        const op = opData.operator;
        setOperator(op);

        // If admin, also fetch organization data
        const isOpAdmin = op.role === 'ADMIN' || op.permissions.includes('ORGANIZATION_ADMIN');
        if (isOpAdmin) {
          const orgRes = await fetch('/api/operator/organization');
          if (orgRes.ok) {
            const orgData = await orgRes.json();
            if (orgData.organization) {
              setOrganization(orgData.organization);
              setHoursInfo(orgData.organization.hoursInfo || '');
              setAutoApproveRequests(orgData.organization.autoApproveRequests || false);
              setForm({
                address: orgData.organization.address || '',
                houseNumber: orgData.organization.houseNumber || '',
                cap: orgData.organization.cap || '',
                city: orgData.organization.city || '',
                province: orgData.organization.province || '',
                latitude: orgData.organization.latitude?.toString() || '',
                longitude: orgData.organization.longitude?.toString() || '',
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/operator/organization', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hoursInfo,
          autoApproveRequests,
        }),
      });

      if (res.ok) {
        setSuccess('Impostazioni salvate con successo');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const data = await res.json();
        setError(data.error || 'Errore');
      }
    } catch (err) {
      setError('Errore di rete');
    } finally {
      setSaving(false);
    }
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setGeocodeError('Geolocalizzazione non supportata');
      return;
    }

    setLocating(true);
    setGeocodeError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm(prev => ({
          ...prev,
          latitude: position.coords.latitude.toString(),
          longitude: position.coords.longitude.toString(),
        }));
        setLocating(false);
      },
      () => {
        setGeocodeError('Impossibile ottenere la posizione');
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
      setGeocodeError('Completa l\'indirizzo per calcolare la posizione');
      return;
    }

    setGeocoding(true);
    setGeocodeError(null);

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
    } catch (err) {
      setGeocodeError(err instanceof Error ? err.message : 'Errore');
    } finally {
      setGeocoding(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleAutoApproveChange = (checked: boolean) => {
    setAutoApproveRequests(checked);
    if (isAdmin) {
      setSaving(true);
      fetch('/api/operator/organization', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoApproveRequests: checked }),
      }).then(res => {
        if (res.ok) {
          setSuccess(checked ? 'Approvazione automatica attivata' : 'Approvazione automatica disattivata');
          setTimeout(() => setSuccess(null), 3000);
        }
      }).finally(() => setSaving(false));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Caricamento...</p>
      </div>
    );
  }

  if (!operator) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Profilo non trovato</p>
      </div>
    );
  }

  const hasLocation = form.latitude && form.longitude;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Il mio profilo</h1>
        <p className="text-gray-500">Informazioni personali e dell&apos;organizzazione</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-3xl">👤</span>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {operator.firstName} {operator.lastName}
            </h2>
            <p className="text-gray-500">@{operator.username}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-500 mb-1">Ruolo</p>
            <p className="font-medium text-gray-900">
              {OPERATOR_ROLE_LABELS[operator.role as keyof typeof OPERATOR_ROLE_LABELS] || operator.role}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Email</p>
            <p className="font-medium text-gray-900">{operator.email || '—'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Telefono</p>
            <p className="font-medium text-gray-900">{operator.phone || '—'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Username</p>
            <p className="font-medium text-gray-900">{operator.username}</p>
          </div>
        </div>
      </div>

      {/* Organization Card */}
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Ente di appartenenza</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-500 mb-1">Nome</p>
            <p className="font-medium text-gray-900">{operator.organization.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Tipo</p>
            <p className="font-medium text-gray-900">{operator.organization.type}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Codice Ente</p>
            <p className="font-medium text-gray-900">{operator.organization.code}</p>
          </div>
        </div>
      </div>

      {/* Password Change */}
      <OperatorPasswordChangeForm />
    </div>
  );
}
