'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Sidebar from './Sidebar';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'DONOR' | 'RECIPIENT' | 'INTERMEDIARY' | 'ADMIN';
}

export default function DashboardLayoutClient({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Caricamento...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">
          Sessione non trovata.{' '}
          <Link href="/auth/login" className="text-primary-600 hover:underline">
            Accedi
          </Link>
        </p>
      </div>
    );
  }

  if (!['RECIPIENT', 'DONOR', 'INTERMEDIARY'].includes(user.role)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Ruolo non valido</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed floating sidebar */}
      <Sidebar
        role={user.role as 'RECIPIENT' | 'DONOR' | 'INTERMEDIARY'}
        userName={user.name}
        userEmail={user.email}
      />

      {/* Main content - takes full width, sidebar overlays */}
      <main className="min-h-screen pl-20">
        {children}
      </main>
    </div>
  );
}
