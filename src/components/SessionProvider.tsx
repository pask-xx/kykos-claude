'use client';

import { createContext, useContext, useEffect, useState } from 'react';

interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: 'DONOR' | 'RECIPIENT' | 'INTERMEDIARY' | 'ADMIN';
}

interface SessionContextType {
  user: SessionUser | null;
  loading: boolean;
}

const SessionContext = createContext<SessionContextType>({ user: null, loading: true });

export function useSession() {
  return useContext(SessionContext);
}

export default function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
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

  return (
    <SessionContext.Provider value={{ user, loading }}>
      {children}
    </SessionContext.Provider>
  );
}
