'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { Spinner, toast } from '@/components/ui';

/**
 * LogoutButton KYKOS unificato — gestisce disconnessione per user
 * (donor/recipient/intermediary) e operator con un'unica implementazione.
 *
 * Pattern role-based: una tabella CONFIG codifica URL e redirect per ruolo,
 * invece di if/else sparsi. Il cookie `session` (user) vs
 * `operator_session` (operator) e' gestito dalle rispettive API route.
 *
 * Differenza intenzionale: l'operator atterra su `/auth/login` (route
 * protette richiedono re-login esplicito), il user atterra su `/`
 * (landing pubblica). NON uniformare — la scelta e' voluta.
 */

interface LogoutButtonProps {
  role: 'user' | 'operator';
  /** 'text' (default) mostra label, 'icon' mostra solo icona. */
  variant?: 'text' | 'icon';
  /** Label del bottone (default: 'Esci'). */
  label?: string;
  /** Side-effect custom dopo redirect (es. analytics). */
  onAfterLogout?: () => void;
}

const CONFIG = {
  user: { url: '/api/auth/logout', redirect: '/' },
  operator: { url: '/api/operator/logout', redirect: '/auth/login' },
} as const;

export default function LogoutButton({
  role,
  variant = 'text',
  label = 'Esci',
  onAfterLogout,
}: LogoutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { url, redirect } = CONFIG[role];

  const handleLogout = async () => {
    if (loading) return;
    setLoading(true);

    try {
      await fetch(url, { method: 'GET' });
      onAfterLogout?.();
      router.push(redirect);
      router.refresh();
    } catch (err) {
      console.error('Logout error:', err);
      toast.error("Errore durante il logout. Riprova.");
      setLoading(false);
    }
  };

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={handleLogout}
        disabled={loading}
        aria-label={label}
        title={label}
        className="w-8 h-8 flex items-center justify-center text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
      >
        {loading ? <Spinner size="sm" /> : <LogOut className="h-4 w-4" />}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50 inline-flex items-center gap-1"
    >
      {loading ? <Spinner size="sm" /> : null}
      {loading ? '...' : label}
    </button>
  );
}
