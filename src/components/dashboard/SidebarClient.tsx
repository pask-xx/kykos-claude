'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

const recipientNav: NavItem[] = [
  { href: '/recipient/dashboard', label: 'Dashboard', icon: '🏠' },
  { href: '/recipient/objects', label: 'Sfoglia oggetti', icon: '📦' },
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

interface SidebarProps {
  role: 'RECIPIENT' | 'DONOR' | 'INTERMEDIARY';
  userName: string;
}

export default function SidebarClient({ role, userName }: SidebarProps) {
  const pathname = usePathname();

  const navItems = role === 'RECIPIENT' ? recipientNav
    : role === 'DONOR' ? donorNav
    : intermediaryNav;

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex-shrink-0">
        <div className="p-4 border-b border-gray-200">
          <Link href="/" className="text-2xl font-bold text-primary-600">KYKOS</Link>
        </div>
        <nav className="p-3 space-y-1">
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
                {/* Tooltip */}
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity hidden lg:block">
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-200 mt-auto">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 truncate">{userName}</span>
            <form action="/auth/logout" method="POST">
              <button type="submit" className="text-sm text-red-600 hover:text-red-700">
                Esci
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Page header placeholder for consistent spacing */}
        <div className="h-16 bg-white border-b border-gray-200 lg:hidden" />

        {/* Content slot - pages will render here */}
        <div className="flex-1 p-6 overflow-auto">
          {/* This component serves as the layout wrapper */}
        </div>
      </div>
    </div>
  );
}
