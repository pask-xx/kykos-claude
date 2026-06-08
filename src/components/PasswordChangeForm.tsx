'use client';

import { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, Input, Button, Alert } from '@/components/ui';

/**
 * PasswordChangeForm KYKOS unificato — gestisce cambio password per user
 * (donor/recipient/intermediary) e operator con un'unica implementazione.
 *
 * Pattern role-based: CONFIG table codifica URL e showCurrentPassword.
 *
 * Differenza intenzionale: l'operator NON chiede password attuale (l'API
 * `/api/operator/password/change` la ignora). Il form user la richiede
 * (l'API `/api/auth/password/change` la valida solo se presente).
 *
 * Toggle show/hide password: miglioramento UX rispetto al codice
 * precedente (3 input type="password" fissi).
 *
 * Primitive del design system: <Card>, <Input>, <Button>, <Alert> al
 * posto dei raw div/button/input.
 */

interface PasswordChangeFormProps {
  role: 'user' | 'operator';
  onSuccess?: () => void;
}

const CONFIG = {
  user: { url: '/api/auth/password/change', showCurrentPassword: true },
  operator: { url: '/api/operator/password/change', showCurrentPassword: false },
} as const;

export default function PasswordChangeForm({ role, onSuccess }: PasswordChangeFormProps) {
  const { url, showCurrentPassword } = CONFIG[role];

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const reset = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validazione client (zod sarebbe overkill per 2 form, ma le regole
    // sono allineate con la validazione server-side: min 6 caratteri).
    if (newPassword !== confirmPassword) {
      setError('Le password non corrispondono');
      return;
    }
    if (newPassword.length < 6) {
      setError('La nuova password deve essere di almeno 6 caratteri');
      return;
    }

    setLoading(true);

    try {
      // Body diverso per ruolo: l'API operator ignora currentPassword,
      // ma è più pulito NON inviarlo.
      const body = showCurrentPassword
        ? { currentPassword, newPassword }
        : { newPassword };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || 'Errore durante il cambio password');
        return;
      }

      setSuccess(true);
      reset();
      onSuccess?.();
    } catch {
      setError('Errore di connessione');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <Lock className="h-5 w-5 text-primary-600" aria-hidden="true" /> Cambia password
        </h2>

        {success && <Alert type="success">Password modificata con successo!</Alert>}
        {error && <Alert type="error">{error}</Alert>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {showCurrentPassword && (
            <PasswordInput
              id="currentPassword"
              label="Password attuale"
              value={currentPassword}
              onChange={setCurrentPassword}
              visible={showCurrent}
              onToggleVisible={() => setShowCurrent((s) => !s)}
              required
            />
          )}

          <PasswordInput
            id="newPassword"
            label="Nuova password"
            value={newPassword}
            onChange={setNewPassword}
            visible={showNew}
            onToggleVisible={() => setShowNew((s) => !s)}
            required
            minLength={6}
          />

          <PasswordInput
            id="confirmPassword"
            label="Conferma nuova password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            visible={showConfirm}
            onToggleVisible={() => setShowConfirm((s) => !s)}
            required
            minLength={6}
          />

          <Button
            type="submit"
            variant="primary"
            loading={loading}
            disabled={loading}
          >
            {loading ? 'Modificando...' : 'Modifica password'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

/**
 * Input password riusato 3 volte (current/new/confirm) con toggle
 * mostra/nascondi. Usa primitive <Input> e aggiunge il button toggle.
 */
function PasswordInput({
  id,
  label,
  value,
  onChange,
  visible,
  onToggleVisible,
  required,
  minLength,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  visible: boolean;
  onToggleVisible: () => void;
  required?: boolean;
  minLength?: number;
}) {
  return (
    <div className="relative">
      <Input
        id={id}
        label={label}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        minLength={minLength}
        autoComplete="off"
      />
      <button
        type="button"
        onClick={onToggleVisible}
        aria-label={visible ? 'Nascondi password' : 'Mostra password'}
        aria-pressed={visible}
        className="absolute right-3 top-9 text-gray-500 hover:text-gray-700 p-1 rounded"
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}
