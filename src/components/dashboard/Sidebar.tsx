'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import LogoutButton from '@/components/LogoutButton';
import ManifestoModal from '@/components/ManifestoModal';

interface NavItem {
  href: string;
  label: string;
  icon: string;
  isManifesto?: boolean;
  badge?: number;
}

const recipientNavBase: NavItem[] = [
  { href: '/recipient/dashboard', label: 'Dashboard', icon: '🏠' },
  { href: '/recipient/objects', label: 'Cerca disponibilità', icon: '📦' },
  { href: '/recipient/my-objects', label: 'Le mie disponibilità', icon: '🎁' },
  { href: '/recipient/requests-entity/requests', label: 'Richieste', icon: '📝' },
  { href: '/manifesto', label: 'Manifesto', icon: '📜', isManifesto: true },
  { href: '/recipient/profile', label: 'Il mio profilo', icon: '👤' },
];

const donorNavBase: NavItem[] = [
  { href: '/donor/dashboard', label: 'Richieste', icon: '📋' },
  { href: '/donor/objects', label: 'Le mie disponibilità', icon: '📦' },
  { href: '/donor/requests', label: 'Le mie donazioni', icon: '🎁' },
  { href: '/donor/statistics', label: 'Statistiche', icon: '📊' },
  { href: '/manifesto', label: 'Manifesto', icon: '📜', isManifesto: true },
  { href: '/donor/profile', label: 'Il mio profilo', icon: '👤' },
];

const intermediaryNav: NavItem[] = [
  { href: '/intermediary/dashboard', label: 'Dashboard', icon: '🏠' },
  { href: '/intermediary/requests', label: 'Richieste', icon: '📝' },
  { href: '/intermediary/objects', label: 'Disponibilità', icon: '📦' },
  { href: '/intermediary/recipients', label: 'Beneficiari', icon: '👥' },
  { href: '/intermediary/operators', label: 'Operatori', icon: '👤' },
  { href: '/manifesto', label: 'Manifesto', icon: '📜', isManifesto: true },
  { href: '/intermediary/profile', label: 'Il mio profilo', icon: '👤' },
];

const adminNav: NavItem[] = [
  { href: '/admin/dashboard', label: 'Enti', icon: '🏢' },
  { href: '/admin/intermediaries/new', label: 'Nuovo Ente', icon: '➕' },
  { href: '/admin/legal', label: 'Documenti legali', icon: '📄' },
  { href: '/manifesto', label: 'Manifesto', icon: '📜', isManifesto: true },
];

interface SidebarProps {
  role: 'RECIPIENT' | 'DONOR' | 'INTERMEDIARY' | 'ADMIN';
  userName: string;
  userEmail: string;
  userProfileImageUrl?: string | null;
  hasApprovedVolunteer?: boolean;
  pendingDeliveryCount?: number;
}

const ROLE_LABELS: Record<string, string> = {
  DONOR: 'Donatore',
  RECIPIENT: 'Beneficiario',
  INTERMEDIARY: 'Ente',
  ADMIN: 'Amministratore',
};

function getDashboardHref(role: string): string {
  return `/${role.toLowerCase()}/dashboard`;
}

function buildNavItems(role: 'RECIPIENT' | 'DONOR' | 'INTERMEDIARY' | 'ADMIN', hasApprovedVolunteer: boolean, pendingDeliveryCount: number = 0): NavItem[] {
  const volunteerItem: NavItem = hasApprovedVolunteer
    ? { href: '/volunteer', label: 'Volontariato', icon: '🤝' }
    : { href: '/volunteer/apply', label: 'Diventa Volontario', icon: '🤝' };

  if (role === 'RECIPIENT') {
    const toDeliverItem: NavItem = {
      href: '/recipient/to-deliver-and-pickup',
      label: 'Consegne e Ritiri',
      icon: '📦',
      badge: pendingDeliveryCount,
    };
    return [...recipientNavBase, toDeliverItem, volunteerItem];
  }
  if (role === 'DONOR') {
    const toDeliverItem: NavItem = {
      href: '/donor/to-deliver',
      label: 'Da consegnare',
      icon: '📦',
      badge: pendingDeliveryCount,
    };
    return [...donorNavBase, toDeliverItem, volunteerItem];
  }
  // For INTERMEDIARY and ADMIN, return as-is (no volunteer item in nav)
  return role === 'INTERMEDIARY' ? intermediaryNav : adminNav;
}

export default function Sidebar({ role, userName, userEmail, userProfileImageUrl, hasApprovedVolunteer = false, pendingDeliveryCount = 0 }: SidebarProps) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showManifesto, setShowManifesto] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const navItems = buildNavItems(role, hasApprovedVolunteer, pendingDeliveryCount);

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
            <img src="/LogoKykosTesto.svg" alt="KYKOS" className="h-8" />
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

            if (item.isManifesto) {
              return (
                <button
                  key={item.href}
                  onClick={() => {
                    setMobileOpen(false);
                    setShowManifesto(true);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors text-gray-600 hover:bg-gray-50`}
                >
                  <span className="text-xl flex-shrink-0">{item.icon}</span>
                  {item.badge && item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`relative flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className="text-xl flex-shrink-0">{item.icon}</span>
                {item.badge && item.badge > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User info */}
        <div className="p-3 border-t border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden flex-shrink-0">
              {userProfileImageUrl ? (
                <img src={userProfileImageUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-lg">👤</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{userName}</p>
              <p className="text-xs text-gray-500 truncate">{ROLE_LABELS[role]}</p>
              <p className="text-xs text-gray-400 truncate">{userEmail}</p>
            </div>
            <LogoutButton role="user" />
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
              <img src="/LogoKykosTesto.svg" alt="KYKOS" className="h-8" />
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

            if (item.isManifesto) {
              return (
                <button
                  key={item.href}
                  onClick={() => setShowManifesto(true)}
                  className={`w-full flex items-center gap-3 px-2 py-3 rounded-lg transition-colors text-gray-600 hover:bg-gray-50 ${expanded ? 'justify-start' : 'justify-center'}`}
                  title={!expanded ? item.label : undefined}
                >
                  {item.badge && item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                  <span className="text-xl flex-shrink-0">{item.icon}</span>
                  {expanded && (
                    <span className="font-medium truncate">{item.label}</span>
                  )}
                </button>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center gap-3 px-2 py-3 rounded-lg transition-colors ${
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
        <div className={`p-3 border-t border-gray-200 flex-shrink-0 ${expanded ? 'justify-start' : 'justify-center'}`}>
          {expanded ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                {userProfileImageUrl ? (
                  <img src={userProfileImageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-lg">👤</span>
                )}
              </div>
              <div className="truncate min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{userName}</p>
                <p className="text-xs text-gray-500 truncate">{ROLE_LABELS[role]}</p>
                <p className="text-xs text-gray-400 truncate">{userEmail}</p>
              </div>
              <LogoutButton role="user" />
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden mb-2">
                {userProfileImageUrl ? (
                  <img src={userProfileImageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-lg">👤</span>
                )}
              </div>
              <LogoutButton role="user" />
            </div>
          )}
        </div>
      </aside>

      {/* Manifesto Modal — montato sempre, controllato da isOpen */}
      <ManifestoModal isOpen={showManifesto} onClose={() => setShowManifesto(false)} />
    </>
  );
}
