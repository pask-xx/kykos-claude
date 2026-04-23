'use client';

import Link from 'next/link';
import Sidebar from './Sidebar';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'DONOR' | 'RECIPIENT' | 'INTERMEDIARY' | 'ADMIN';
}

interface DashboardLayoutClientProps {
  children: React.ReactNode;
  user: User | null;
}

export default function DashboardLayoutClient({ children, user }: DashboardLayoutClientProps) {
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

      {/* Mobile header with logo - centered */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-200 flex items-center justify-center px-4 z-40">
        <Link href="/" className="flex items-center gap-3">
          <img src="/albero.svg" alt="KYKOS" className="w-10 h-10" />
          <span className="text-2xl font-bold text-primary-600">KYKOS</span>
        </Link>
      </header>

      {/* Main content */}
      <main className="min-h-screen lg:pl-16 pt-14 lg:pt-0">
        {children}
      </main>
    </div>
  );
}
