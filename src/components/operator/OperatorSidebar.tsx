'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { OperatorPermission } from '@/types';
import NotificationBell from '@/components/NotificationBell';
import OperatorLogoutForm from '@/components/operator/OperatorLogoutForm';

interface NavItem {
  href: string;
  label: string;
  icon: string;
  permission?: OperatorPermission;
}

const allNavItems: NavItem[] = [
  { href: '/operator/dashboard', label: 'Dashboard', icon: '🏠' },
  { href: '/operator/requests', label: 'Richieste', icon: '📝', permission: 'RECIPIENT_AUTHORIZE' },
  { href: '/operator/recipients', label: 'Beneficiari', icon: '👥', permission: 'RECIPIENT_AUTHORIZE' },
  { href: '/operator/objects', label: 'Disponibilità', icon: '📦', permission: 'OBJECT_RECEIVE' },
  { href: '/operator/scan-qr', label: 'Scansiona QR', icon: '📱', permission: 'OBJECT_DELIVER' },
  { href: '/operator/reports', label: 'Segnalazioni', icon: '⚠️', permission: 'RECIPIENT_AUTHORIZE' },
  { href: '/operator/donors', label: 'Donatori', icon: '🎁', permission: 'RECIPIENT_AUTHORIZE' },
  { href: '/operator/requests-entity', label: 'Richieste ente', icon: '📋', permission: 'RECIPIENT_AUTHORIZE' },
  { href: '/operator/organization', label: 'Impostazioni ente', icon: '⚙️', permission: 'ORGANIZATION_ADMIN' },
  { href: '/operator/operators', label: 'Operatori', icon: '👤', permission: 'ORGANIZATION_ADMIN' },
  { href: '/operator/profile', label: 'Il mio profilo', icon: '👤' },
];

interface OperatorSidebarProps {
  operatorRole: string;
  operatorPermissions: string[];
  operatorName: string;
  organizationName: string;
  children: React.ReactNode;
}

export default function OperatorSidebar({
  operatorRole,
  operatorPermissions,
  operatorName,
  organizationName,
  children,
}: OperatorSidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const hasPermission = (permission: OperatorPermission): boolean => {
    if (operatorRole === 'ADMIN') return true;
    const rolePerms: Record<string, OperatorPermission[]> = {
      GESTORE_RICHIESTE: ['RECIPIENT_AUTHORIZE', 'REQUEST_PROXY'],
      GESTORE_OGGETTI: ['OBJECT_RECEIVE', 'OBJECT_DELIVER'],
      GESTORE_VOLONTARI: ['VOLUNTEER_MANAGE'],
      OPERATORE: [],
    };
    const defaultPerms = rolePerms[operatorRole] || [];
    return defaultPerms.includes(permission) || operatorPermissions.includes(permission);
  };

  const navItems = allNavItems.filter(item => {
    if (!item.permission) return true;
    return hasPermission(item.permission);
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-white border border-gray-200 rounded-lg shadow-md flex items-center justify-center"
        style={{ top: 'calc(1rem + env(safe-area-inset-top))' }}
      >
        <span className="text-xl">☰</span>
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40"
          style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`lg:hidden fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 flex flex-col z-50 transition-transform duration-300 ease-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <Link href="/operator/dashboard" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
            <img src="/albero.svg" alt="KYKOS" className="w-8 h-8" />
            <span className="text-xl font-bold text-primary-600">KYKOS</span>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
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
                <span className="font-medium truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-200 flex-shrink-0" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
          <div className="flex items-center justify-between">
            <div className="truncate">
              <p className="text-sm font-medium text-gray-900 truncate">{operatorName}</p>
              <p className="text-xs text-gray-500 truncate">{operatorRole}</p>
            </div>
            <OperatorLogoutForm />
          </div>
        </div>
      </aside>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-gray-200 flex-shrink-0 flex-col fixed left-0 top-0 h-full">
        <div className="p-4 border-b border-gray-200">
          <Link href="/operator/dashboard" className="flex items-center gap-2">
            <img src="/albero.svg" alt="KYKOS" className="w-8 h-8" />
            <span className="text-xl font-bold text-primary-600">KYKOS</span>
          </Link>
          <p className="text-xs text-gray-500 mt-1 truncate">{organizationName}</p>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className="text-xl flex-shrink-0">{item.icon}</span>
                <span className="font-medium truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="truncate">
              <p className="text-sm font-medium text-gray-900 truncate">{operatorName}</p>
              <p className="text-xs text-gray-500 truncate">{operatorRole}</p>
              <p className="text-xs text-gray-400 truncate">{organizationName}</p>
            </div>
            <OperatorLogoutForm />
          </div>
        </div>
      </aside>

      {/* Mobile header with logo - centered */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-200 flex items-center justify-center px-4 z-40 pt-[env(safe-area-inset-top)]">
        <Link href="/operator/dashboard" className="flex items-center gap-3">
          <img src="/albero.svg" alt="KYKOS" className="w-10 h-10" />
          <span className="text-2xl font-bold text-primary-600">KYKOS</span>
        </Link>
      </header>

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 pt-14 lg:pt-0" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {/* Top bar with notifications */}
        <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-end px-4" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
          <NotificationBell apiPath="/api/operator/notifications" bellSize="sm" />
        </div>
        <main className="p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}