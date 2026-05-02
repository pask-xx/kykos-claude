'use client';

import Link from 'next/link';
import Sidebar from './Sidebar';
import NotificationBell from '../NotificationBell';
import InstallAppBanner from '@/components/InstallAppBanner';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'DONOR' | 'RECIPIENT' | 'INTERMEDIARY' | 'ADMIN';
}

interface DashboardLayoutClientProps {
  children: React.ReactNode;
  user: User | null;
  hasApprovedVolunteer?: boolean;
}

export default function DashboardLayoutClient({ children, user, hasApprovedVolunteer = false }: DashboardLayoutClientProps) {
  if (!user) return null;

  const showNotificationBell = ['RECIPIENT', 'DONOR', 'INTERMEDIARY'].includes(user.role);
  const notificationApiPath = user?.role === 'DONOR'
    ? '/api/donor/notifications'
    : user?.role === 'INTERMEDIARY'
    ? '/api/operator/notifications'
    : '/api/notifications';

  return (
    <div className="min-h-[100dvh] bg-gray-50">
      {/* Fixed floating sidebar */}
      <Sidebar
        role={user.role as 'RECIPIENT' | 'DONOR' | 'INTERMEDIARY' | 'ADMIN'}
        userName={user.name}
        userEmail={user.email}
        hasApprovedVolunteer={hasApprovedVolunteer}
      />

      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-200 flex items-center justify-center px-4 z-40">
        <Link href="/" className="flex items-center gap-3">
          <img src="/LogoKykosTesto.svg" alt="KYKOS" className="h-10" />
        </Link>
        {showNotificationBell && (
          <div className="absolute right-4">
            <NotificationBell apiPath={notificationApiPath} bellSize="sm" />
          </div>
        )}
      </header>

      {/* Desktop top bar */}
      <header className="hidden lg:flex fixed top-0 left-16 right-0 h-14 bg-white border-b border-gray-200 items-center justify-center px-6 z-40">
        <Link href="/" className="flex items-center gap-3">
          <img src="/LogoKykosTesto.svg" alt="KYKOS" className="h-10" />
        </Link>
        {showNotificationBell && (
          <div className="absolute right-20">
            <NotificationBell apiPath={notificationApiPath} bellSize="md" />
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="min-h-[100dvh] lg:pl-16 pt-14 lg:pt-14">
        <div className="px-6 py-6">
          <div className="hidden lg:block">
            <InstallAppBanner />
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
