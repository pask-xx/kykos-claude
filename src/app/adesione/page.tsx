'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function AdesionePage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    denominazione: '',
    nomeReferente: '',
    cognomeReferente: '',
    telefono: '',
    email: '',
    indirizzo: '',
    civico: '',
    cap: '',
    citta: '',
    nota: '',
    website: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/adesione', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.error || 'Errore durante l\'invio');
      }
    } catch {
      setError('Errore di connessione');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <Link href="/" className="flex items-center gap-3">
              <img src="/albero.svg" alt="KYKOS" className="w-10 h-10" />
              <span className="text-2xl font-bold text-primary-600">KYKOS</span>
            </Link>
          </div>
        </header>

        <main className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">📧</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Controlla la tua email!</h1>
            <p className="text-xl text-gray-600 mb-4">
              Abbiamo inviato un'email di conferma a <strong>{formData.email}</strong>
            </p>
            <p className="text-gray-600 mb-8">
              Clicca sul link nella email per confermare la richiesta di adesione.
              La tua richiesta sarà poi esaminata dal nostro team.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-8 text-left">
              <p className="text-amber-800 font-medium mb-2">📌 Non hai ricevuto l'email?</p>
              <ul className="text-sm text-amber-700 space-y-1">
                <li>• Controlla la cartella spam o promozioni</li>
                <li>• Verifica di aver scritto correttamente l'indirizzo email</li>
                <li>• Il link di conferma è valido per 24 ore</li>
              </ul>
            </div>
            <Link
              href="/"
              className="inline-block px-8 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
            >
              Torna alla home
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="flex items-center gap-3">
            <img src="/albero.svg" alt="KYKOS" className="w-10 h-10" />
            <span className="text-2xl font-bold text-primary-600">KYKOS</span>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          {/* Back link */}
          <Link href="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-primary-600 mb-8">
            <span>←</span>
            <span>Torna alla home</span>
          </Link>

          {/* Hero section */}
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🏢</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Richiedi l'adesione al network KYKOS
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Diventa parte della rete di solidarietà di KYKOS. Compila il form per richiedere l'adesione del tuo ente.
            </p>
          </div>

          {/* Form */}
          <div className="bg-white rounded-2xl shadow-sm border p-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Denominazione */}
              <div>
                <label htmlFor="denominazione" className="block text-sm font-medium text-gray-700 mb-1">
                  Denominazione ente <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="denominazione"
                  name="denominazione"
                  value={formData.denominazione}
                  onChange={handleChange}
                  required
                  placeholder="Es. Caritas Diocesana Roma"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              {/* Referente */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="nomeReferente" className="block text-sm font-medium text-gray-700 mb-1">
                    Nome referente <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="nomeReferente"
                    name="nomeReferente"
                    value={formData.nomeReferente}
                    onChange={handleChange}
                    required
                    placeholder="Mario"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label htmlFor="cognomeReferente" className="block text-sm font-medium text-gray-700 mb-1">
                    Cognome referente <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="cognomeReferente"
                    name="cognomeReferente"
                    value={formData.cognomeReferente}
                    onChange={handleChange}
                    required
                    placeholder="Rossi"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              {/* Contatti */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 mb-1">
                    Telefono <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    id="telefono"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                    required
                    placeholder="+39 333 1234567"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="segreteria@ente.it"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              {/* Indirizzo */}
              <div>
                <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
                  Sito web <span className="text-gray-400">(facoltativo)</span>
                </label>
                <input
                  type="url"
                  id="website"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  placeholder="https://www.ente.it"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label htmlFor="indirizzo" className="block text-sm font-medium text-gray-700 mb-1">
                    Indirizzo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="indirizzo"
                    name="indirizzo"
                    value={formData.indirizzo}
                    onChange={handleChange}
                    required
                    placeholder="Via Roma"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label htmlFor="civico" className="block text-sm font-medium text-gray-700 mb-1">
                    Civico <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="civico"
                    name="civico"
                    value={formData.civico}
                    onChange={handleChange}
                    required
                    placeholder="123"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="cap" className="block text-sm font-medium text-gray-700 mb-1">
                    CAP <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="cap"
                    name="cap"
                    value={formData.cap}
                    onChange={handleChange}
                    required
                    maxLength={5}
                    placeholder="00100"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label htmlFor="citta" className="block text-sm font-medium text-gray-700 mb-1">
                    Città <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="citta"
                    name="citta"
                    value={formData.citta}
                    onChange={handleChange}
                    required
                    placeholder="Roma"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              {/* Nota */}
              <div>
                <label htmlFor="nota" className="block text-sm font-medium text-gray-700 mb-1">
                  Nota di presentazione <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="nota"
                  name="nota"
                  value={formData.nota}
                  onChange={handleChange}
                  required
                  rows={4}
                  placeholder="Racconta brevemente la tua associazione, le attività svolte e perché vuoi unirti al network KYKOS..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Invio in corso...' : 'Invia richiesta di adesione'}
              </button>

              <p className="text-sm text-gray-500 text-center">
                Dopo l'invio, riceverai una email di conferma. Il nostro team ti contatterà per completare la procedura.
              </p>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}