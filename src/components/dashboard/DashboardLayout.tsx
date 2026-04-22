'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import { Role } from '@prisma/client';

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: Role;
  userName: string;
}

export default function DashboardLayout({ children, role, userName }: DashboardLayoutProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar role={role as 'RECIPIENT' | 'DONOR' | 'INTERMEDIARY' | 'ADMIN'} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-primary-600">KYKOS</Link>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Ciao, {userName}</span>
              <form action="/api/auth/logout" method="POST">
                <button type="submit" className="text-sm text-red-600 hover:text-red-700">
                  Esci
                </button>
              </form>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
