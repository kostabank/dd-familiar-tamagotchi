'use client';

import { useEffect, useRef } from 'react';
import { useStore } from '@/lib/store';

/**
 * useAuth — manages auth state.
 *
 * On mount, calls /api/auth/me to check if the user has a valid session
 * cookie. Only does the INITIAL check once — does NOT re-check when child
 * components (AdminPanel/PlayerDashboard) also call useAuth, because those
 * would trigger redundant fetches and could bounce the user back to the
 * auth screen if /me is briefly unavailable.
 *
 * doLogout clears the cookie server-side + resets local state.
 */
export function useAuth() {
  const { user, familiar, authed, authLoading, setAuth, setAuthLoading, logout } = useStore();
  const didInitRef = useRef(false);

  useEffect(() => {
    // Only run the initial /me check ONCE per page load, even if multiple
    // components call useAuth(). This prevents the "login then bounce back"
    // bug where AdminPanel's useAuth re-fetches /me and resets state.
    if (didInitRef.current) return;
    didInitRef.current = true;

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
  }, [setAuth, setAuthLoading]);

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
