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

const adminNav: NavItem[] = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: '🏠' },
  { href: '/admin/intermediaries', label: 'Intermediari', icon: '🏢' },
  { href: '/admin/profile', label: 'Il mio profilo', icon: '👤' },
];

interface SidebarProps {
  role: 'RECIPIENT' | 'DONOR' | 'INTERMEDIARY' | 'ADMIN';
  collapsed?: boolean;
}

export default function Sidebar({ role, collapsed = false }: SidebarProps) {
  const pathname = usePathname();

  const navItems = role === 'RECIPIENT' ? recipientNav
    : role === 'DONOR' ? donorNav
    : role === 'INTERMEDIARY' ? intermediaryNav
    : adminNav;

  return (
    <aside className={`bg-white border-r border-gray-200 h-full transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`}>
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
              {!collapsed && (
                <span className="font-medium truncate">{item.label}</span>
              )}
              {/* Tooltip for collapsed state */}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                  {item.label}
                </div>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
