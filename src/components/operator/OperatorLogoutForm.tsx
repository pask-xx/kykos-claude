'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface OperatorLogoutFormProps {
  logoutUrl?: string;
}

export default function OperatorLogoutForm({ logoutUrl = '/api/operator/logout' }: OperatorLogoutFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    if (loading) return;
    setLoading(true);

    try {
      await fetch(logoutUrl, { method: 'GET' });
      router.push('/operator/login');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
    >
      {loading ? '...' : 'Esci'}
    </button>
  );
}
