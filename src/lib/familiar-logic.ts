import { DateTime } from 'luxon';
import { db } from './db';
import { GAME, clamp } from './constants';
import type { FamiliarDTO, FamiliarState, Species, BuffSummary, PartyResonance } from './types';

// All time math uses Europe/Moscow zone, as required.
const MOSCOW_ZONE = 'Europe/Moscow';

export function nowMoscow(): DateTime {
  return DateTime.now().setZone(MOSCOW_ZONE);
}

export function toMoscowISO(date: Date | string): string {
  const dt = typeof date === 'string' ? DateTime.fromISO(date, { zone: MOSCOW_ZONE }) : DateTime.fromJSDate(date, { zone: MOSCOW_ZONE });
  return dt.toISO()!;
}

/** Returns the current Moscow calendar day as 'yyyy-MM-dd'. */
export function todayMoscowDate(): string {
  return nowMoscow().toISODate();
}

/** Returns true if the player has already claimed their daily buff today (Moscow day). */
export async function getDailyClaimStatus(userId: string): Promise<{ claimedToday: boolean; lastClaimMsk: string | null; claimCount: number }> {
  const today = todayMoscowDate();
  const row = await db.dailyBuffClaim.findUnique({ where: { userId } });
  if (!row) return { claimedToday: false, lastClaimMsk: null, claimCount: 0 };
  return {
    claimedToday: row.lastClaimMsk === today,
    lastClaimMsk: row.lastClaimMsk,
    claimCount: row.claimCount,
  };
}

/** Records a daily buff claim for the player (upserts the row). */
export async function recordDailyClaim(userId: string): Promise<void> {
  const today = todayMoscowDate();
  const existing = await db.dailyBuffClaim.findUnique({ where: { userId } });
  if (existing) {
    await db.dailyBuffClaim.update({
      where: { userId },
      data: { lastClaimMsk: today, claimCount: { increment: 1 } },
    });
  } else {
    await db.dailyBuffClaim.create({
      data: { userId, lastClaimMsk: today, claimCount: 1 },
    });
  }
}

export function hoursBetweenMs(lastTick: Date | string): number {
  const last = typeof lastTick === 'string' ? DateTime.fromISO(lastTick, { zone: MOSCOW_ZONE }) : DateTime.fromJSDate(lastTick, { zone: MOSCOW_ZONE });
  const now = nowMoscow();
  const diffMs = now.toMillis() - last.toMillis();
  return diffMs / (1000 * 60 * 60);
}

/**
 * Apply server-side decay for a familiar based on real elapsed time.
 * Rules:
 *  - per 6 hours: energy -= 5, mood -= 5
 *  - if energy < 10: health -= 2 per hour
 *  - if sleeping: fatigue -= 10 per hour (min 0), energy does NOT decay
 *  - sleeping ends automatically after SLEEP_DURATION_MS real time
 * Returns the updated familiar record (not yet persisted).
 */
export function applyDecay(familiar: {
  id: string;
  energy: number;
  mood: number;
  fatigue: number;
  health: number;
  isSleeping: boolean;
  sleepStartedAt: Date | string | null;
  lastTick: Date | string;
}): {
  energy: number;
  mood: number;
  fatigue: number;
  health: number;
  isSleeping: boolean;
  sleepStartedAt: Date | string | null;
  lastTick: Date;
  changed: boolean;
} {
  const hours = hoursBetweenMs(familiar.lastTick);
  const changed = hours > 0;

  let energy = familiar.energy;
  let mood = familiar.mood;
  let fatigue = familiar.fatigue;
  let health = familiar.health;
  let isSleeping = familiar.isSleeping;
  let sleepStartedAt = familiar.sleepStartedAt;

  // Check if sleep should auto-end
  if (isSleeping && sleepStartedAt) {
    const sleepStart = typeof sleepStartedAt === 'string' ? DateTime.fromISO(sleepStartedAt, { zone: MOSCOW_ZONE }) : DateTime.fromJSDate(sleepStartedAt, { zone: MOSCOW_ZONE });
    const sleptMs = nowMoscow().toMillis() - sleepStart.toMillis();
    if (sleptMs >= GAME.SLEEP_DURATION_MS) {
      isSleeping = false;
      sleepStartedAt = null;
      fatigue = 0; // fully rested
    }
  }

  if (hours > 0) {
    if (isSleeping) {
      // Sleeping: recover fatigue, energy stable
      fatigue = clamp(fatigue - GAME.SLEEP_FATIGUE_RECOVERY_PER_HOUR * hours);
    } else {
      // Awake: normal decay
      const decayCycles = Math.floor(hours / 6);
      energy = clamp(energy - GAME.ENERGY_DECAY_PER_6H * decayCycles);
      mood = clamp(mood - GAME.MOOD_DECAY_PER_6H * decayCycles);
      // Starvation health damage per hour
      if (energy < GAME.ENERGY_STARVATION_THRESHOLD) {
        health = clamp(health - GAME.HEALTH_DECAY_WHEN_STARVING * hours);
      }
    }
  }

  return {
    energy: Math.round(energy),
    mood: Math.round(mood),
    fatigue: Math.round(fatigue),
    health: Math.round(health),
    isSleeping,
    sleepStartedAt,
    lastTick: new Date(),
    changed,
  };
}

/**
 * Recompute a familiar's decay and persist it. Used by API routes on read
 * and by the socket cron job on its hourly tick.
 */
export async function recomputeAndPersist(familiarId: string): Promise<FamiliarDTO | null> {
  const f = await db.familiar.findUnique({ where: { id: familiarId } });
  if (!f) return null;
  const decayed = applyDecay(f);
  const updated = await db.familiar.update({
    where: { id: familiarId },
    data: {
      energy: decayed.energy,
      mood: decayed.mood,
      fatigue: decayed.fatigue,
      health: decayed.health,
      isSleeping: decayed.isSleeping,
      sleepStartedAt: decayed.sleepStartedAt,
      lastTick: decayed.lastTick,
    },
  });
  return toFamiliarDTO(updated);
}

/**
 * Derive the current visible state of a familiar from its stats.
 */
export function deriveState(f: { energy: number; mood: number; fatigue: number; isSleeping: boolean }): FamiliarState {
  if (f.isSleeping) return 'sleeping';
  if (f.fatigue > GAME.FATIGUE_BLOCK_THRESHOLD) return 'tired';
  if (f.energy < 30) return 'hungry';
  if (f.mood < 30) return 'sad';
  if (f.energy > 70 && f.mood > 70 && f.fatigue < 50) return 'happy';
  return 'normal';
}

export function toFamiliarDTO(f: {
  id: string;
  userId: string;
  species: string;
  name: string;
  stage: number;
  evolutionPath: string | null;
  hiddenBuff: string | null;
  energy: number;
  mood: number;
  fatigue: number;
  health: number;
  sync: number;
  isSleeping: boolean;
  sleepStartedAt: Date | string | null;
  lastTick: Date | string;
  coins: number;
}): FamiliarDTO {
  return {
    id: f.id,
    userId: f.userId,
    species: f.species as Species,
    name: f.name,
    stage: f.stage as 1 | 2 | 3,
    evolutionPath: f.evolutionPath,
    hiddenBuff: f.hiddenBuff,
    energy: f.energy,
    mood: f.mood,
    fatigue: f.fatigue,
    health: f.health,
    sync: f.sync,
    isSleeping: f.isSleeping,
    sleepStartedAt: f.sleepStartedAt ? (f.sleepStartedAt instanceof Date ? f.sleepStartedAt.toISOString() : f.sleepStartedAt) : null,
    lastTick: f.lastTick instanceof Date ? f.lastTick.toISOString() : f.lastTick,
    coins: f.coins,
    state: deriveState(f),
  };
}

/**
 * Compute individual buffs/debuffs + party resonance for a player.
 */
export function describeIndividualBuff(stage: number, evolutionPath: string | null): string | null {
  if (stage < 1) return null;
  if (stage === 1) return '+1 к проверке Истории (1 раз в день)';
  if (stage === 2) return '+1d4 к атаке (1 раз в день)';
  return 'Переброс проваленного спасброска (1 раз в день)';
}

export function describeDebuff(health: number): string | null {
  if (health < 20) return '-1 ко всем атакам';
  return null;
}

export async function computePartyResonance(): Promise<PartyResonance> {
  const familiars = await db.familiar.findMany({ select: { mood: true } });
  const playerCount = familiars.length;
  if (playerCount === 0) {
    return { averageMood: 0, playerCount: 0, buff: null };
  }
  const avg = familiars.reduce((s, f) => s + f.mood, 0) / playerCount;
  let buff: string | null = null;
  if (avg > 80) buff = '+2 Temp HP в начале боя';
  else if (avg < 30) buff = '-1 к инициативе';
  return { averageMood: Math.round(avg), playerCount, buff };
}

export async function computeBuffs(userId: string): Promise<BuffSummary> {
  const f = await db.familiar.findUnique({ where: { userId } });
  const resonance = await computePartyResonance();
  const claim = await getDailyClaimStatus(userId);
  // Compute next-claim-at: start of next Moscow day.
  let nextClaimAt: string | null = null;
  if (claim.claimedToday) {
    nextClaimAt = nowMoscow().plus({ days: 1 }).startOf('day').toISO();
  }
  if (!f) {
    return {
      individualBuff: null,
      debuff: null,
      partyResonance: resonance,
      dailyClaim: { ...claim, nextClaimAt },
    };
  }
  return {
    individualBuff: describeIndividualBuff(f.stage, f.evolutionPath),
    debuff: describeDebuff(f.health),
    partyResonance: resonance,
    dailyClaim: { ...claim, nextClaimAt },
  };
}

/** Returns the most recent N interaction logs for a familiar (newest first). */
export async function getRecentLogs(familiarId: string, limit = 12): Promise<{ id: string; actionType: string; detail: string | null; timestamp: string }[]> {
  const logs = await db.interactionLog.findMany({
    where: { familiarId },
    orderBy: { timestamp: 'desc' },
    take: limit,
  });
  return logs.map((l) => ({
    id: l.id,
    actionType: l.actionType,
    detail: l.detail,
    timestamp: l.timestamp instanceof Date ? l.timestamp.toISOString() : l.timestamp,
  }));
}

/** Returns a lightweight roster of all players + their familiars (for party sidebar). */
export async function getPartyRoster(): Promise<{ username: string; characterName: string | null; species: string; name: string; stage: number; mood: number; energy: number; state: FamiliarState }[]> {
  const rows = await db.familiar.findMany({
    include: { user: { select: { username: true, characterName: true } } },
    orderBy: { createdAt: 'asc' },
  });
  return rows.map((f) => ({
    username: f.user.username,
    characterName: f.user.characterName,
    species: f.species,
    name: f.name,
    stage: f.stage,
    mood: f.mood,
    energy: f.energy,
    state: deriveState(f),
  }));
}
