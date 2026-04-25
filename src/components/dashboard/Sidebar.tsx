'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

const recipientNav: NavItem[] = [
  { href: '/recipient/dashboard', label: 'Dashboard', icon: '🏠' },
  { href: '/recipient/objects', label: 'Cerca disponibilità', icon: '📦' },
  { href: '/recipient/my-objects', label: 'Le mie disponibilità', icon: '🎁' },
  { href: '/recipient/requests', label: 'Le mie richieste', icon: '📝' },
  { href: '/manifesto', label: 'Manifesto', icon: '📜' },
  { href: '/recipient/profile', label: 'Il mio profilo', icon: '👤' },
];

const donorNav: NavItem[] = [
  { href: '/donor/dashboard', label: 'Dashboard', icon: '🏠' },
  { href: '/donor/objects', label: 'Le mie disponibilità', icon: '📦' },
  { href: '/manifesto', label: 'Manifesto', icon: '📜' },
  { href: '/donor/profile', label: 'Il mio profilo', icon: '👤' },
];

const intermediaryNav: NavItem[] = [
  { href: '/intermediary/dashboard', label: 'Dashboard', icon: '🏠' },
  { href: '/intermediary/requests', label: 'Richieste', icon: '📝' },
  { href: '/intermediary/objects', label: 'Disponibilità', icon: '📦' },
  { href: '/intermediary/recipients', label: 'Beneficiari', icon: '👥' },
  { href: '/intermediary/operators', label: 'Operatori', icon: '👤' },
  { href: '/manifesto', label: 'Manifesto', icon: '📜' },
  { href: '/intermediary/profile', label: 'Il mio profilo', icon: '👤' },
];

interface SidebarProps {
  role: 'RECIPIENT' | 'DONOR' | 'INTERMEDIARY';
  userName: string;
  userEmail: string;
}

const ROLE_LABELS: Record<string, string> = {
  DONOR: 'Donatore',
  RECIPIENT: 'Beneficiario',
  INTERMEDIARY: 'Ente',
};

function getDashboardHref(role: string): string {
  return `/${role.toLowerCase()}/dashboard`;
}

export default function Sidebar({ role, userName, userEmail }: SidebarProps) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const navItems = role === 'RECIPIENT' ? recipientNav
    : role === 'DONOR' ? donorNav
    : intermediaryNav;

  const handleMouseEnter = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setExpanded(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    timeoutRef.current = setTimeout(() => {
      setExpanded(false);
    }, 150);
  }, []);

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-white border border-gray-200 rounded-lg shadow-md flex items-center justify-center"
      >
        <span className="text-xl">☰</span>
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar (slides in) */}
      <aside
        className={`lg:hidden fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 flex flex-col z-50 transition-transform duration-300 ease-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="p-3 border-b border-gray-200 flex items-center justify-between">
          <Link href={getDashboardHref(role)} className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
            <img src="/albero.svg" alt="KYKOS" className="w-8 h-8 flex-shrink-0" />
            <span className="text-xl font-bold text-primary-600">KYKOS</span>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className="text-xl flex-shrink-0">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User info */}
        <div className="p-3 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{userName}</p>
              <p className="text-xs text-gray-500 truncate">{ROLE_LABELS[role]}</p>
              <p className="text-xs text-gray-400 truncate">{userEmail}</p>
            </div>
            <form action="/api/auth/logout" method="POST">
              <button type="submit" className="text-sm text-red-600 hover:text-red-700 ml-2">
                🚪
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex fixed left-0 top-0 h-full w-16 bg-white border-r border-gray-200 flex-col z-50 transition-all duration-200 ease-out ${
          expanded ? 'w-64' : 'w-16'
        }`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Logo */}
        <div className={`p-3 border-b border-gray-200 flex items-center ${expanded ? 'justify-start' : 'justify-center'}`}>
          <Link href={getDashboardHref(role)} className="flex items-center gap-2">
            <img src="/albero.svg" alt="KYKOS" className="w-8 h-8 flex-shrink-0" />
            {expanded && (
              <span className="text-xl font-bold text-primary-600 whitespace-nowrap">KYKOS</span>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-2 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-50'
                } ${expanded ? 'justify-start' : 'justify-center'}`}
                title={!expanded ? item.label : undefined}
              >
                <span className="text-xl flex-shrink-0">{item.icon}</span>
                {expanded && (
                  <span className="font-medium truncate">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User info */}
        <div className={`p-3 border-t border-gray-200 ${expanded ? 'justify-start' : 'justify-center'}`}>
          {expanded ? (
            <div className="flex items-center justify-between">
              <div className="truncate min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{userName}</p>
                <p className="text-xs text-gray-500 truncate">{ROLE_LABELS[role]}</p>
                <p className="text-xs text-gray-400 truncate">{userEmail}</p>
              </div>
              <form action="/api/auth/logout" method="POST" className="flex-shrink-0">
                <button type="submit" className="text-sm text-red-600 hover:text-red-700 ml-2">
                  🚪
                </button>
              </form>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <span className="text-xs text-gray-500 mb-1">👤</span>
              <form action="/api/auth/logout" method="POST">
                <button type="submit" className="text-xl text-red-600 hover:text-red-700">
                  🚪
                </button>
              </form>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
