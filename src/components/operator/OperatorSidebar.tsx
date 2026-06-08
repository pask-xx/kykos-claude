'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  Home, ClipboardList, Package, Heart, FileText, PackageOpen,
  Users, Gift, Handshake, QrCode, AlertTriangle, User, Settings,
  Map, type LucideIcon,
} from 'lucide-react';
import { OperatorPermission } from '@/types';
import { hasPermission as checkPermission } from '@/lib/permissions';
import NotificationBell from '@/components/NotificationBell';
import LogoutButton from '@/components/LogoutButton';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  permission?: OperatorPermission;
  streetOnly?: boolean;
  officeOnly?: boolean;
}

const allNavItems: NavItem[] = [
  { href: '/operator/dashboard', label: 'Dashboard', icon: Home },
  { href: '/operator/requests-entity', label: 'Richieste', icon: ClipboardList, permission: 'RECIPIENT_AUTHORIZE' },
  { href: '/operator/objects', label: 'Disponibilità', icon: Package, permission: 'OBJECT_RECEIVE' },
  { href: '/operator/availability', label: 'Distribuzione', icon: Package, permission: 'ORGANIZATION_ADMIN' },
  { href: '/operator/cause', label: 'Cause', icon: Heart, permission: 'ORGANIZATION_ADMIN' },
  { href: '/operator/requests', label: 'Da approvare', icon: FileText, permission: 'RECIPIENT_AUTHORIZE' },
  { href: '/operator/deposit', label: 'In deposito', icon: PackageOpen, permission: 'OBJECT_RECEIVE' },
  { href: '/operator/recipients', label: 'Beneficiari', icon: Users, permission: 'RECIPIENT_AUTHORIZE' },
  { href: '/operator/donors', label: 'Donatori', icon: Gift, permission: 'RECIPIENT_AUTHORIZE' },
  { href: '/operator/volunteers', label: 'Volontari', icon: Handshake, permission: 'VOLUNTEER_MANAGE' },
  { href: '/operator/scan-qr', label: 'Scansione QR', icon: QrCode, permission: 'OBJECT_DELIVER' },
  { href: '/operator/reports', label: 'Segnalazioni', icon: AlertTriangle, permission: 'RECIPIENT_AUTHORIZE' },
  { href: '/operator/operators', label: 'Operatori', icon: User, permission: 'ORGANIZATION_ADMIN' },
  { href: '/operator/organization', label: 'Impostazioni ente', icon: Settings, permission: 'ORGANIZATION_ADMIN' },
  { href: '/operator/profile', label: 'Il mio profilo', icon: User },
  { href: '/operator/street-beneficiaries', label: 'Beneficiari street', icon: Users, streetOnly: true },
  { href: '/operator/street-to-deliver', label: 'Consegne e Ritiri', icon: Package, streetOnly: true },
  { href: '/operator/diocese-objects', label: 'Disponibilità diocesi', icon: Map, streetOnly: true },
];

interface OperatorSidebarProps {
  operatorRole: string;
  operatorPermissions: string[];
  operatorName: string;
  operatorProfileImageUrl: string | null;
  organizationName: string;
  isOfficeOperator: boolean;
  isStreetOperator: boolean;
  children: React.ReactNode;
}

export default function OperatorSidebar({
  operatorRole,
  operatorPermissions,
  operatorName,
  operatorProfileImageUrl,
  organizationName,
  isOfficeOperator,
  isStreetOperator,
  children,
}: OperatorSidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = allNavItems.filter(item => {
    // Filtra per tipo operatore
    if (item.streetOnly && !isStreetOperator) return false;
    if (item.officeOnly && !isOfficeOperator) return false;

    // Filtra per permesso
    if (!item.permission) return true;
    return checkPermission(operatorRole, operatorPermissions, item.permission);
  });

  return (
    <div className="min-h-[100svh] bg-gray-50">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`lg:hidden fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 flex flex-col z-50 transition-transform duration-300 ease-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <Link href="/operator/dashboard" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
            <img src="/albero.svg" alt="KYKOS" className="w-8 h-8" />
            <img src="/LogoKykosTesto.svg" alt="KYKOS" className="h-8" />
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700"
            aria-label="Chiudi menu"
          >
            <span aria-hidden="true">✕</span>
          </button>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;
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
                <Icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                <span className="font-medium truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden flex-shrink-0">
              {operatorProfileImageUrl ? (
                <img src={operatorProfileImageUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <User className="w-6 h-6 text-primary-700" aria-hidden="true" />
              )}
            </div>
            <div className="flex-1 min-w-0 truncate">
              <p className="text-sm font-medium text-gray-900 truncate">{operatorName}</p>
              <p className="text-xs text-gray-500 truncate">{operatorRole}</p>
            </div>
            <LogoutButton role="operator" />
          </div>
        </div>
      </aside>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-gray-200 flex-shrink-0 flex-col fixed left-0 top-0 h-full">
        <div className="p-4 border-b border-gray-200">
          <Link href="/operator/dashboard" className="flex items-center gap-2">
            <img src="/albero.svg" alt="KYKOS" className="w-8 h-8" />
            <img src="/LogoKykosTesto.svg" alt="KYKOS" className="h-8" />
          </Link>
          <p className="text-xs text-gray-500 mt-1 truncate">{organizationName}</p>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;
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
                <Icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                <span className="font-medium truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden flex-shrink-0">
              {operatorProfileImageUrl ? (
                <img src={operatorProfileImageUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <User className="w-6 h-6 text-primary-700" aria-hidden="true" />
              )}
            </div>
            <div className="flex-1 min-w-0 truncate">
              <p className="text-sm font-medium text-gray-900 truncate">{operatorName}</p>
              <p className="text-xs text-gray-500 truncate">{operatorRole}</p>
              <p className="text-xs text-gray-400 truncate">{organizationName}</p>
            </div>
            <LogoutButton role="operator" />
          </div>
        </div>
      </aside>

      {/* Mobile header with logo - centered */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 z-40">
        <button
          onClick={() => setMobileOpen(true)}
          className="w-10 h-10 flex items-center justify-center"
          aria-label="Apri menu"
        >
          <span className="text-xl" aria-hidden="true">☰</span>
        </button>
        <Link href="/operator/dashboard" className="flex items-center gap-3">
          <img src="/albero.svg" alt="KYKOS" className="h-14" />
          <img src="/LogoKykosTesto.svg" alt="KYKOS" className="h-14" />
        </Link>
        <NotificationBell apiPath="/api/operator/notifications" bellSize="sm" />
      </header>

      {/* Desktop Header */}
      <div className="hidden lg:flex h-14 bg-white border-b border-gray-200 items-center justify-end px-4">
        <NotificationBell apiPath="/api/operator/notifications" bellSize="sm" />
      </div>

      {/* Main Content */}
      <main className="min-h-[100svh] lg:ml-64 pt-14 lg:pt-0">
        <div className="px-4 sm:px-6 py-4 sm:py-6">
          {children}
        </div>
      </main>
    </div>
  );
}