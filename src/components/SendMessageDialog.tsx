'use client';

import { useState } from 'react';

interface SendMessageDialogProps {
  userId: string;
  userType: 'USER' | 'OPERATOR';
  userName: string;
  onSent?: () => void;
  children: React.ReactNode;
}

export default function SendMessageDialog({ userId, userType, userName, onSent, children }: SendMessageDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) return;
    setSending(true);
    setError(null);

    try {
      const res = await fetch('/api/operator/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId: userId, recipientType: userType, title, message }),
      });

      if (res.ok) {
        setSuccess(true);
        setTitle('');
        setMessage('');
        setTimeout(() => {
          setOpen(false);
          setSuccess(false);
          onSent?.();
        }, 1500);
      } else {
        const data = await res.json();
        setError(data.error || 'Errore nell\'invio');
      }
    } catch {
      setError('Errore di connessione');
    } finally {
      setSending(false);
    }
  };

  const handleCancel = () => {
    setOpen(false);
    setTitle('');
    setMessage('');
    setError(null);
    setSuccess(false);
  };

  return (
    <>
      <div onClick={() => setOpen(true)}>{children}</div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={handleCancel} />
          <div className="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Invia messaggio</h3>
            <p className="text-sm text-gray-500 mb-4">Invia una notifica a {userName}</p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
                Messaggio inviato!
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Oggetto</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Es. Richiesta documenti"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Messaggio</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Scrivi il messaggio..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
              >
                Annulla
              </button>
              <button
                onClick={handleSend}
                disabled={sending || !title.trim() || !message.trim()}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium disabled:opacity-50"
              >
                {sending ? 'Invio...' : 'Invia'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}