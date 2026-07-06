'use client';

import { useCallback } from 'react';
import { useStore } from '@/lib/store';
import { toast } from 'sonner';
import type { FamiliarDTO, BuffSummary, InteractionLogDTO } from '@/lib/types';

export function useFamiliar() {
  const { familiar, setFamiliar, setEvolving, setShowMiniGame, setShowEvolutionModal, setBuffs, triggerPetEffect } = useStore();

  const refresh = useCallback(async () => {
    const res = await fetch('/api/familiar', { credentials: 'same-origin' });
    if (res.ok) {
      const data = await res.json();
      setFamiliar(data.familiar as FamiliarDTO);
    }
  }, [setFamiliar]);

  const refreshBuffs = useCallback(async () => {
    const res = await fetch('/api/familiar/buffs', { credentials: 'same-origin' });
    if (res.ok) {
      const data = await res.json();
      setBuffs(data as BuffSummary);
    }
  }, [setBuffs]);

  const feed = useCallback(async () => {
    const res = await fetch('/api/familiar/feed', { method: 'POST', credentials: 'same-origin' });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || 'Не удалось покормить');
      return;
    }
    setFamiliar(data.familiar);
    toast.success('Фамильяр накормлен', { description: `+энергия, +настроение` });
  }, [setFamiliar]);

  const pet = useCallback(async () => {
    const res = await fetch('/api/familiar/pet', { method: 'POST', credentials: 'same-origin' });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || 'Не удалось погладить', { description: res.status === 429 ? undefined : undefined });
      return;
    }
    setFamiliar(data.familiar);
    triggerPetEffect();
    toast('Фамильяр мурлычет от ласки', { description: `+${3} настроение` });
  }, [setFamiliar, triggerPetEffect]);

  const play = useCallback(async (score: number, target: number) => {
    const res = await fetch('/api/familiar/play', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score, target }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || 'Не удалось поиграть');
      return null;
    }
    setFamiliar(data.familiar);
    if (data.success) {
      toast.success('Победа в мини-игре!', { description: `+${data.moodGain} настроение, +${data.coins} монет` });
    } else {
      toast('Игра сыграна', { description: `+${data.moodGain} настроение` });
    }
    return data;
  }, [setFamiliar]);

  const sleep = useCallback(async () => {
    const res = await fetch('/api/familiar/sleep', { method: 'POST', credentials: 'same-origin' });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || 'Не удалось уложить спать');
      return;
    }
    setFamiliar(data.familiar);
    toast.success('Фамильяр уснул', { description: 'Проснётся через 4 часа (реальное время)' });
  }, [setFamiliar]);

  const wake = useCallback(async () => {
    const res = await fetch('/api/familiar/wake', { method: 'POST', credentials: 'same-origin' });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || 'Не удалось разбудить');
      return;
    }
    setFamiliar(data.familiar);
    toast.success('Фамильяр проснулся');
  }, [setFamiliar]);

  const claimBuff = useCallback(async () => {
    const res = await fetch('/api/familiar/claim-buff', { method: 'POST', credentials: 'same-origin' });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || 'Не удалось получить бафф');
      return null;
    }
    setFamiliar(data.familiar);
    setBuffs(data.buffs);
    toast.success('Бафф дня получен!', { description: `+15 монет, бафф активирован на сегодня` });
    return data;
  }, [setFamiliar, setBuffs]);

  const fetchEvolutionOptions = useCallback(async () => {
    const res = await fetch('/api/familiar/evolution-options', { credentials: 'same-origin' });
    if (!res.ok) return [];
    const data = await res.json();
    return data.options || [];
  }, []);

  const fetchLogs = useCallback(async (): Promise<InteractionLogDTO[]> => {
    const res = await fetch('/api/familiar/logs', { credentials: 'same-origin' });
    if (!res.ok) return [];
    const data = await res.json();
    return data.logs || [];
  }, []);

  const evolve = useCallback(async (optionId: string) => {
    setEvolving(true);
    setShowEvolutionModal(false);
    const res = await fetch('/api/familiar/evolve', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ optionId }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || 'Эволюция не удалась');
      setEvolving(false);
      return null;
    }
    setFamiliar(data.familiar);
    // Let the 3D evolution animation play for ~2s before clearing.
    setTimeout(() => setEvolving(false), 2200);
    toast.success(`Эволюция: ${data.pathName}!`, {
      description: `Скрытый бафф раскрыт: ${data.revealedBuff}`,
    });
    return data;
  }, [setFamiliar, setEvolving, setShowEvolutionModal]);

  return {
    familiar,
    refresh,
    refreshBuffs,
    feed,
    pet,
    play,
    sleep,
    wake,
    claimBuff,
    fetchEvolutionOptions,
    fetchLogs,
    evolve,
    setShowMiniGame,
    setShowEvolutionModal,
  };
}

