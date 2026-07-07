'use client';

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useStore } from '@/lib/store';
import { sound } from '@/lib/sound';
import type { FamiliarDTO, PartyResonance } from '@/lib/types';

/**
 * Connects to the Socket.io mini-service (port 3003) once authenticated.
 * Listens for familiar:update, party:resonance, admin:event and updates the store.
 * Detects gift receipts (unexpected mood+sync increase) and fires a chime + toast.
 */
export function useSocket() {
  const { user, authed, setFamiliar, setPartyResonance, familiar, triggerPetEffect, triggerCelebration } = useStore();
  const socketRef = useRef<Socket | null>(null);
  const familiarIdRef = useRef<string | null>(null);
  const prevStatsRef = useRef<{ mood: number; sync: number } | null>(null);
  const lastActionAtRef = useRef<number>(0);
  familiarIdRef.current = familiar?.id ?? null;
  prevStatsRef.current = familiar ? { mood: familiar.mood, sync: familiar.sync } : null;

  // Track when our own actions fire (so we don't mistake them for gifts).
  const markOwnAction = () => { lastActionAtRef.current = Date.now(); };

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
        const prev = prevStatsRef.current;
        const next = payload.familiar;
        // Detect gift receipt: mood increased by ≥5 AND sync increased by ≥1,
        // and it's not within 1.5s of our own action (feed/play/pet write before socket echoes).
        const sinceLastAction = Date.now() - lastActionAtRef.current;
        if (prev && sinceLastAction > 1500) {
          const moodDelta = next.mood - prev.mood;
          const syncDelta = next.sync - prev.sync;
          if (moodDelta >= 5 && syncDelta >= 1) {
            // This is likely a gift receipt (not our own action).
            sound.playGiftChime();
            triggerCelebration('🎁', 'Получен подарок!', '#ec4899');
            import('sonner').then(({ toast }) => {
              toast.success('🎁 Твоему фамильяру подарили подарок!', {
                description: `+${moodDelta} настроение, +${syncDelta} синхронизация`,
                duration: 6000,
              });
            });
            triggerPetEffect(); // trigger heart burst in 3D
          }
        }
        prevStatsRef.current = { mood: next.mood, sync: next.sync };
        setFamiliar(next);
      }
    });

    socket.on('party:resonance', (r: PartyResonance) => {
      setPartyResonance(r);
    });

    socket.on('admin:event', (payload: { event: string; affected: number; timestamp: string }) => {
      if (typeof window !== 'undefined') {
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
  }, [authed, setFamiliar, setPartyResonance, triggerPetEffect, triggerCelebration]);

  // Silence unused var warning for user (kept for context).
  void user;
  void markOwnAction;
}
