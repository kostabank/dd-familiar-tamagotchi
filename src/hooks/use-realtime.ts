'use client';

import { useEffect, useRef } from 'react';
import { supabase, isSupabaseEnabled } from '@/lib/supabase';
import { useStore } from '@/lib/store';
import { sound } from '@/lib/sound';
import type { FamiliarDTO, PartyResonance } from '@/lib/types';

/**
 * Real-time hook — uses Supabase Realtime in production, falls back to
 * polling (every 15s) in local dev without Supabase env vars.
 * Listens for: familiar:update, party:resonance, admin:event.
 * Detects gift receipts (mood+sync increase) and fires chime + celebration.
 */
export function useRealtime() {
  const { authed, setFamiliar, setPartyResonance, familiar, triggerPetEffect, triggerCelebration } = useStore();
  const familiarIdRef = useRef<string | null>(null);
  const prevStatsRef = useRef<{ mood: number; sync: number } | null>(null);
  const lastActionAtRef = useRef<number>(0);
  familiarIdRef.current = familiar?.id ?? null;
  prevStatsRef.current = familiar ? { mood: familiar.mood, sync: familiar.sync } : null;

  useEffect(() => {
    if (!authed) return;

    if (isSupabaseEnabled && supabase) {
      // --- Supabase Realtime mode ---
      const famChannel = supabase
        .channel('familiars')
        .on('broadcast', { event: 'familiar:update' }, (payload: { payload: { familiar: FamiliarDTO; userId: string } }) => {
          const next = payload.payload?.familiar;
          if (next && next.id === familiarIdRef.current) {
            handleFamiliarUpdate(next);
          }
        })
        .subscribe();

      const partyChannel = supabase
        .channel('party')
        .on('broadcast', { event: 'party:resonance' }, (payload: { payload: PartyResonance }) => {
          if (payload.payload) setPartyResonance(payload.payload);
        })
        .on('broadcast', { event: 'admin:event' }, (payload: { payload: { event: string; affected: number } }) => {
          if (typeof window !== 'undefined') {
            import('sonner').then(({ toast }) => {
              toast(`Глобальное событие: ${payload.payload.event === 'storm' ? 'Магическая Буря' : 'Праздник'}`, {
                description: `Затронуто фамильяров: ${payload.payload.affected}`,
              });
            });
          }
        })
        .subscribe();

      return () => {
        supabase.removeChannel(famChannel);
        supabase.removeChannel(partyChannel);
      };
    }

    // --- Polling fallback (local dev without Supabase) ---
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch('/api/familiar', { credentials: 'same-origin' });
        if (res.ok) {
          const data = await res.json();
          if (data.familiar) handleFamiliarUpdate(data.familiar);
        }
        // Also refresh party resonance via buffs endpoint.
        const buffsRes = await fetch('/api/familiar/buffs', { credentials: 'same-origin' });
        if (buffsRes.ok) {
          const buffs = await buffsRes.json();
          if (buffs.partyResonance) setPartyResonance(buffs.partyResonance);
        }
      } catch {
        /* noop */
      }
    }, 15000);

    return () => clearInterval(pollInterval);
  }, [authed, setFamiliar, setPartyResonance, triggerPetEffect, triggerCelebration]);

  function handleFamiliarUpdate(next: FamiliarDTO) {
    const prev = prevStatsRef.current;
    // Detect gift receipt: mood >=5 AND sync >=1, not within 1.5s of own action.
    const sinceLastAction = Date.now() - lastActionAtRef.current;
    if (prev && sinceLastAction > 1500) {
      const moodDelta = next.mood - prev.mood;
      const syncDelta = next.sync - prev.sync;
      if (moodDelta >= 5 && syncDelta >= 1) {
        sound.playGiftChime();
        triggerCelebration('🎁', 'Получен подарок!', '#ec4899');
        import('sonner').then(({ toast }) => {
          toast.success('🎁 Твоему фамильяру подарили подарок!', {
            description: `+${moodDelta} настроение, +${syncDelta} синхронизация`,
            duration: 6000,
          });
        });
        triggerPetEffect();
      }
    }
    prevStatsRef.current = { mood: next.mood, sync: next.sync };
    setFamiliar(next);
  }
}
