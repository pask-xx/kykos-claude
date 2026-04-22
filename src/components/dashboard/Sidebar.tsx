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

interface SidebarProps {
  role: 'RECIPIENT' | 'DONOR' | 'INTERMEDIARY';
  userName: string;
  userEmail: string;
}

export default function Sidebar({ role, userName, userEmail }: SidebarProps) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);
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
    <aside
      className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-200 ease-out ${
        expanded ? 'w-64' : 'w-16'
      }`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Logo */}
      <div className={`p-3 border-b border-gray-200 flex items-center ${expanded ? 'justify-start' : 'justify-center'}`}>
        <Link href="/" className="flex items-center gap-2">
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
              <p className="text-xs text-gray-500 truncate">{userEmail}</p>
            </div>
            <form action="/api/auth/logout" method="POST" className="flex-shrink-0">
              <button type="submit" className="text-sm text-red-600 hover:text-red-700 ml-2">
                🚪
              </button>
            </form>
          </div>
        ) : (
          <form action="/api/auth/logout" method="POST">
            <button type="submit" className="text-xl text-red-600 hover:text-red-700">
              🚪
            </button>
          </form>
        )}
      </div>
    </aside>
  );
}
