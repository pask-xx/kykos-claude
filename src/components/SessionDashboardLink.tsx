'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface User {
  id: string;
  role: string;
}

interface Operator {
  id: string;
  role: string;
}

export default function SessionDashboardLink() {
  const [loading, setLoading] = useState(true);
  const [dashboardLink, setDashboardLink] = useState<{ href: string; label: string } | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/auth/me').then(res => res.json()),
      fetch('/api/operator/me').then(res => res.json()).catch(() => ({ operator: null })),
    ]).then(([userData, operatorData]) => {
      if (operatorData.operator) {
        setDashboardLink({ href: '/operator/dashboard', label: 'Dashboard Operatore' });
      } else if (userData.user) {
        const links: Record<string, { href: string; label: string }> = {
          DONOR: { href: '/donor/dashboard', label: 'Dashboard Donatore' },
          RECIPIENT: { href: '/recipient/dashboard', label: 'Dashboard Beneficiario' },
          INTERMEDIARY: { href: '/intermediary/dashboard', label: 'Dashboard Ente' },
        };
        const link = links[userData.user.role];
        if (link) setDashboardLink(link);
      }
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading || !dashboardLink) {
    return null;
  }

  return (
    <Link
      href={dashboardLink.href}
      className="px-4 py-2 bg-secondary-600 text-white rounded-lg hover:bg-secondary-700 font-medium transition"
    >
      {dashboardLink.label}
    </Link>
  );
}
