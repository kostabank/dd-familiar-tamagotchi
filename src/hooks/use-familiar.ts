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

export function useFamiliar() {
  const { familiar, setFamiliar, setEvolving, setShowMiniGame, setShowEvolutionModal, setBuffs, triggerPetEffect, triggerCelebration } = useStore();

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
      sound.play('error');
      toast.error(data.error || 'Не удалось покормить');
      return;
    }
    setFamiliar(data.familiar);
    sound.play('feed');
    announceAchievements(data.newAchievements, triggerCelebration);
    announceQuestResult(data, triggerCelebration);
    toast.success('Фамильяр накормлен', { description: `+энергия, +настроение` });
  }, [setFamiliar, triggerCelebration]);

  const pet = useCallback(async () => {
    const res = await fetch('/api/familiar/pet', { method: 'POST', credentials: 'same-origin' });
    const data = await res.json();
    if (!res.ok) {
      sound.play('error');
      toast.error(data.error || 'Не удалось погладить', { description: res.status === 429 ? undefined : undefined });
      return;
    }
    setFamiliar(data.familiar);
    triggerPetEffect();
    sound.play('pet');
    announceAchievements(data.newAchievements, triggerCelebration);
    announceQuestResult(data, triggerCelebration);
    toast('Фамильяр мурлычет от ласки', { description: `+${3} настроение` });
  }, [setFamiliar, triggerPetEffect, triggerCelebration]);

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
    setFamiliar(data.familiar);
    sound.play('play');
    announceAchievements(data.newAchievements, triggerCelebration);
    announceQuestResult(data, triggerCelebration);
    if (data.success) {
      toast.success('Победа в мини-игре!', { description: `+${data.moodGain} настроение, +${data.coins} монет` });
    } else {
      toast('Игра сыграна', { description: `+${data.moodGain} настроение` });
    }
    return data;
  }, [setFamiliar, triggerCelebration]);

  const sleep = useCallback(async () => {
    const res = await fetch('/api/familiar/sleep', { method: 'POST', credentials: 'same-origin' });
    const data = await res.json();
    if (!res.ok) {
      sound.play('error');
      toast.error(data.error || 'Не удалось уложить спать');
      return;
    }
    setFamiliar(data.familiar);
    sound.play('sleep');
    toast.success('Фамильяр уснул', { description: 'Проснётся через 4 часа (реальное время)' });
  }, [setFamiliar]);

  const wake = useCallback(async () => {
    const res = await fetch('/api/familiar/wake', { method: 'POST', credentials: 'same-origin' });
    const data = await res.json();
    if (!res.ok) {
      sound.play('error');
      toast.error(data.error || 'Не удалось разбудить');
      return;
    }
    setFamiliar(data.familiar);
    sound.play('wake');
    toast.success('Фамильяр проснулся');
  }, [setFamiliar]);

  const claimBuff = useCallback(async () => {
    const res = await fetch('/api/familiar/claim-buff', { method: 'POST', credentials: 'same-origin' });
    const data = await res.json();
    if (!res.ok) {
      sound.play('error');
      toast.error(data.error || 'Не удалось получить бафф');
      return null;
    }
    setFamiliar(data.familiar);
    setBuffs(data.buffs);
    sound.play('quest');
    announceAchievements(data.newAchievements, triggerCelebration);
    announceQuestResult(data, triggerCelebration);
    toast.success('Бафф дня получен!', { description: `+15 монет, бафф активирован на сегодня` });
    return data;
  }, [setFamiliar, setBuffs, triggerCelebration]);

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
    setFamiliar(data.familiar);
    // Let the 3D evolution animation play for ~2s before clearing.
    setTimeout(() => setEvolving(false), 2200);
    sound.play('evolve');
    announceAchievements(data.newAchievements, triggerCelebration);
    announceQuestResult(data, triggerCelebration);
    toast.success(`Эволюция: ${data.pathName}!`, {
      description: `Скрытый бафф раскрыт: ${data.revealedBuff}`,
    });
    return data;
  }, [setFamiliar, setEvolving, setShowEvolutionModal, triggerCelebration]);

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

