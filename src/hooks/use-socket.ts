'use client';

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useStore } from '@/lib/store';
import type { FamiliarDTO, PartyResonance } from '@/lib/types';

/**
 * Connects to the Socket.io mini-service (port 3003) once authenticated.
 * Listens for familiar:update, party:resonance, admin:event and updates the store.
 */
export function useSocket() {
  const { user, authed, setFamiliar, setPartyResonance, familiar } = useStore();
  const socketRef = useRef<Socket | null>(null);
  const familiarIdRef = useRef<string | null>(null);
  familiarIdRef.current = familiar?.id ?? null;

  useEffect(() => {
    if (!authed) return;
    const socket = io('/?XTransformPort=3003', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1500,
      timeout: 10000,
      forceNew: true,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('subscribe');
    });

    socket.on('familiar:update', (payload: { familiar: FamiliarDTO; userId: string }) => {
      if (payload?.familiar && payload.familiar.id === familiarIdRef.current) {
        setFamiliar(payload.familiar);
      }
    });

    socket.on('party:resonance', (r: PartyResonance) => {
      setPartyResonance(r);
    });

    socket.on('admin:event', (payload: { event: string; affected: number; timestamp: string }) => {
      // Toast handled by UI if needed; here we just rely on the stat refresh.
      if (typeof window !== 'undefined') {
        // Lightweight inline notification
        import('sonner').then(({ toast }) => {
          toast(`Глобальное событие: ${payload.event === 'storm' ? 'Магическая Буря' : 'Праздник'}`, {
            description: `Затронуто фамильяров: ${payload.affected}`,
          });
        });
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [authed, setFamiliar, setPartyResonance]);

  // Silence unused var warning for user (kept for context).
  void user;
}
