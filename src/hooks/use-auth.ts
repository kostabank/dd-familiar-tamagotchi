'use client';

import { useEffect } from 'react';
import { useStore } from '@/lib/store';

export function useAuth() {
  const { user, familiar, authed, authLoading, setAuth, setAuthLoading, logout } = useStore();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'same-origin' });
        if (!res.ok) {
          if (!cancelled) setAuth(null, null);
          return;
        }
        const data = await res.json();
        if (!cancelled) setAuth(data.user, data.familiar);
      } catch {
        if (!cancelled) setAuth(null, null);
      } finally {
        if (!cancelled) setAuthLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const doLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
    } catch {
      /* noop */
    }
    logout();
  };

  return { user, familiar, authed, authLoading, doLogout };
}
