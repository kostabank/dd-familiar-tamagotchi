'use client';

import { useCallback } from 'react';
import { useStore } from '@/lib/store';
import { toast } from 'sonner';
import { sound } from '@/lib/sound';
import type { FamiliarDTO, BuffSummary, InteractionLogDTO } from '@/lib/types';
import type { AchievementDTO, PlayerQuestDTO } from '@/lib/familiar-logic';

/** Show a celebratory toast for each newly-unlocked achievement. */
function announceAchievements(achievements: AchievementDTO[] | undefined, triggerCelebration?: (emoji: string, label: string, color: string) => void) {
  if (!achievements || achievements.length === 0) return;
  for (const a of achievements) {
    const reward = a.tier === 'gold' ? 150 : a.tier === 'silver' ? 50 : 20;
    sound.play('achievement');
    const color = a.tier === 'gold' ? '#fbbf24' : a.tier === 'silver' ? '#cbd5e1' : '#b45309';
    triggerCelebration?.(a.icon, `Достижение: ${a.title}`, color);
    toast.success(`🏆 Достижение: ${a.title}`, {
      description: `${a.icon} ${a.description} · +${reward} монет`,
      duration: 6000,
    });
  }
}

/** Show a toast for quest completion + rewards. */
function announceQuestResult(
  result: { questCompleted?: boolean; questReward?: { sync: number; coins: number } | null; quest?: PlayerQuestDTO | null } | undefined,
  triggerCelebration?: (emoji: string, label: string, color: string) => void,
) {
  if (!result) return;
  if (result.questCompleted && result.questReward) {
    sound.play('quest');
    triggerCelebration?.('✅', `Квест выполнен!`, '#22c55e');
    toast.success(`✅ Квест выполнен: ${result.quest?.title}`, {
      description: `Награда: +${result.questReward.sync} синхр., +${result.questReward.coins} монет`,
      duration: 7000,
    });
  }
}

const STAT_LABELS: Record<string, { ru: string; color: string }> = {
  energy: { ru: 'Энергия', color: '#22c55e' },
  mood: { ru: 'Настроение', color: '#eab308' },
  fatigue: { ru: 'Усталость', color: '#a855f7' },
  health: { ru: 'Здоровье', color: '#ef4444' },
  sync: { ru: 'Синхр.', color: '#3b82f6' },
  coins: { ru: 'Монеты', color: '#fbbf24' },
};

/** Compute the deltas between two familiars and emit floating indicators. */
function emitDeltas(
  prev: FamiliarDTO | null,
  next: FamiliarDTO,
  push: (items: { label: string; color: string }[]) => void,
) {
  if (!prev) return;
  const items: { label: string; color: string }[] = [];
  for (const key of Object.keys(STAT_LABELS)) {
    const k = key as keyof typeof STAT_LABELS;
    const before = (prev as unknown as Record<string, number>)[k] ?? 0;
    const after = (next as unknown as Record<string, number>)[k] ?? 0;
    const delta = after - before;
    if (delta !== 0) {
      const meta = STAT_LABELS[k];
      const sign = delta > 0 ? '+' : '';
      // Fatigue going UP is bad → red tint; going DOWN is good → green tint.
      let color = meta.color;
      if (k === 'fatigue') color = delta > 0 ? '#ef4444' : '#22c55e';
      items.push({ label: `${sign}${delta} ${meta.ru}`, color });
    }
  }
  push(items);
}

export function useFamiliar() {
  const familiar = useStore((s) => s.familiar);
  const setFamiliar = useStore((s) => s.setFamiliar);
  const setEvolving = useStore((s) => s.setEvolving);
  const setShowMiniGame = useStore((s) => s.setShowMiniGame);
  const setShowEvolutionModal = useStore((s) => s.setShowEvolutionModal);
  const setBuffs = useStore((s) => s.setBuffs);
  const triggerPetEffect = useStore((s) => s.triggerPetEffect);
  const triggerCelebration = useStore((s) => s.triggerCelebration);
  const pushFloatingChanges = useStore((s) => s.pushFloatingChanges);

  const applyFamiliar = useCallback((next: FamiliarDTO) => {
    // Diff against the current familiar in the store, emit floating indicators,
    // then persist the new familiar.
    emitDeltas(useStore.getState().familiar, next, pushFloatingChanges);
    setFamiliar(next);
  }, [setFamiliar, pushFloatingChanges]);

  const refresh = useCallback(async () => {
    const res = await fetch('/api/familiar', { credentials: 'same-origin' });
    if (res.ok) {
      const data = await res.json();
      applyFamiliar(data.familiar as FamiliarDTO);
    }
  }, [applyFamiliar]);

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
      sound.play('error');
      toast.error(data.error || 'Не удалось покормить');
      return;
    }
    applyFamiliar(data.familiar);
    sound.play('feed');
    announceAchievements(data.newAchievements, triggerCelebration);
    announceQuestResult(data, triggerCelebration);
    toast.success('Фамильяр накормлен', { description: `+энергия, +настроение` });
  }, [applyFamiliar, triggerCelebration]);

  const pet = useCallback(async () => {
    const res = await fetch('/api/familiar/pet', { method: 'POST', credentials: 'same-origin' });
    const data = await res.json();
    if (!res.ok) {
      sound.play('error');
      toast.error(data.error || 'Не удалось погладить');
      return;
    }
    applyFamiliar(data.familiar);
    triggerPetEffect();
    sound.play('pet');
    announceAchievements(data.newAchievements, triggerCelebration);
    announceQuestResult(data, triggerCelebration);
    toast('Фамильяр мурлычет от ласки', { description: `+${3} настроение` });
  }, [applyFamiliar, triggerPetEffect, triggerCelebration]);

  const play = useCallback(async (score: number, target: number) => {
    const res = await fetch('/api/familiar/play', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score, target }),
    });
    const data = await res.json();
    if (!res.ok) {
      sound.play('error');
      toast.error(data.error || 'Не удалось поиграть');
      return null;
    }
    applyFamiliar(data.familiar);
    sound.play('play');
    announceAchievements(data.newAchievements, triggerCelebration);
    announceQuestResult(data, triggerCelebration);
    if (data.success) {
      toast.success('Победа в мини-игре!', { description: `+${data.moodGain} настроение, +${data.coins} монет` });
    } else {
      toast('Игра сыграна', { description: `+${data.moodGain} настроение` });
    }
    return data;
  }, [applyFamiliar, triggerCelebration]);

  const sleep = useCallback(async () => {
    const res = await fetch('/api/familiar/sleep', { method: 'POST', credentials: 'same-origin' });
    const data = await res.json();
    if (!res.ok) {
      sound.play('error');
      toast.error(data.error || 'Не удалось уложить спать');
      return;
    }
    applyFamiliar(data.familiar);
    sound.play('sleep');
    toast.success('Фамильяр уснул', { description: 'Проснётся через 4 часа (реальное время)' });
  }, [applyFamiliar]);

  const wake = useCallback(async () => {
    const res = await fetch('/api/familiar/wake', { method: 'POST', credentials: 'same-origin' });
    const data = await res.json();
    if (!res.ok) {
      sound.play('error');
      toast.error(data.error || 'Не удалось разбудить');
      return;
    }
    applyFamiliar(data.familiar);
    sound.play('wake');
    toast.success('Фамильяр проснулся');
  }, [applyFamiliar]);

  const claimBuff = useCallback(async () => {
    const res = await fetch('/api/familiar/claim-buff', { method: 'POST', credentials: 'same-origin' });
    const data = await res.json();
    if (!res.ok) {
      sound.play('error');
      toast.error(data.error || 'Не удалось получить бафф');
      return null;
    }
    applyFamiliar(data.familiar);
    setBuffs(data.buffs);
    sound.play('quest');
    announceAchievements(data.newAchievements, triggerCelebration);
    announceQuestResult(data, triggerCelebration);
    toast.success('Бафф дня получен!', { description: `+15 монет, бафф активирован на сегодня` });
    return data;
  }, [applyFamiliar, setBuffs, triggerCelebration]);

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

  const fetchAchievements = useCallback(async (): Promise<{ achievements: AchievementDTO[]; unlockedCount: number; total: number }> => {
    const res = await fetch('/api/familiar/achievements', { credentials: 'same-origin' });
    if (!res.ok) return { achievements: [], unlockedCount: 0, total: 0 };
    return res.json();
  }, []);

  const fetchActiveQuest = useCallback(async (): Promise<PlayerQuestDTO | null> => {
    const res = await fetch('/api/familiar/quest', { credentials: 'same-origin' });
    if (!res.ok) return null;
    const data = await res.json();
    return data.quest || null;
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
      sound.play('error');
      toast.error(data.error || 'Эволюция не удалась');
      setEvolving(false);
      return null;
    }
    applyFamiliar(data.familiar);
    // Let the 3D evolution animation play for ~2s before clearing.
    setTimeout(() => setEvolving(false), 2200);
    sound.play('evolve');
    announceAchievements(data.newAchievements, triggerCelebration);
    announceQuestResult(data, triggerCelebration);
    toast.success(`Эволюция: ${data.pathName}!`, {
      description: `Скрытый бафф раскрыт: ${data.revealedBuff}`,
    });
    return data;
  }, [applyFamiliar, setEvolving, setShowEvolutionModal, triggerCelebration]);

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
    fetchAchievements,
    fetchActiveQuest,
    evolve,
    setShowMiniGame,
    setShowEvolutionModal,
  };
}
