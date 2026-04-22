'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

const recipientNav: NavItem[] = [
  { href: '/recipient/dashboard', label: 'Dashboard', icon: '🏠' },
  { href: '/recipient/browse', label: 'Sfoglia oggetti', icon: '📦' },
  { href: '/recipient/requests', label: 'Le mie richieste', icon: '📝' },
  { href: '/recipient/profile', label: 'Il mio profilo', icon: '👤' },
];

const donorNav: NavItem[] = [
  { href: '/donor/dashboard', label: 'Dashboard', icon: '🏠' },
  { href: '/donor/objects', label: 'I miei oggetti', icon: '📦' },
  { href: '/donor/profile', label: 'Il mio profilo', icon: '👤' },
];

const intermediaryNav: NavItem[] = [
  { href: '/intermediary/dashboard', label: 'Dashboard', icon: '🏠' },
  { href: '/intermediary/requests', label: 'Richieste', icon: '📝' },
  { href: '/intermediary/profile', label: 'Il mio profilo', icon: '👤' },
];

interface User {
  id: string;
  email: string;
  name: string;
  role: 'DONOR' | 'RECIPIENT' | 'INTERMEDIARY' | 'ADMIN';
}

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
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
      <div className="flex min-h-screen bg-gray-50 items-center justify-center">
        <p className="text-gray-500">Caricamento...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen bg-gray-50 items-center justify-center">
        <p className="text-gray-500">Sessione non trovata. <Link href="/auth/login" className="text-primary-600">Accedi</Link></p>
      </div>
    );
  }

  const navItems = user.role === 'RECIPIENT' ? recipientNav
    : user.role === 'DONOR' ? donorNav
    : user.role === 'INTERMEDIARY' ? intermediaryNav
    : [];

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex-shrink-0 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <Link href="/" className="text-2xl font-bold text-primary-600">KYKOS</Link>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors group relative ${
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className="text-xl flex-shrink-0">{item.icon}</span>
                <span className="font-medium truncate">{item.label}</span>
                {/* Tooltip on hover - desktop only */}
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity hidden lg:block">
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="truncate">
              <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
            <form action="/api/auth/logout" method="POST">
              <button type="submit" className="text-sm text-red-600 hover:text-red-700 ml-2">
                Esci
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
